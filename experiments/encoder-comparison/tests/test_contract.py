import importlib.util
from pathlib import Path
import sys
import json
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import admission, metrics, select_threshold, validate_rows, overlap_audit, validate_primary_profile, sha
from experiment import export_head, lexical_matrix, score_head, claim_evaluation, verify_freeze, configure, cpu_trainer


class ContractTests(unittest.TestCase):
    def test_joint_gate_rejects_single_correct_emission(self):
        result = select_threshold([1] * 15 + [0] * 15, [.9] + [.1] * 29)
        self.assertFalse(result['gatePassed'])
        self.assertEqual(result['threshold'], .5)

    def test_joint_gate_tiebreaks_recall_then_precision_then_larger_threshold(self):
        result = select_threshold([1, 1, 0, 0], [.8, .7, .2, .3])
        self.assertTrue(result['gatePassed'])
        self.assertEqual(result['threshold'], .7)
        self.assertEqual(len(result['curve']), 19)

    def test_null_precision_for_no_positive_predictions(self):
        self.assertIsNone(metrics([1, 0], [0, 0])['precision'])

    def test_admission_counts_special_tokens_without_truncation(self):
        calls = []
        def tokenizer(text, **kwargs):
            calls.append(kwargs)
            return {'input_ids': [0] * 257}
        self.assertEqual(admission('A passage', tokenizer)['reason'], 'token_limit')
        self.assertEqual(calls, [{'add_special_tokens': True, 'truncation': False}])

    def test_oversized_input_never_reaches_tokenizer(self):
        def forbidden(*args, **kwargs):
            raise AssertionError('Tokenizer must not run')
        self.assertEqual(admission('🚀' * 1001, forbidden)['utf16Units'], 2002)
        self.assertEqual(admission('x' * 2001, forbidden)['reason'], 'character_limit')

    def test_schema_rejects_bool_labels_and_group_leakage(self):
        row = dict(id='a', group='one', split='train', text='We will ship.', label=1, category='firm_delivery')
        with self.assertRaises(ValueError):
            validate_rows([{**row, 'label': True}])
        with self.assertRaises(ValueError):
            validate_rows([row, {**row, 'id': 'b', 'split': 'dev', 'text': 'We will deliver.'}])

    def test_overlap_audit_ignores_case_and_whitespace(self):
        self.assertEqual(overlap_audit([{'text': ' We will SHIP. ', 'group': 'g'}],
                                      [{'text': 'we  will ship.', 'group': 'h'}]),
                         {'normalizedTextDuplicates': 1, 'groupOverlaps': 0})

    def test_lexical_portable_scores_match_sklearn(self):
        import numpy as np
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from common import tokens
        texts = ['We will ship the connector.', 'Could we ship the connector?', 'We deliver tomorrow.', 'We might deliver later.']
        vectorizer = TfidfVectorizer(tokenizer=tokens, token_pattern=None, lowercase=False, ngram_range=(1, 2))
        x = vectorizer.fit_transform(texts)
        head = LogisticRegression(solver='liblinear').fit(x, [1, 0, 1, 0])
        artifact = {'vocabulary': vectorizer.vocabulary_, 'idf': vectorizer.idf_}
        np.testing.assert_allclose(score_head(lexical_matrix(texts, artifact), export_head(head)),
                                   head.predict_proba(x)[:, 1], rtol=0, atol=1e-12)

    def test_primary_profile_requires_balance_and_negative_categories(self):
        rows = [dict(label=1, category='firm_delivery') for _ in range(30)] + [dict(label=0, category=c)
            for c in ['qualified_delivery'] * 8 + ['request'] * 8 + ['reported'] * 8 + ['other'] * 6]
        validate_primary_profile(rows)
        rows[0]['label'] = 0
        with self.assertRaises(ValueError):
            validate_primary_profile(rows)
        with self.assertRaises(ValueError):
            validate_primary_profile(rows[:59])

    def test_evaluation_claim_is_exclusive_even_for_a_new_output(self):
        with tempfile.TemporaryDirectory() as directory, patch('experiment.ARTIFACTS', Path(directory)):
            first = claim_evaluation('frozen-test-bundle', 'datahash', Path(directory) / 'one.json')
            self.assertEqual(json.loads(first.read_text())['state'], 'started')
            with self.assertRaises(FileExistsError):
                claim_evaluation('frozen-test-bundle', 'datahash', Path(directory) / 'two.json')

    def test_tampered_frozen_artifact_is_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); artifact = root / 'model.json'; artifact.write_text('{"value":1}')
            (root / 'freeze.json').write_text(json.dumps({'files': {'model.json': sha(artifact)}}))
            with patch('experiment.ARTIFACTS', root), patch('experiment.ROOT', root):
                verify_freeze()
                artifact.write_text('{"value":2}')
                with self.assertRaises(ValueError):
                    verify_freeze()

    def test_runtime_forces_cpu_and_disables_hub_telemetry_before_imports(self):
        settings = configure()
        self.assertEqual(settings['ACCELERATE_USE_CPU'], 'true')
        self.assertEqual(settings['HF_HUB_OFFLINE'], '1')
        self.assertEqual(settings['HF_HUB_DISABLE_TELEMETRY'], '1')

    def test_cpu_arguments_cannot_hide_an_mps_accelerator(self):
        model = SimpleNamespace(model_body=SimpleNamespace(parameters=lambda: iter([
            SimpleNamespace(device=SimpleNamespace(type='cpu'))])))
        fake = SimpleNamespace(st_trainer=SimpleNamespace(args=SimpleNamespace(device='cpu', report_to=['none']),
                                                         accelerator=SimpleNamespace(device='mps')))
        with patch('setfit.Trainer', return_value=fake):
            with self.assertRaisesRegex(ValueError, 'CPU-only'):
                cpu_trainer(model, None, None)


if __name__ == '__main__':
    unittest.main()
