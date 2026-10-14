import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { predict, binaryMetrics, validateModel } from './inference.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const hash = value => createHash('sha256').update(value).digest('hex');
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));
if (!args.data || !args.out) throw new Error('Usage: node runner.mjs --data PATH --out PATH [--challenge PATH] [--model PATH]');
const raw = await readFile(args.data);
const rows = JSON.parse(raw);
const modelRaw = await readFile(args.model ?? resolve(here, 'artifacts/model.json'));
const model = validateModel(JSON.parse(modelRaw));
if (!Array.isArray(rows) || !rows.length || rows.some(r => ![0, 1].includes(r.label) || typeof r.text !== 'string')) {
  throw new Error('Evaluation expects a nonempty JSON array with text and binary label.');
}
if (rows.some(r => typeof r.id !== 'string' || !r.id || typeof r.group !== 'string' || !r.group ||
  !['train', 'dev', 'test'].includes(r.split) ||
  !['firm_delivery', 'qualified_delivery', 'request', 'reported', 'other'].includes(r.category) ||
  (r.category === 'firm_delivery') !== Boolean(r.label))) throw new Error('Invalid evaluation schema or label/category mismatch.');
if (rows.some(r => r.split === 'test') && !rows.every(r => r.split === 'test')) throw new Error('Do not mix independent test with training/development.');
if (new Set(rows.map(r => r.id)).size !== rows.length) throw new Error('Duplicate evaluation IDs.');
const trainRows = JSON.parse(await readFile(args.training ?? resolve(here, 'data/train-dev.json')));
const normalize = text => text.toLowerCase().trim().replace(/\s+/g, ' ');
const trainTexts = new Set(trainRows.map(r => normalize(r.text)));
const trainGroups = new Set(trainRows.map(r => r.group));
const overlaps = { normalizedTextDuplicates: rows.filter(r => trainTexts.has(normalize(r.text))).length,
  groupOverlaps: rows.filter(r => trainGroups.has(r.group)).length,
  duplicateEvaluationTexts: rows.length - new Set(rows.map(r => normalize(r.text))).size };
if (rows.every(r => r.split === 'test') && Object.values(overlaps).some(Boolean)) throw new Error('Independent test overlap detected; refusing primary metrics.');
const vite = await createServer({ root, configFile: false, logLevel: 'silent',
  cacheDir: resolve(root, 'work/commitment-classifier-vite-cache'),
  server: { middlewareMode: true }, appType: 'custom' });
try {
  const { checkDraft } = await vite.ssrLoadModule('/web/src/engine/index.ts');
  const results = rows.map(row => {
    const result = predict(row.text, model);
    if (result.category === 'abstain') throw new Error('Invalid primary evaluation input; report would exclude a row.');
    return { row, learned: Number(result.category === 'firm_delivery'),
      rules: Number(checkDraft(row.text).findings.some(finding => finding.ruleId === 'commitment-confirmation')) };
  });
  const report = {
    scope: 'Synthetic author-labelled wording classification; not real-user validation, finding usefulness, truth or risk.',
    baselineCaveat: 'Actual unchanged checkDraft commitment-confirmation finding targets product delivery, pricing and capability concerns and deliberately suppresses routine notes/document handoffs. This experiment labels all author-owned future work-item delivery. Baseline disagreement includes task mismatch and cannot establish improvement to the live checker.',
    evidenceUnit: 'Whole supplied bounded passage, not learned span localization.',
    dataSha256: hash(raw), modelSha256: hash(modelRaw), n: rows.length, threshold: model.threshold,
    devGatePassed: model.devGatePassed, splitAudit: overlaps,
    learned: binaryMetrics(rows.map(r => r.label), results.map(r => r.learned)),
    existingRules: binaryMetrics(rows.map(r => r.label), results.map(r => r.rules)),
    alwaysNegative: binaryMetrics(rows.map(r => r.label), rows.map(() => 0)),
    splits: Object.fromEntries([...new Set(rows.map(r => r.split))].sort().map(split => {
      const subset = results.filter(r => r.row.split === split);
      return [split, { learned: binaryMetrics(subset.map(r => r.row.label), subset.map(r => r.learned)),
        existingRules: binaryMetrics(subset.map(r => r.row.label), subset.map(r => r.rules)) }];
    })),
    categories: Object.fromEntries([...new Set(rows.map(r => r.category))].sort().map(category => {
      const subset = results.filter(r => r.row.category === category);
      return [category, { learned: binaryMetrics(subset.map(r => r.row.label), subset.map(r => r.learned)),
        existingRules: binaryMetrics(subset.map(r => r.row.label), subset.map(r => r.rules)) }];
    })),
    disagreement: {
      learnedOnly: results.filter(r => r.learned && !r.rules).length,
      rulesOnly: results.filter(r => !r.learned && r.rules).length,
      learnedCorrectRulesWrong: results.filter(r => r.learned === r.row.label && r.rules !== r.row.label).length,
      rulesCorrectLearnedWrong: results.filter(r => r.rules === r.row.label && r.learned !== r.row.label).length,
    },
  };
  if (args.challenge) {
    const challengeRaw = await readFile(args.challenge);
    const challenge = JSON.parse(challengeRaw);
    if (!Array.isArray(challenge) || challenge.some(r => r.label !== null || typeof r.text !== 'string')) throw new Error('Challenge labels must be null.');
    const predictions = challenge.map(r => predict(r.text, model));
    report.ambiguityChallenge = { n: challenge.length, dataSha256: hash(challengeRaw),
      note: 'Excluded from primary accuracy metrics. Model forces a binary classification for valid ambiguous inputs; no semantic abstention.',
      firmDelivery: predictions.filter(r => r.category === 'firm_delivery').length,
      other: predictions.filter(r => r.category === 'other').length,
      invalidInputAbstentions: predictions.filter(r => r.category === 'abstain').length,
      existingRuleFlags: challenge.filter(r => checkDraft(r.text).findings.some(f => f.ruleId === 'commitment-confirmation')).length };
  }
  await mkdir(dirname(resolve(args.out)), { recursive: true });
  await writeFile(args.out, JSON.stringify(report, null, 2) + '\n');
  // Deliberately aggregate-only: no fixture text, IDs, labels or per-case output.
  console.log(JSON.stringify(report));
} finally {
  await vite.close();
}
