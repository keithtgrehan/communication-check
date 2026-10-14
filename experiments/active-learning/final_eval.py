"""Pure candidate selection and aggregate evaluation; no file or model access."""
from collections import Counter, defaultdict
import math

import numpy as np


CATEGORIES = ('firm_delivery', 'qualified_delivery', 'request', 'reported', 'other')
MODEL_NAMES = ('A', 'B', 'C42', 'candidate')
BOOTSTRAP_REPLICATES = 10_000
BOOTSTRAP_SEED = 42


def _number(value, name, low=0, high=1):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f'Invalid {name}.')
    return float(value)


def select_candidate(round_reports):
    """Select a NEW candidate; input order is chronological unless roundNumber exists.

    Reports use the existing adapter's operatingPoint/candidate fields, plus
    roundId (or runId). Empty input has no selectable candidate and is refused.
    This function never promotes a candidate or replaces the C42 incumbent.
    """
    if not isinstance(round_reports, list) or not round_reports:
        raise ValueError('No completed round reports to select.')
    seen = set()
    passing, diagnostic = [], []
    for position, report in enumerate(round_reports):
        identifier = report.get('roundId', report.get('runId'))
        if not isinstance(identifier, str) or not identifier or identifier in seen:
            raise ValueError('Round identifiers must be nonempty and distinct.')
        seen.add(identifier)
        order = report.get('roundNumber', position + 1)
        if type(order) is not int or order < 1:
            raise ValueError('Invalid chronological round number.')
        point = report['operatingPoint']
        if type(point['gatePassed']) is not bool:
            raise ValueError('Development gate must be a boolean.')
        threshold = _number(point['threshold'], 'threshold')
        if point['gatePassed']:
            metric = point.get('chosen', report.get('candidate'))
            recall = _number(metric['recall'], 'recall')
            precision = _number(metric['precision'], 'precision')
            if recall < .7 or precision < .9:
                raise ValueError('Passing development gate contradicts its metrics.')
            passing.append(((recall, precision, -order, -position), identifier, threshold))
        else:
            curve = point.get('curve', [])
            halves = [entry for entry in curve if entry['threshold'] == .5]
            if len(halves) > 1:
                raise ValueError('Duplicate diagnostic operating point.')
            metric = halves[0] if halves else report.get('candidate') if threshold == .5 else None
            if metric is None:
                raise ValueError('Diagnostic selection requires metrics at threshold 0.50.')
            f1 = _number(metric['f1'], 'F1')
            if any(type(metric[key]) is not int or metric[key] < 0 for key in ('fp', 'tp')):
                raise ValueError('Invalid diagnostic confusion counts.')
            diagnostic.append(((f1, -metric['fp'], metric['tp'], -order, -position), identifier, .5))
    selected = max(passing or diagnostic, key=lambda entry: entry[0])
    return {'roundId': selected[1], 'threshold': selected[2], 'diagnostic': not bool(passing)}


def _validate_rows(rows):
    if not isinstance(rows, list) or not rows:
        raise ValueError('Expected nonempty evaluation rows.')
    identifiers, families = set(), defaultdict(list)
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError('Invalid evaluation row.')
        if any(not isinstance(row.get(key), str) or not row[key] for key in ('id', 'group')):
            raise ValueError('Evaluation IDs and family IDs are required.')
        if row['id'] in identifiers:
            raise ValueError('Duplicate evaluation ID.')
        if type(row.get('label')) is not int or row['label'] not in (0, 1):
            raise ValueError('Evaluation labels must be binary integers.')
        if row.get('category') not in CATEGORIES or (row['category'] == 'firm_delivery') != bool(row['label']):
            raise ValueError('Evaluation label and category disagree.')
        if row.get('lengthClass') not in ('single', 'multi'):
            raise ValueError('Declared single/multi length class is required.')
        identifiers.add(row['id'])
        families[row['group']].append(row)
    return families


def validate_final_profile(rows):
    """Validate accepted, agreement-filtered final references; never author labels.

    The controller separately verifies that the original authored pool contained
    exactly 120 rows, and audits text, admission, overlap and reference provenance.
    """
    families = _validate_rows(rows)
    if not 27 <= len(families) <= 30 or not 108 <= len(rows) <= 120:
        raise ValueError('Final references require 27–30 complete families / 108–120 rows.')
    for members in families.values():
        if len(members) != 4 or Counter(row['lengthClass'] for row in members) != {'single': 2, 'multi': 2}:
            raise ValueError('Every final family requires four rows, two of each length class.')
    labels = Counter(row['label'] for row in rows)
    categories = Counter(row['category'] for row in rows)
    if any(labels[label] < 50 for label in (0, 1)):
        raise ValueError('Final references require at least 50 rows per class.')
    if any(categories[category] < 10 for category in CATEGORIES[1:]):
        raise ValueError('Final references require at least ten of every negative category.')
    return {'rows': len(rows), 'families': len(families),
            'labels': {str(label): labels[label] for label in (0, 1)},
            'categories': {category: categories[category] for category in CATEGORIES},
            'lengthClasses': dict(Counter(row['lengthClass'] for row in rows))}


def _metrics(labels, predictions):
    tp = sum(label == 1 and prediction == 1 for label, prediction in zip(labels, predictions))
    fp = sum(label == 0 and prediction == 1 for label, prediction in zip(labels, predictions))
    tn = sum(label == 0 and prediction == 0 for label, prediction in zip(labels, predictions))
    fn = sum(label == 1 and prediction == 0 for label, prediction in zip(labels, predictions))
    return {'n': len(labels), 'tp': tp, 'fp': fp, 'tn': tn, 'fn': fn,
            'precision': tp / (tp + fp) if tp + fp else None,
            'recall': tp / (tp + fn) if tp + fn else None,
            'f1': 2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else 0.0,
            'accuracy': (tp + tn) / len(labels) if labels else None,
            'errors': fp + fn}


def _bootstrap_metrics(counts):
    tp, fp, tn, fn = counts.T
    def divide(numerator, denominator, undefined=np.nan):
        return np.divide(numerator, denominator, out=np.full_like(numerator, undefined, dtype=float), where=denominator != 0)
    return {'precision': divide(tp, tp + fp), 'recall': divide(tp, tp + fn),
            'f1': divide(2 * tp, 2 * tp + fp + fn, 0.0)}


def evaluate_predictions(rows, scores_by_name, thresholds, dev_passed_by_name):
    """Aggregate already-produced predictions; no final-profile gate or model I/O.

    Call validate_final_profile BEFORE obtaining scores. This pure function also
    accepts tiny unit fixtures. All four score lists follow the supplied row order.
    Bootstrap resamples whole families, identically for all models, 10,000 times.
    """
    families = _validate_rows(rows)
    for mapping in (scores_by_name, thresholds, dev_passed_by_name):
        if set(mapping) != set(MODEL_NAMES):
            raise ValueError('Expected exactly A, B, C42 and candidate.')
    labels = [row['label'] for row in rows]
    positions = {group: [index for index, row in enumerate(rows) if row['group'] == group] for group in sorted(families)}
    results, family_counts = {}, {}
    for name in MODEL_NAMES:
        threshold = _number(thresholds[name], 'threshold')
        if type(dev_passed_by_name[name]) is not bool:
            raise ValueError('Development gate must be boolean.')
        scores = scores_by_name[name]
        if len(scores) != len(rows):
            raise ValueError('Score count differs from reference count.')
        predictions = [int(_number(score, 'score') >= threshold) for score in scores]
        metric = _metrics(labels, predictions)
        def slice_metrics(field, values):
            return {value: _metrics([labels[index] for index, row in enumerate(rows) if row[field] == value],
                                   [predictions[index] for index, row in enumerate(rows) if row[field] == value]) for value in values}
        categories = slice_metrics('category', CATEGORIES)
        length_classes = slice_metrics('lengthClass', ('single', 'multi'))
        by_family = [_metrics([labels[index] for index in indices], [predictions[index] for index in indices]) for indices in positions.values()]
        family_counts[name] = np.asarray([[entry[key] for key in ('tp', 'fp', 'tn', 'fn')] for entry in by_family], dtype=np.int64)
        exact = sum(entry['errors'] == 0 for entry in by_family)
        results[name] = {'metrics': metric, 'categories': categories, 'lengthClasses': length_classes,
                         'families': {'n': len(families), 'allCorrect': exact, 'allCorrectRate': exact / len(families),
                                      'meanPassageAccuracy': sum(entry['accuracy'] for entry in by_family) / len(families)},
                         'threshold': threshold, 'devGatePassed': dev_passed_by_name[name],
                         'researchGatePassed': bool(dev_passed_by_name[name] and metric['precision'] is not None
                              and metric['precision'] >= .9 and metric['recall'] is not None and metric['recall'] >= .7
                              and categories['request']['n'] > 0 and categories['reported']['n'] > 0
                              and categories['request']['fp'] == 0 and categories['reported']['fp'] == 0)}
    draws = np.random.default_rng(BOOTSTRAP_SEED).integers(0, len(families), size=(BOOTSTRAP_REPLICATES, len(families)))
    bootstrap = {name: _bootstrap_metrics(counts[draws].sum(axis=1)) for name, counts in family_counts.items()}
    comparisons = {}
    for name in MODEL_NAMES:
        if name == 'C42':
            continue
        differences = {}
        for measure in ('precision', 'recall', 'f1'):
            reference, current = bootstrap['C42'][measure], bootstrap[name][measure]
            delta = current - reference
            finite = np.isfinite(delta)
            point, base = results[name]['metrics'][measure], results['C42']['metrics'][measure]
            differences[measure] = {
                'pointDelta': point - base if point is not None and base is not None else None,
                'finiteReplicates': int(finite.sum()), 'undefinedDeltaReplicates': int((~finite).sum()),
                'undefinedModelReplicates': int((~np.isfinite(current)).sum()),
                'undefinedC42Replicates': int((~np.isfinite(reference)).sum()),
                'percentile95': [float(value) for value in np.percentile(delta[finite], [2.5, 97.5])] if finite.any() else None}
        comparisons[name] = differences
    return {'scope': 'Agreement-filtered synthetic wording classification; not human or product validation.',
            'rows': len(rows), 'families': len(families), 'results': results,
            'pairedBootstrap': {'replicates': BOOTSTRAP_REPLICATES, 'seed': BOOTSTRAP_SEED,
                                'unit': 'whole family', 'reference': 'C42', 'comparisons': comparisons,
                                'interpretation': 'Exploratory percentile intervals over finite paired deltas; undefined replicates are excluded and counted. Shared synthetic-author bias is not measured.'}}
