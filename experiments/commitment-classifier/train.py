#!/usr/bin/env python3
"""Offline lexical training, dev-only operating point, portable JSON export."""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


def tokens(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?|[0-9]+", text.lower().replace('’', "'"))


def validate(rows):
    ids = set()
    seen_text = set()
    group_splits = {}
    for row in rows:
        if row['id'] in ids:
            raise ValueError('Duplicate record ID')
        ids.add(row['id'])
        canonical = ' '.join(row['text'].lower().split())
        if canonical in seen_text:
            raise ValueError('Duplicate text across dataset')
        seen_text.add(canonical)
        if row['split'] not in ('train', 'dev') or row['label'] not in (0, 1):
            raise ValueError('Training accepts only train/dev rows with binary labels')
        if not row['text'].strip() or len(row['text'].encode('utf-16-le')) // 2 > 2000:
            raise ValueError('Invalid passage length')
        if row['group'] in group_splits and group_splits[row['group']] != row['split']:
            raise ValueError('Group leakage between train and dev')
        group_splits[row['group']] = row['split']
        if (row['category'] == 'firm_delivery') != bool(row['label']):
            raise ValueError('Label/category mismatch')
    for split in ('train', 'dev'):
        if {r['label'] for r in rows if r['split'] == split} != {0, 1}:
            raise ValueError('Both labels required in each split')


def metrics(labels, predictions):
    tp = sum(y == 1 and p == 1 for y, p in zip(labels, predictions))
    fp = sum(y == 0 and p == 1 for y, p in zip(labels, predictions))
    tn = sum(y == 0 and p == 0 for y, p in zip(labels, predictions))
    fn = sum(y == 1 and p == 0 for y, p in zip(labels, predictions))
    return dict(n=len(labels), tp=tp, fp=fp, tn=tn, fn=fn,
                precision=tp / (tp + fp) if tp + fp else None,
                recall=tp / (tp + fn) if tp + fn else None)


def train(data, out):
    raw = Path(data).read_bytes()
    rows = json.loads(raw)
    validate(rows)
    training = sorted([r for r in rows if r['split'] == 'train'], key=lambda r: r['id'])
    dev = sorted([r for r in rows if r['split'] == 'dev'], key=lambda r: r['id'])
    vectorizer = TfidfVectorizer(tokenizer=tokens, token_pattern=None, lowercase=False,
                                 ngram_range=(1, 2), norm='l2', smooth_idf=True)
    x = vectorizer.fit_transform([r['text'] for r in training])
    classifier = LogisticRegression(C=1.0, solver='liblinear', class_weight='balanced', random_state=42,
                                    max_iter=1000, tol=1e-8)
    classifier.fit(x, [r['label'] for r in training])
    dev_scores = classifier.predict_proba(vectorizer.transform([r['text'] for r in dev]))[:, 1]
    thresholds = [i / 100 for i in range(50, 91, 5)]
    operating_points = [dict(threshold=t, **metrics([r['label'] for r in dev], (dev_scores >= t).astype(int).tolist())) for t in thresholds]
    eligible = [r for r in operating_points if r['precision'] is not None and r['precision'] >= .9]
    chosen = max(eligible, key=lambda r: (r['recall'], r['threshold'])) if eligible else operating_points[-1]
    model = dict(format='communication-check-tfidf-logistic-v1', task='author_unqualified_future_delivery',
                 vocabulary={k: int(v) for k, v in vectorizer.vocabulary_.items()}, idf=vectorizer.idf_.tolist(),
                 coefficients=classifier.coef_[0].tolist(), intercept=float(classifier.intercept_[0]),
                 threshold=chosen['threshold'], devGatePassed=bool(eligible),
                 trainingDataSha256=hashlib.sha256(raw).hexdigest(),
                 settings=dict(ngramRange=[1, 2], solver='liblinear', C=1, classWeight='balanced', seed=42,
                               maxIter=1000, tolerance=1e-8, tokenPattern="[a-z]+(?:'[a-z]+)?|[0-9]+"),
                 versions=dict(python=sys.version.split()[0], numpy=np.__version__, sklearn=sklearn.__version__))
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    model_bytes = (json.dumps(model, sort_keys=True, indent=2) + '\n').encode()
    (out / 'model.json').write_bytes(model_bytes)
    (out / 'model.mjs').write_text('export default ' + json.dumps(model, sort_keys=True) + ';\n')
    # Training/development examples only. Never write independent test text or predictions here.
    all_scores = classifier.predict_proba(vectorizer.transform([r['text'] for r in rows]))[:, 1]
    parity = [dict(id=row['id'], text=row['text'], score=float(score)) for row, score in zip(rows, all_scores)]
    (out / 'parity.json').write_text(json.dumps(parity, indent=2) + '\n')
    summary = dict(modelSha256=hashlib.sha256(model_bytes).hexdigest(), trainingDataSha256=model['trainingDataSha256'],
                   counts={s: len([r for r in rows if r['split'] == s]) for s in ('train', 'dev')},
                   thresholdPolicy='Precision >= 0.90, then maximum recall, then larger threshold; fallback 0.90 with failed dev gate.',
                   chosen=chosen, devGatePassed=bool(eligible), operatingPoints=operating_points,
                   vocabularySize=len(model['vocabulary']), iterations=classifier.n_iter_.tolist())
    (out / 'training-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    train(args.data, args.out)
