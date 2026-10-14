/** Trainable lexical classifier. No classification keyword rules or network/storage calls. */
export const MAX_LENGTH = 2000;

export function validateModel(model) {
  const fail = () => { throw new Error('Invalid or incompatible classifier artifact.'); };
  if (!model || model.format !== 'communication-check-tfidf-logistic-v1' ||
      typeof model.vocabulary !== 'object' || model.vocabulary === null ||
      !Array.isArray(model.idf) || !Array.isArray(model.coefficients) ||
      model.idf.length !== model.coefficients.length || !model.idf.length ||
      !Number.isFinite(model.intercept) || !Number.isFinite(model.threshold) || model.threshold < 0 || model.threshold > 1 ||
      model.idf.some(v => !Number.isFinite(v) || v <= 0) || model.coefficients.some(v => !Number.isFinite(v))) fail();
  const indices = Object.values(model.vocabulary);
  if (indices.length !== model.idf.length || new Set(indices).size !== indices.length ||
      indices.some(i => !Number.isInteger(i) || i < 0 || i >= model.idf.length)) fail();
  return model;
}

export function tokens(text) {
  return text.toLowerCase().replaceAll('’', "'").match(/[a-z]+(?:'[a-z]+)?|[0-9]+/g) ?? [];
}

export function features(text) {
  const words = tokens(text);
  return [...words, ...words.slice(1).map((word, index) => `${words[index]} ${word}`)];
}

export function predict(text, model) {
  if (typeof text !== 'string') throw new TypeError('Expected a text passage.');
  const quote = { start: 0, end: text.length, text };
  if (!text.trim() || text.length > MAX_LENGTH) {
    return { category: 'abstain', score: null, threshold: model.threshold, quote,
      reason: !text.trim() ? 'Enter a short passage.' : `Use at most ${MAX_LENGTH} characters.` };
  }
  const counts = new Map();
  for (const feature of features(text)) {
    const index = model.vocabulary[feature];
    if (Number.isInteger(index)) counts.set(index, (counts.get(index) ?? 0) + 1);
  }
  let squared = 0;
  for (const [index, count] of counts) squared += (count * model.idf[index]) ** 2;
  const norm = Math.sqrt(squared);
  let margin = model.intercept;
  if (norm) for (const [index, count] of counts) margin += count * model.idf[index] / norm * model.coefficients[index];
  const score = margin >= 0 ? 1 / (1 + Math.exp(-margin)) : Math.exp(margin) / (1 + Math.exp(margin));
  return { category: score >= model.threshold ? 'firm_delivery' : 'other', score, threshold: model.threshold, quote,
    hasKnownFeatures: counts.size > 0 };
}

export function binaryMetrics(labels, predictions) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  labels.forEach((label, i) => { if (label) { if (predictions[i]) tp++; else fn++; } else if (predictions[i]) fp++; else tn++; });
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  return { n: labels.length, tp, fp, tn, fn, precision, recall,
    f1: precision !== null && recall !== null && precision + recall ? 2 * precision * recall / (precision + recall) : 0,
    accuracy: labels.length ? (tp + tn) / labels.length : null,
    falsePositiveRate: fp + tn ? fp / (fp + tn) : null };
}
