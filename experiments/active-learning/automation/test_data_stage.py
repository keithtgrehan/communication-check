"""Offline checks: fake actors exercise data integrity without model calls."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import data_stage as ds


def authored(split):
    rows = []
    for family_number, spec in enumerate(ds.scenario_plan()[split]):
        for offset, ident in enumerate(spec['ids']):
            label = int(offset % 2 == 0)
            # Family/row-specific tokens avoid accidental synthetic near duplicates.
            unique = ' '.join(f'{split}{family_number}row{offset}token{k}' for k in range(8))
            text = ('We will supply ' if label else 'Please send ') + unique + '.'
            rows.append({'id': ident, 'group': spec['group'], 'text': text,
                         'referenceLabel': label,
                         'referenceCategory': 'firm_delivery' if label else 'request',
                         'evidence': [text], 'rationale': 'Explicit assertion.' if label else 'Recipient request.'})
    return {'schemaVersion': 1, 'author': {'actorId': f'{split}-author', 'model': 'gpt-6-astra'},
            'syntheticOnly': True, 'examples': rows}


class FakeActors:
    def __init__(self, mutate=None):
        self.calls = []
        self.mutate = mutate

    def __call__(self, prompt, out, schema):
        self.calls.append((prompt, out, schema))
        name = out.name.removesuffix('-raw.json')
        if name.endswith('-author'):
            result = authored(name.removesuffix('-author'))
        else:
            packet = json.loads(prompt.split('\nPACKET:\n', 1)[1])
            packet_hash = prompt.split('PACKET_SHA256: ', 1)[1].splitlines()[0]
            result = {'schemaVersion': 2, 'packetSha256': packet_hash,
                      'actor': {'actorId': name, 'model': 'gpt-6-astra'}, 'decisions': []}
            for row in packet['items']:
                label = int(row['text'].startswith('We will'))
                result['decisions'].append({'id': row['id'], 'status': 'clear', 'label': label,
                    'category': 'firm_delivery' if label else 'request',
                    'rationale': 'Independent fake annotation.', 'evidence': [row['text']]})
        if self.mutate:
            self.mutate(name, result)
        ds.core.write_new(out, result)
        return {'configuredModel': 'gpt-6-astra', 'sessionId': name, 'noToolsRequired': True}


class AuthorValidation(unittest.TestCase):
    def test_counts_disjoint_domains_and_binary_contrasts(self):
        plan = ds.scenario_plan()
        self.assertEqual({s: len(v) for s, v in plan.items()}, {'train': 10, 'dev': 7, 'final': 14})
        domains = [s['domain'] for specs in plan.values() for s in specs]
        self.assertEqual(len(domains), len(set(domains)))
        for split, specs in plan.items():
            rows = ds.validate_author(authored(split), split, specs)
            self.assertEqual(len(rows), len(specs) * 4)
            self.assertEqual({r['split'] for r in rows}, {split})

    def test_malformed_references_rejected(self):
        for mutation in (
            lambda d: d['examples'][0].update(referenceLabel=True),
            lambda d: d['examples'][0].update(evidence=['invented quote']),
            lambda d: d['examples'][0].update(referenceCategory='other'),
            lambda d: d['examples'][0].update(extra='unexpected'),
            lambda d: d['examples'][0].update(text='😀' * 1001),
            lambda d: d['examples'][0].update(id=d['examples'][1]['id']),
            lambda d: d.update(syntheticOnly=False),
        ):
            with self.subTest(mutation=mutation):
                document = authored('train')
                mutation(document)
                with self.assertRaises(ValueError):
                    ds.validate_author(document, 'train', ds.scenario_plan()['train'])

    def test_missing_contrast_rejected_but_ambiguity_retained(self):
        document = authored('final')
        document['examples'][2].update(referenceLabel=None, referenceCategory='ambiguous')
        rows = ds.validate_author(document, 'final', ds.scenario_plan()['final'])
        self.assertEqual(sum(r['label'] is None for r in rows), 1)
        for row in document['examples'][:4]:
            row.update(referenceLabel=0, referenceCategory='other')
        with self.assertRaises(ValueError):
            ds.validate_author(document, 'final', ds.scenario_plan()['final'])


class PrepareTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.run = Path(self.temp.name)
        self.protocol = ds.core.read(Path(ds.__file__).with_name('protocol.json'))
        ds.core.write_new(self.run / 'protocol.json', self.protocol)
        self.history = patch.object(ds, '_history', return_value=([], []))
        self.history.start()
        self.addCleanup(self.history.stop)

    def test_prepare_freezes_outputs_and_blinds_training(self):
        actor = FakeActors()
        result = ds.prepare(self.run, self.protocol, actor)
        self.assertEqual([len(result[k]) for k in ('trainAdditions', 'dev', 'final', 'rows')], [40, 28, 56, 124])
        self.assertTrue(result['protocolValid'])
        self.assertEqual(result['quarantine'], [])
        self.assertEqual(len(actor.calls), 5)
        for prompt, out, schema in actor.calls:
            self.assertTrue(schema.exists())
            freeze = ds.core.read(out.parent / (out.name.removesuffix('-raw.json') + '-freeze.json'))
            self.assertEqual(ds.core.sha(out), freeze['sha256'])
            if out.name in ('teacher-raw.json', 'reviewer-raw.json'):
                packet = json.loads(prompt.split('\nPACKET:\n', 1)[1])
                self.assertEqual(len(packet['items']), 40)
                self.assertTrue(all(set(row) == {'id', 'text'} for row in packet['items']))
                self.assertNotIn('referenceLabel', prompt)
                self.assertNotIn('auto-final-', prompt)
                self.assertNotIn('auto-dev-', prompt)
        self.assertFalse(result['provenance']['humanLabellingRequired'])
        self.assertTrue(all(r['tags'] for r in result['rows']))
        self.assertIn('conditional_delivery', {tag for r in result['final'] for tag in r['tags']})
        with self.assertRaises(FileExistsError):
            ds.prepare(self.run, self.protocol, actor)
        self.assertEqual(len(actor.calls), 5)

    def test_disagreement_quarantines_whole_train_family(self):
        def mutate(name, result):
            if name == 'reviewer':
                row = result['decisions'][0]
                row.update(label=1-row['label'], category='request' if row['label'] else 'firm_delivery')
        result = ds.prepare(self.run, self.protocol, FakeActors(mutate))
        self.assertEqual(len(result['trainAdditions']), 36)
        self.assertEqual(len(result['quarantine']), 4)
        self.assertEqual(len({r['group'] for r in result['quarantine']}), 1)
        self.assertEqual(len(result['final']), 56)

    def test_cross_split_overlap_keeps_final_and_invalidates_protocol(self):
        train_example = authored('train')['examples'][0]
        def mutate(name, result):
            if name == 'final-author':
                row = result['examples'][0]
                row.update(text=train_example['text'], evidence=train_example['evidence'])
        result = ds.prepare(self.run, self.protocol, FakeActors(mutate))
        self.assertEqual(len(result['trainAdditions']), 36)
        self.assertEqual(len(result['quarantine']), 4)
        self.assertEqual(len(result['final']), 56)
        self.assertFalse(result['protocolValid'])
        self.assertEqual({r['split'] for r in result['protocolViolations']}, {'final'})
        self.assertEqual(len(result['protocolViolations']), 4)

    def test_historical_near_overlap_quarantines_family(self):
        row = authored('train')['examples'][0]
        with patch.object(ds, '_history', return_value=([{'id': 'old', 'group': 'old', 'text': row['text'] + ' today'}], [])):
            result = ds.prepare(self.run, self.protocol, FakeActors())
        self.assertEqual(len(result['trainAdditions']), 36)
        self.assertTrue(result['protocolValid'])
        self.assertIn('existing_text_overlap', result['quarantine'][0]['reasons'])

    def test_ambiguous_final_retained_and_not_sent_to_training(self):
        def mutate(name, result):
            if name == 'final-author':
                result['examples'][2].update(referenceLabel=None, referenceCategory='ambiguous')
        result = ds.prepare(self.run, self.protocol, FakeActors(mutate))
        self.assertEqual(len(result['final']), 56)
        self.assertEqual(sum(r['label'] is None for r in result['final']), 1)
        self.assertEqual(len(result['trainAdditions']), 40)

    def test_unfrozen_protocol_fails_without_actor(self):
        actor = FakeActors()
        with self.assertRaises(ValueError):
            ds.prepare(self.run, {'different': True}, actor)
        self.assertEqual(actor.calls, [])

    def test_actor_sessions_must_be_distinct(self):
        actor = FakeActors()
        def reused_session(prompt, out, schema):
            metadata = actor(prompt, out, schema)
            metadata['sessionId'] = 'reused-session'
            return metadata
        with self.assertRaisesRegex(ValueError, 'distinct runner session'):
            ds.prepare(self.run, self.protocol, reused_session)
        self.assertEqual(len(actor.calls), 2)

    def test_malformed_json_still_has_frozen_raw_hash(self):
        def invalid_json(prompt, out, schema):
            out.write_text('{broken')
            return {'sessionId': 'broken-output-session'}
        with self.assertRaises(ValueError):
            ds.prepare(self.run, self.protocol, invalid_json)
        path = self.run / 'data/train-author-raw.json'
        freeze = ds.core.read(self.run / 'data/train-author-freeze.json')
        self.assertEqual(ds.core.sha(path), freeze['sha256'])

    def test_failed_author_output_cannot_be_replaced(self):
        def mutate(name, result):
            if name == 'train-author':
                result['examples'].pop()
        actor = FakeActors(mutate)
        with self.assertRaises(ValueError):
            ds.prepare(self.run, self.protocol, actor)
        self.assertTrue((self.run / 'data/train-author-freeze.json').exists())
        with self.assertRaises(FileExistsError):
            ds.prepare(self.run, self.protocol, FakeActors())


if __name__ == '__main__':
    unittest.main()
