"""Handbuilt unit fixtures only: no authored pool, saved model or heldout reads."""
from collections import Counter
import copy
import importlib.util
from pathlib import Path
import random
import tempfile
import unittest


spec = importlib.util.spec_from_file_location('active_core_unit', Path(__file__).resolve().parents[1] / 'core.py')
core = importlib.util.module_from_spec(spec)
spec.loader.exec_module(core)


def fixture_rows(families=12):
    return [{'id': f'unit-{family}-{item}', 'group': f'family-{family:02d}',
             'text': f'Unitfixture{family} item{item}: Café 🚀 has phrase{family}{item}.',
             'lengthClass': 'single' if item < 2 else 'multi'}
            for family in range(families) for item in range(4)]


def pool(rows):
    return {'schemaVersion': 2, 'author': {'actorId': 'unit-author', 'model': 'test'},
            'syntheticOnly': True, 'examples': rows}


def review_fixture(rows):
    packets, mappings, hashes, annotations = {}, {}, {}, {}
    for role in ('teacher', 'reviewer'):
        packets[role], mappings[role] = core.make_packet(rows, 'unit-context', role)
        hashes[role] = core.digest(packets[role])
        annotations[role] = {'schemaVersion': 2, 'packetSha256': hashes[role],
            'actor': {'actorId': f'unit-{role}', 'model': 'test'}, 'decisions': []}
        for index, row in enumerate(rows):
            label = int(index % 2 == 0)
            annotations[role]['decisions'].append({'id': mappings[role][row['id']], 'status': 'clear',
                'label': label, 'category': 'firm_delivery' if label else 'request',
                'rationale': 'Unit assertion.', 'evidence': ['Café 🚀']})
    return annotations, packets, mappings, hashes


class AcquisitionTests(unittest.TestCase):
    def setUp(self):
        self.rows = fixture_rows(35)
        self.scores = {'A': [.9] * len(self.rows), 'B': [.1] * len(self.rows),
                       'current': [.8] * len(self.rows)}
        self.thresholds = {'A': .5, 'B': .5, 'current': .5}

    def acquire(self, used=(), round_number=1):
        return core.acquire(self.rows, self.scores, self.thresholds, used, round_number)

    def test_random_first_and_exact_quotas_are_deterministic(self):
        result = self.acquire()
        expected = random.Random(core.seed_for('random-1')).sample(sorted({row['group'] for row in self.rows}), 2)
        self.assertEqual([group for group, route in result['groups'].items() if route == 'random'], expected)
        self.assertEqual(Counter(result['groups'].values()), {'random': 2, 'disagreement': 5, 'uncertainty': 3})
        self.assertEqual(len(result['exampleIds']), 40)
        self.assertEqual(result, self.acquire())
        self.scores['current'] = [.1] * len(self.rows)
        self.assertEqual([group for group, route in self.acquire()['groups'].items() if route == 'random'], expected)

    def test_disagreement_shortfall_transfers_only_to_uncertainty(self):
        self.scores['B'] = self.scores['A'].copy()
        result = self.acquire()
        self.assertEqual(Counter(result['groups'].values()), {'random': 2, 'uncertainty': 8})
        self.assertEqual(result['fallbackUncertaintyFamilies'], 5)
        selected_random = {group for group, route in result['groups'].items() if route == 'random'}
        target = next(row['group'] for row in self.rows if row['group'] not in selected_random)
        self.scores['B'] = [.1 if row['group'] == target else .9 for row in self.rows]
        result = self.acquire()
        self.assertEqual(result['groups'][target], 'disagreement')
        self.assertEqual(result['fallbackUncertaintyFamilies'], 4)
        self.assertEqual(Counter(result['groups'].values()), {'random': 2, 'disagreement': 1, 'uncertainty': 7})

    def test_saved_model_thresholds_and_family_minimum_distance(self):
        self.thresholds.update(A=.95, B=.05, current=.75)
        result = self.acquire()
        self.assertTrue(all(stat['disagreements'] == 4 for stat in result['stats'].values()))
        random_groups = {group for group, route in result['groups'].items() if route == 'random'}
        self.scores['A'] = self.scores['B'] = [.5] * len(self.rows)
        self.thresholds.update(A=.5, B=.5)
        target = next(row['group'] for row in self.rows if row['group'] not in random_groups)
        index = next(index for index, row in enumerate(self.rows) if row['group'] == target)
        self.scores['current'][index] = .75
        result = self.acquire()
        self.assertEqual(result['stats'][target]['distance'], 0)
        self.assertEqual(next(group for group, route in result['groups'].items() if route == 'uncertainty'), target)

    def test_used_families_never_return_and_exhaustion_stops(self):
        queried = set()
        for round_number in (1, 2, 3):
            result = self.acquire(queried, round_number)
            self.assertFalse(queried & set(result['groups']))
            queried.update(result['groups'])
        self.assertEqual(len(queried), 30)
        self.assertEqual(self.acquire(queried), {'stop': 'insufficient_pool', 'availableFamilies': 5})

    def test_partial_family_invalid_vectors_nonfinite_and_round_cap(self):
        for bad in (0, 4, True, 1.0):
            with self.assertRaises(ValueError): self.acquire(round_number=bad)
        for bad in (float('nan'), float('inf'), -.01, 1.01):
            self.scores['current'][0] = bad
            with self.assertRaises(ValueError): self.acquire()
        self.scores['current'][0] = .8
        self.thresholds['A'] = float('nan')
        with self.assertRaises(ValueError): self.acquire()
        self.thresholds['A'] = .5
        self.rows.pop()
        with self.assertRaises(ValueError): self.acquire()
        for values in self.scores.values(): values.pop()
        with self.assertRaises(ValueError): self.acquire()


class PoolAndOverlapTests(unittest.TestCase):
    def test_exact_schema_and_complete_four_member_two_length_families(self):
        rows = fixture_rows(2)
        self.assertEqual(core.validate_pool(pool(rows), 8), rows)
        for changed in (rows[:-1], rows + [copy.deepcopy(rows[0])]):
            with self.assertRaises(ValueError): core.validate_pool(pool(changed), len(changed))
        rows[0]['lengthClass'] = 'multi'
        with self.assertRaises(ValueError): core.validate_pool(pool(rows), 8)
        rows = fixture_rows(2)
        rows[0]['intendedLabel'] = 1
        with self.assertRaises(ValueError): core.validate_pool(pool(rows), 8)
        with self.assertRaises(ValueError): core.validate_pool(pool(fixture_rows(2)), 12)

    def test_exact_within_family_and_near_across_quarantine_both_families(self):
        rows = fixture_rows(2)
        admissions = [{'admitted': True}] * len(rows)
        rows[0]['text'] = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa'
        rows[1]['text'] = rows[0]['text'] + ' extra'
        self.assertEqual(core.overlap_reasons(rows, [], admissions)['family-00'], [])
        rows[4]['text'] = rows[0]['text'] + ' extra'
        reasons = core.overlap_reasons(rows, [], admissions)
        self.assertEqual(reasons['family-00'], ['pool_overlap'])
        self.assertEqual(reasons['family-01'], ['pool_overlap'])
        rows = fixture_rows(2)
        rows[1]['text'] = '  ' + rows[0]['text'].upper() + '  '
        reasons = core.overlap_reasons(rows, [], admissions)
        self.assertEqual(reasons['family-00'], ['pool_overlap'])
        self.assertEqual(reasons['family-01'], [])

    def test_existing_data_ids_groups_overlap_admission_without_mutation(self):
        rows = fixture_rows(2)
        old = [{'id': rows[0]['id'], 'group': 'old-family', 'text': 'Old unrelated passage'},
               {'id': 'old-id', 'group': 'another-old', 'text': rows[4]['text']}]
        before = copy.deepcopy((rows, old))
        admissions = [{'admitted': True} for row in rows]
        admissions[0]['admitted'] = False
        reasons = core.overlap_reasons(rows, old, admissions)
        self.assertEqual(reasons['family-00'], ['existing_identifier', 'input_admission'])
        self.assertEqual(reasons['family-01'], ['existing_text_overlap'])
        self.assertEqual((rows, old), before)
        with self.assertRaises(ValueError): core.overlap_reasons(rows, old, admissions[:-1])


class AnnotationTests(unittest.TestCase):
    def setUp(self):
        self.rows = fixture_rows(2)
        self.annotations, self.packets, self.mappings, self.hashes = review_fixture(self.rows)

    def agree(self):
        return core.agree(self.rows, self.annotations, self.packets, self.mappings, self.hashes)

    def test_packets_are_role_specific_opaque_and_only_text_ids(self):
        self.assertNotEqual(self.packets['teacher'], self.packets['reviewer'])
        self.assertFalse(set(self.mappings['teacher'].values()) & set(self.mappings['reviewer'].values()))
        for packet in self.packets.values():
            self.assertEqual(set(packet), {'schemaVersion', 'items'})
            self.assertTrue(all(set(item) == {'id', 'text'} and item['id'].startswith('item_') for item in packet['items']))
        self.assertEqual(core.make_packet(self.rows, 'unit-context', 'teacher')[0], self.packets['teacher'])
        with self.assertRaises(ValueError): core.make_packet(self.rows, 'unit-context', 'author')

    def test_each_hash_complete_ids_and_distinct_actors_bound(self):
        accepted, quarantine = self.agree()
        self.assertEqual((len(accepted), len(quarantine)), (8, 0))
        for role in ('teacher', 'reviewer'):
            original = copy.deepcopy(self.annotations[role])
            self.annotations[role]['packetSha256'] = 'changed'
            with self.assertRaises(ValueError): self.agree()
            self.annotations[role] = copy.deepcopy(original)
            self.annotations[role]['decisions'].pop()
            with self.assertRaises(ValueError): self.agree()
            self.annotations[role] = copy.deepcopy(original)
            self.annotations[role]['decisions'][0] = self.annotations[role]['decisions'][1]
            with self.assertRaises(ValueError): self.agree()
            self.annotations[role] = original
        self.annotations['reviewer']['actor']['actorId'] = ' UNIT-TEACHER '
        with self.assertRaises(ValueError): self.agree()

    def test_both_roles_can_be_ambiguous_and_entire_family_is_excluded(self):
        for role in ('teacher', 'reviewer'):
            with self.subTest(role=role):
                self.annotations, self.packets, self.mappings, self.hashes = review_fixture(self.rows)
                self.annotations[role]['decisions'][0].update(status='ambiguous', label=None, category='ambiguous')
                accepted, quarantine = self.agree()
                self.assertEqual((len(accepted), len(quarantine)), (4, 4))
                self.assertTrue(all('ambiguity' in row['reasons'] for row in quarantine))

    def test_exact_unicode_evidence_and_different_valid_quotes(self):
        self.annotations['reviewer']['decisions'][0]['evidence'] = ['🚀']
        self.assertEqual(len(self.agree()[0]), 8)
        self.annotations['reviewer']['decisions'][0]['evidence'] = ['Cafe\u0301 🚀']
        accepted, quarantine = self.agree()
        self.assertEqual((len(accepted), len(quarantine)), (4, 4))
        self.assertTrue(all('invalid_annotation' in row['reasons'] for row in quarantine))

    def test_category_disagreement_and_missing_contrast_quarantine_whole_family(self):
        self.annotations['reviewer']['decisions'][1]['category'] = 'qualified_delivery'
        accepted, quarantine = self.agree()
        self.assertEqual((len(accepted), len(quarantine)), (4, 4))
        self.assertTrue(all('label_or_category_disagreement' in row['reasons'] for row in quarantine))
        self.annotations, self.packets, self.mappings, self.hashes = review_fixture(self.rows)
        for role in ('teacher', 'reviewer'):
            for decision in self.annotations[role]['decisions'][:4]:
                decision.update(label=1, category='firm_delivery')
        accepted, quarantine = self.agree()
        self.assertEqual((len(accepted), len(quarantine)), (4, 4))
        self.assertTrue(all('missing_binary_contrast' in row['reasons'] for row in quarantine))

    def test_training_records_only_have_agreed_labels_and_preserve_input(self):
        before = copy.deepcopy(self.rows)
        accepted, _ = self.agree()
        self.assertEqual(self.rows, before)
        self.assertTrue(all(row['split'] == 'train' for row in accepted))
        self.assertTrue(all(not ({'rationale', 'evidence', 'score', 'route'} & set(row)) for row in accepted))


class AuditAndJsonTests(unittest.TestCase):
    def test_human_sample_size_determinism_both_labels_and_no_duplicates(self):
        for count in (0, 1, 3, 8, 40, 120):
            rows = [{'id': f'unit-{index}', 'label': index % 2} for index in range(count)]
            result = core.human_sample(rows, 'unit-audit')
            self.assertEqual(len(result), min(count, max(4, (count + 9) // 10)))
            self.assertEqual(len(result), len(set(result)))
            self.assertEqual(result, core.human_sample(list(reversed(rows)), 'unit-audit'))
            if count >= 2:
                self.assertEqual({row['label'] for row in rows if row['id'] in result}, {0, 1})

    def test_duplicate_keys_and_nonfinite_json_refused_and_write_exclusive(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'unit.json'
            for value in ('{"nested":{"key":1,"key":2}}', '{"score":NaN}', '{"score":Infinity}'):
                path.write_text(value)
                with self.assertRaises(ValueError): core.read(path)
            path.unlink()
            core.write_new(path, {'unit': 1})
            with self.assertRaises(FileExistsError): core.write_new(path, {'unit': 2})
            self.assertEqual(core.read(path), {'unit': 1})


if __name__ == '__main__':
    unittest.main()
