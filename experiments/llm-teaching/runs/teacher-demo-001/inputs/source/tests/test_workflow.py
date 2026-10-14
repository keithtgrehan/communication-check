import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import contracts as c
import teaching as t
from kit import export_kit


def fixture():
    examples = []
    for index in range(8):
        examples.append({'id': f'ex_{index:08x}', 'group': f'fam_{index//2:08x}',
            'text': f'Imaginary scenario {index}: ' + ('I will deliver the item.' if index % 2 == 0 else 'Could you deliver the item?'),
            'suggestedLabel': int(index % 2 == 0), 'suggestedCategory': 'firm_delivery' if index % 2 == 0 else 'request',
            'rationale': 'Synthetic unit fixture wording.'})
    batch = {'schemaVersion': 1, 'batchId': 'test-batch', 'teacher': {'actorId': 'teacher', 'model': 'unit fixture'},
             'syntheticOnly': True, 'examples': examples}
    batch_hash = 'a' * 64
    packet = c.make_packet(batch, batch_hash)
    by_id = {c.opaque_id(batch_hash, row['id']): row for row in examples}
    review = {'schemaVersion': 1, 'batchId': batch['batchId'], 'batchSha256': batch_hash,
              'packetSha256': 'b' * 64, 'reviewer': {'actorId': 'reviewer', 'model': 'unit fixture'},
              'decisions': [{'id': item['id'], 'status': 'clear', 'label': by_id[item['id']]['suggestedLabel'],
                'category': by_id[item['id']]['suggestedCategory'], 'rationale': 'Independent test label.'} for item in packet['items']]}
    return batch, batch_hash, packet, review


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.batch, self.digest, self.packet, self.review = fixture()

    def decisions(self):
        return c.validate_review(self.review, self.batch, self.digest, self.packet, 'b' * 64)

    def assess(self, base=()):
        return c.assess(self.batch, self.digest, self.decisions(), base, lambda text: {'admitted': True})

    def test_packet_has_only_opaque_id_and_text(self):
        self.assertTrue(all(set(row) == {'id', 'text'} for row in self.packet['items']))
        self.assertEqual(self.packet, c.make_packet(self.batch, self.digest))
        self.assertNotEqual([r['text'] for r in self.packet['items']], [r['text'] for r in self.batch['examples']])
        self.assertTrue(all(r['id'].startswith('review_') for r in self.packet['items']))

    def test_strict_versions_and_duplicate_json_keys(self):
        self.batch['schemaVersion'] = True
        with self.assertRaises(ValueError): c.validate_batch(self.batch)
        self.batch['schemaVersion'] = 1; self.review['schemaVersion'] = True
        with self.assertRaises(ValueError): self.decisions()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'bad.json'; path.write_text('{"id":1,"id":2}')
            with self.assertRaises(ValueError): c.read_json(path)

    def test_actor_case_and_whitespace_alias_refused(self):
        self.review['reviewer']['actorId'] = ' Teacher '
        with self.assertRaises(ValueError): self.decisions()

    def test_review_hash_missing_and_duplicate_decision_refused(self):
        self.review['packetSha256'] = 'c' * 64
        with self.assertRaises(ValueError): self.decisions()
        self.review['packetSha256'] = 'b' * 64
        original = copy.deepcopy(self.review['decisions'])
        self.review['decisions'].pop()
        with self.assertRaises(ValueError): self.decisions()
        self.review['decisions'] = original
        self.review['decisions'][0] = self.review['decisions'][1]
        with self.assertRaises(ValueError): self.decisions()

    def test_tampered_packet_and_proposal_refused(self):
        self.packet['items'][0]['text'] = 'Changed'
        with self.assertRaises(ValueError): self.decisions()
        self.packet = c.make_packet(self.batch, self.digest)
        self.batch['examples'][0]['text'] = 'Changed proposal'
        with self.assertRaises(ValueError): self.decisions()

    def test_category_disagreement_quarantines_whole_family(self):
        negative = next(d for d in self.review['decisions'] if d['label'] == 0)
        negative['category'] = 'qualified_delivery'
        accepted, quarantined = self.assess()
        self.assertEqual((len(accepted), len(quarantined)), (6, 2))
        self.assertTrue(all('teacher_reviewer_disagreement' in row['reasons'] for row in quarantined))

    def test_ambiguous_quarantines_whole_family(self):
        self.review['decisions'][0].update(status='ambiguous', label=None, category='ambiguous')
        accepted, quarantined = self.assess()
        self.assertEqual((len(accepted), len(quarantined)), (6, 2))

    def test_existing_ids_and_dev_overlap_quarantine_without_mutation(self):
        base = [{'id': self.batch['examples'][0]['id'], 'group': 'old-scenario', 'split': 'train', 'text': 'Distinct existing work.'},
                {'id': 'dev-one', 'group': 'dev-scenario', 'split': 'dev', 'text': self.batch['examples'][2]['text']}]
        before = copy.deepcopy(base)
        accepted, quarantined = self.assess(base)
        self.assertEqual(base, before)
        self.assertEqual((len(accepted), len(quarantined)), (4, 4))
        self.assertTrue(all(row['split'] == 'train' for row in accepted))
        self.assertTrue(all('text' not in row for row in quarantined))
        self.assertTrue(any('existing_example_id' in row['reasons'] for row in quarantined))

    def test_same_family_contrast_allowed_cross_family_similarity_quarantined(self):
        accepted, _ = self.assess(); self.assertEqual(len(accepted), 8)
        self.batch['examples'][2]['text'] = self.batch['examples'][0]['text'] + ' Soon.'
        self.packet = c.make_packet(self.batch, self.digest)
        accepted, quarantined = self.assess()
        self.assertEqual(len(quarantined), 4)

    def test_run_paths_and_exclusive_kit(self):
        for bad in ('../elsewhere', '/tmp/test', 'x/y', 'A'):
            with self.assertRaises(ValueError): t.folder(bad)
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'kit'
            export_kit('test', target)
            with self.assertRaises(FileExistsError): export_kit('test', target)

    def test_prepared_source_and_snapshot_immutability(self):
        with tempfile.TemporaryDirectory() as directory:
            run = Path(directory); (run / 'input.json').write_text('{}')
            manifest = {'snapshotFiles': {'input.json': c.sha(run / 'input.json')}, 'sourceFiles': {'x.py': 'old'}}
            c.write_json(run / 'prepared.json', manifest)
            (run / 'prepared.sha256').write_text(c.sha(run / 'prepared.json'))
            t.verify_prepared(run)
            with patch.object(t, 'current_code', return_value={'x.py': 'new'}):
                with self.assertRaises(ValueError): t.verify_prepared(run, active_code=True)
            (run / 'input.json').write_text('{"changed":true}')
            with self.assertRaises(ValueError): t.verify_prepared(run)
            with self.assertRaises(ValueError): t.confined(run, '../outside')

    def test_frozen_bundle_detects_manifest_and_file_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            run = Path(directory); (run / 'model.json').write_text('{}')
            files = {'model.json': c.sha(run / 'model.json')}
            c.write_json(run / 'freeze.json', {'files': files, 'bundleSha256': hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()})
            t.verify_complete(run)
            (run / 'model.json').write_text('changed')
            with self.assertRaises(ValueError): t.verify_complete(run)
            frozen = c.read_json(run / 'freeze.json'); frozen['bundleSha256'] = '0' * 64
            c.write_json(run / 'freeze.json', frozen)
            with self.assertRaises(ValueError): t.verify_complete(run)


if __name__ == '__main__':
    unittest.main()
