import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { predict, tokens, features, binaryMetrics, validateModel } from '../inference.mjs';

const toy = { vocabulary: { ship: 0, 'will ship': 1 }, idf: [1, 2], coefficients: [1, 2], intercept: -1, threshold: .6 };

test('malformed models fail before producing a misleading classification', () => {
  const valid = { ...toy, format: 'communication-check-tfidf-logistic-v1' };
  assert.equal(validateModel(valid), valid);
  for (const model of [null, {}, { ...valid, coefficients: [1] }, { ...valid, threshold: NaN },
    { ...valid, idf: [1, Infinity] }, { ...valid, vocabulary: { ship: 0, 'will ship': 0 } },
    { ...valid, vocabulary: { ship: 0, 'will ship': 2 } }]) assert.throws(() => validateModel(model), /Invalid/);
});

test('token and bigram contract preserves negation, curly apostrophes and numbers', () => {
  assert.deepEqual(tokens('We WON’T ship API v2.'), ['we', "won't", 'ship', 'api', 'v', '2']);
  assert.deepEqual(features('We will ship'), ['we', 'will', 'ship', 'we will', 'will ship']);
});

test('learned weights, counts, IDF and L2 normalization determine prediction', () => {
  const result = predict('will ship ship', toy);
  const margin = -1 + 2 / Math.sqrt(8) + 4 / Math.sqrt(8);
  assert.ok(Math.abs(result.score - 1 / (1 + Math.exp(-margin))) < 1e-14);
  assert.equal(result.category, 'firm_delivery');
  assert.equal(predict('will ship ship', { ...toy, coefficients: [-1, -2] }).category, 'other');
});

test('exact UTF-16 evidence retains emoji, whitespace and repeated passages', () => {
  const text = '  🚀 We will ship.\nWe will ship.  ';
  const result = predict(text, toy);
  assert.equal(text.slice(result.quote.start, result.quote.end), result.quote.text);
  assert.equal(result.quote.end, text.length);
  assert.equal(result.quote.text, text);
});

test('empty and over-limit passages abstain; lexical unknowns do not imply semantic abstention', () => {
  assert.equal(predict(' ', toy).category, 'abstain');
  assert.equal(predict('a'.repeat(2001), toy).category, 'abstain');
  assert.equal(predict('a'.repeat(2000), toy).category, 'other');
  assert.equal(predict('🦋', toy).category, 'other');
});

test('metric denominators and no-positive predictions stay honest', () => {
  assert.deepEqual(binaryMetrics([1, 1, 0, 0], [1, 0, 1, 0]), { n: 4, tp: 1, fp: 1, tn: 1, fn: 1,
    precision: .5, recall: .5, f1: .5, accuracy: .5, falsePositiveRate: .5 });
  assert.equal(binaryMetrics([1, 0], [0, 0]).precision, null);
});

test('exported browser inference matches all Python TRAIN/dev scores', async () => {
  const model = JSON.parse(await readFile(new URL('../artifacts/model.json', import.meta.url)));
  const parity = JSON.parse(await readFile(new URL('../artifacts/parity.json', import.meta.url)));
  assert.ok(parity.length >= 100);
  for (const row of parity) assert.ok(Math.abs(predict(row.text, model).score - row.score) < 1e-12, row.id);
});

test('browser module exports the identical frozen JSON model', async () => {
  const model = JSON.parse(await readFile(new URL('../artifacts/model.json', import.meta.url)));
  const browserModel = (await import('../artifacts/model.mjs')).default;
  assert.deepEqual(browserModel, model);
});
