import copy
import importlib.util
from pathlib import Path
import unittest


spec = importlib.util.spec_from_file_location('active_final_eval', Path(__file__).resolve().parents[1] / 'final_eval.py')
evaluation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation)


def report(identifier, passing=False, recall=.8, precision=.95, f1=.6, fp=3, tp=8, threshold=.5):
    metric = {'recall': recall, 'precision': precision, 'f1': f1, 'fp': fp, 'tp': tp}
    return {'roundId': identifier, 'operatingPoint': {'gatePassed': passing, 'threshold': threshold,
            'chosen': metric, 'curve': [{'threshold': .5, **metric}]}, 'candidate': metric}


def rows_for_families(count):
    categories = evaluation.CATEGORIES[1:]
    return [{'id': f'unit-{family}-{item}', 'group': f'family-{family}',
             'label': int(item % 2 == 0),
             'category': 'firm_delivery' if item % 2 == 0 else categories[(family * 2 + item // 2) % 4],
             'lengthClass': 'single' if item < 2 else 'multi'}
            for family in range(count) for item in range(4)]


class CandidateSelectionTests(unittest.TestCase):
    def test_passing_beats_diagnostic_then_recall_precision_earliest(self):
        candidates = [report('diagnostic', f1=1), report('early', True), report('late', True), report('lower', True, recall=.7)]
        self.assertEqual(evaluation.select_candidate(candidates), {'roundId': 'early', 'threshold': .5, 'diagnostic': False})
        candidates[2]['operatingPoint']['chosen'] = {'recall': .8, 'precision': .99}
        self.assertEqual(evaluation.select_candidate(candidates)['roundId'], 'late')

    def test_diagnostic_f1_false_positives_true_positives_and_earliest(self):
        candidates = [report('one', fp=4), report('two', fp=3, tp=9), report('three', fp=3, tp=10), report('four', fp=3, tp=10)]
        self.assertEqual(evaluation.select_candidate(candidates), {'roundId': 'three', 'threshold': .5, 'diagnostic': True})
        candidates[0]['operatingPoint']['curve'][0]['f1'] = .7
        self.assertEqual(evaluation.select_candidate(candidates)['roundId'], 'one')

    def test_diagnostic_uses_half_curve_not_other_operating_metrics(self):
        candidate = report('first', threshold=.8)
        candidate['candidate'] = {'f1': 1, 'fp': 0, 'tp': 15}
        self.assertEqual(evaluation.select_candidate([candidate, report('second', f1=.7)])['roundId'], 'second')
        candidate['operatingPoint']['curve'] = []
        with self.assertRaises(ValueError): evaluation.select_candidate([candidate])

    def test_no_rounds_duplicate_ids_and_invalid_gate_refused(self):
        for reports in ([], [report('same'), report('same')], [report('bad', True, precision=.8)]):
            with self.assertRaises(ValueError): evaluation.select_candidate(reports)


class FinalProfileTests(unittest.TestCase):
    def test_boundary_profile_and_intact_family_lengths(self):
        rows = rows_for_families(27)
        self.assertEqual(evaluation.validate_final_profile(rows)['labels'], {'0': 54, '1': 54})
        for malformed in (rows[:-1], rows_for_families(26), rows_for_families(31)):
            with self.assertRaises(ValueError): evaluation.validate_final_profile(malformed)
        rows[0]['lengthClass'] = 'multi'
        with self.assertRaises(ValueError): evaluation.validate_final_profile(rows)

    def test_class_and_category_shortfalls(self):
        rows = rows_for_families(27)
        for row in rows:
            if not row['label']:
                row['category'] = 'request'
        with self.assertRaises(ValueError): evaluation.validate_final_profile(rows)
        rows = rows_for_families(27)
        for row in [row for row in rows if row['label']][:5]:
            row.update(label=0, category='other')
        with self.assertRaises(ValueError): evaluation.validate_final_profile(rows)


class AggregateTests(unittest.TestCase):
    def setUp(self):
        self.rows = rows_for_families(2)
        self.scores = {name: [float(row['label']) for row in self.rows] for name in evaluation.MODEL_NAMES}
        self.thresholds = {name: .5 for name in evaluation.MODEL_NAMES}
        self.gates = {name: True for name in evaluation.MODEL_NAMES}

    def evaluate(self):
        return evaluation.evaluate_predictions(self.rows, self.scores, self.thresholds, self.gates)

    def test_confusion_slices_family_accuracy_and_paired_zero_intervals(self):
        result = self.evaluate()
        self.assertEqual(result['results']['candidate']['metrics']['tp'], 4)
        self.assertEqual(result['results']['candidate']['families']['allCorrect'], 2)
        for comparison in result['pairedBootstrap']['comparisons'].values():
            for metric in comparison.values():
                self.assertEqual(metric['percentile95'], [0.0, 0.0])
                self.assertEqual(metric['finiteReplicates'], 10000)
        self.scores['candidate'][1] = 1.0
        result = self.evaluate()['results']['candidate']
        self.assertEqual(result['metrics']['fp'], 1)
        self.assertEqual(result['lengthClasses']['single']['errors'], 1)
        self.assertEqual(result['families']['allCorrectRate'], .5)
        self.assertEqual(result['families']['meanPassageAccuracy'], .875)

    def test_undefined_precision_counted_without_nan_and_determinism(self):
        self.scores['candidate'] = [0.] * len(self.rows)
        first = self.evaluate()
        precision = first['pairedBootstrap']['comparisons']['candidate']['precision']
        self.assertIsNone(precision['pointDelta'])
        self.assertIsNone(precision['percentile95'])
        self.assertEqual(precision['undefinedModelReplicates'], 10000)
        self.assertEqual(precision['undefinedC42Replicates'], 0)
        self.assertEqual(first, self.evaluate())

    def test_whole_family_sampling_is_paired(self):
        self.scores['candidate'][:4] = [1. - score for score in self.scores['candidate'][:4]]
        delta = self.evaluate()['pairedBootstrap']['comparisons']['candidate']['recall']
        self.assertEqual(delta['pointDelta'], -.5)
        self.assertEqual(delta['percentile95'], [-1., 0.])

    def test_dev_failure_cannot_pass_final_gate(self):
        self.gates['candidate'] = False
        self.assertFalse(self.evaluate()['results']['candidate']['researchGatePassed'])

    def test_bad_predictions_and_reference_schema_refused(self):
        original = copy.deepcopy(self.scores)
        for bad in (float('nan'), float('inf'), 1.1, True):
            self.scores['candidate'][0] = bad
            with self.assertRaises(ValueError): self.evaluate()
        self.scores = original
        self.scores['candidate'].pop()
        with self.assertRaises(ValueError): self.evaluate()
        self.scores = copy.deepcopy(original)
        self.rows[1]['id'] = self.rows[0]['id']
        with self.assertRaises(ValueError): self.evaluate()


if __name__ == '__main__':
    unittest.main()
