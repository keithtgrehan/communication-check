"""Worker contract tests without checkpoint downloads or model inference."""
import contextlib
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

SPEC = importlib.util.spec_from_file_location('automation_models', Path(__file__).with_name('models.py'))
models = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(models)


class FakeTokenizer:
    def __init__(self, count=10):
        self.count = count
        self.calls = []

    def __call__(self, text, **kwargs):
        self.calls.append((text, kwargs))
        count = self.count(text, kwargs.get('text_pair')) if callable(self.count) else self.count
        return {'input_ids': list(range(count))}


class AdmissionTests(unittest.TestCase):
    def test_exact_paired_token_boundary_and_no_truncation(self):
        tokenizer = FakeTokenizer(lambda text, pair: 257 if pair == 'long' else 256)
        self.assertTrue(models.admit('a', tokenizer, {'firm_delivery': 'short'})['admitted'])
        check = models.admit('a', tokenizer, {'firm_delivery': 'short', 'other': 'long'})
        self.assertEqual(check['reason'], 'token_limit')
        self.assertEqual(check['tokens'], 257)
        self.assertTrue(all(call[1]['truncation'] is False for call in tokenizer.calls))
        self.assertTrue(all(call[1]['add_special_tokens'] for call in tokenizer.calls))

    def test_utf16_boundaries(self):
        tokenizer = FakeTokenizer()
        self.assertTrue(models.admit('😀' * 1000, tokenizer)['admitted'])
        tokenizer.calls.clear()
        check = models.admit('😀' * 1000 + 'a', tokenizer)
        self.assertEqual(check['reason'], 'character_limit')
        self.assertEqual(check['utf16Units'], 2001)
        self.assertEqual(tokenizer.calls, [])

    def test_empty_is_abstention_and_nonstring_is_invalid(self):
        self.assertEqual(models.admit('  ', FakeTokenizer())['reason'], 'empty')
        with self.assertRaises(ValueError):
            models.admit(None, FakeTokenizer())


class LabelTests(unittest.TestCase):
    def test_permuted_label_order(self):
        for index in range(3):
            config = SimpleNamespace(label2id={'entailment': index}, id2label={index: 'ENTAILMENT'}, num_labels=3)
            self.assertEqual(models.entailment_index(config), index)

    def test_two_class_nli_checkpoint(self):
        config = SimpleNamespace(label2id={'not_entailment': 0, 'entailment': 1},
                                 id2label={0: 'not_entailment', 1: 'entailment'}, num_labels=2)
        self.assertEqual(models.entailment_index(config), 1)

    def test_unknown_or_inconsistent_labels_refused(self):
        for config in [SimpleNamespace(label2id={'LABEL_0': 0}, id2label={}, num_labels=3),
                       SimpleNamespace(label2id={'entailment': 0}, id2label={2: 'entailment'}, num_labels=3),
                       SimpleNamespace(label2id={'entailment': 3}, id2label={}, num_labels=3)]:
            with self.assertRaises(ValueError):
                models.entailment_index(config)

    def test_external_override_is_single_explicit_positive(self):
        self.assertEqual(models.hypothesis_map({}), models.HYPOTHESES)
        self.assertEqual(models.hypothesis_map({'hypotheses': {'firm_delivery': 'a promise'}}),
                         {'firm_delivery': 'a promise'})
        for invalid in ({'other': 'a'}, {'firm_delivery': ''}, ['a'], {'firm_delivery': 'a', 'other': 'b'}):
            with self.assertRaises(ValueError):
                models.hypothesis_map({'hypotheses': invalid})


class WorkerTests(unittest.TestCase):
    def test_nli_scores_independent_entailment_and_batches_eight_pairs(self):
        class Tensor:
            def __init__(self, values):
                self.values = values
                self.shape = (len(values), len(values[0]))

            def float(self):
                return self

            def __getitem__(self, key):
                rows, column = key
                return SimpleNamespace(tolist=lambda: [row[column] for row in self.values[rows]])

        hypotheses = models.HYPOTHESES
        probabilities = dict(zip(hypotheses.values(), [.60, .95, .20, .30, .40]))
        batches = []

        def tokenize(text, **kwargs):
            self.assertFalse(kwargs['truncation'])
            if isinstance(text, str):
                return {'input_ids': [1] * 20}
            batches.append(len(text))
            return {'input_ids': Tensor([[1] * 20 for _ in text]), 'hypotheses': kwargs['text_pair']}

        class NliModel:
            config = SimpleNamespace(label2id={'not_entailment': 0, 'entailment': 1}, id2label={}, num_labels=2)

            def to(self, device):
                assert device == 'cpu'
                return self

            def eval(self):
                return self

            def parameters(self):
                return [SimpleNamespace(device=SimpleNamespace(type='cpu'))]

            def __call__(self, **kwargs):
                return SimpleNamespace(logits=Tensor([[math.log(1 - probabilities[h]), math.log(probabilities[h])]
                                                       for h in kwargs['hypotheses']]))

        def softmax(tensor, dim):
            self.assertEqual(dim, -1)
            return Tensor([[math.exp(v) / sum(math.exp(x) for x in row) for v in row] for row in tensor.values])

        torch = SimpleNamespace(set_num_threads=Mock(), inference_mode=contextlib.nullcontext, softmax=softmax)
        loader = Mock(return_value=NliModel())
        transformers = SimpleNamespace(AutoTokenizer=SimpleNamespace(from_pretrained=Mock(return_value=tokenize)),
                                       AutoModelForSequenceClassification=SimpleNamespace(from_pretrained=loader))
        job = {'candidate': 'deberta', 'texts': ['one', '', 'two']}
        with patch.object(models, 'require_dependencies'), patch.object(models, 'verify_model', return_value=(Path('/model'), {})), \
                patch.dict(sys.modules, {'torch': torch, 'transformers': transformers}):
            result = models.score_nli(job)
        self.assertEqual(result['scores'], [.6, None, .6])
        self.assertEqual(result['categories'], ['qualified_delivery', None, 'qualified_delivery'])
        self.assertEqual(batches, [8, 2])
        loader.assert_called_once_with('/model', local_files_only=True, trust_remote_code=False, use_safetensors=True)
        torch.set_num_threads.assert_called_once_with(4)

    def test_c42_only_loads_one_predictor_and_preserves_abstentions(self):
        predictor = SimpleNamespace(scores=Mock(return_value=[.7, .2]))
        api = SimpleNamespace(tokenizer=lambda: FakeTokenizer(),
                              reference=lambda: {'revision': 'fixed', 'license': 'apache-2.0'},
                              summary=lambda: {'candidates': [{'name': 'A'}, {'name': 'B'}, {'name': 'C42'}]},
                              Predictor=Mock(return_value=predictor))
        frozen = SimpleNamespace(_protected_use=contextlib.nullcontext, prior_api=lambda: api,
                                 EXPECTED_PRIOR_BUNDLE='bundle', _scores_valid=lambda x, n: x)
        with patch.object(models, 'adapter', return_value=frozen):
            result = models.score_compact({'candidate': 'C42', 'texts': ['one', '', 'two']})
        api.Predictor.assert_called_once_with({'name': 'C42'})
        predictor.scores.assert_called_once_with(['one', 'two'])
        self.assertEqual(result['scores'], [.7, None, .2])
        self.assertEqual(result['categories'], [None, None, None])
        self.assertIsNone(result['evidence'])
        self.assertIsNone(result['rationale'])

    def test_train_is_once_and_report_is_saved(self):
        with tempfile.TemporaryDirectory() as directory:
            report = {'modelRevision': 'fixed', 'fitSeconds': 1, 'totalWorkflowSeconds': 2}
            frozen = SimpleNamespace(train_candidate=Mock(return_value=report))
            job = {'candidate': 'setfit-auto', 'run_dir': directory, 'data': [], 'recipe': {}}
            with patch.object(models, 'adapter', return_value=frozen):
                result = models.train(job)
                with self.assertRaises(ValueError):
                    models.train(job)
            frozen.train_candidate.assert_called_once()
            self.assertEqual(json.loads((Path(directory) / 'train-report.json').read_text()), report)
            self.assertEqual(result['report'], report)

    def test_missing_dependency_is_explicit_skip(self):
        with patch.object(models, 'score_nli', side_effect=models.UnsupportedDependency('missing')):
            result = models.execute({'candidate': 'modernbert', 'action': 'score', 'texts': []})
        self.assertEqual(result['status'], 'skipped')
        self.assertEqual(result['reason'], 'unsupported_dependency')
        self.assertIn('hardware', result['provenance'])
        self.assertGreater(result['peakRssBytes'], 0)

    def test_unknown_revision_refused(self):
        for revision in (None, 'main', '0' * 40):
            with self.assertRaises(ValueError):
                models.pinned_revision({'candidate': 'deberta', 'revision': revision})
        self.assertEqual(models.pinned_revision({'candidate': 'deberta', 'revision': models.MODEL_REVISIONS['deberta']}),
                         models.MODEL_REVISIONS['deberta'])

    def test_download_license_checked_before_weights(self):
        with tempfile.TemporaryDirectory() as directory:
            revision = models.MODEL_REVISIONS['deberta']
            info = SimpleNamespace(sha=revision, card_data=SimpleNamespace(to_dict=lambda: {'license': 'unknown'}), siblings=[])
            api = SimpleNamespace(model_info=Mock(return_value=info))
            snapshot = Mock()
            fake_hub = SimpleNamespace(HfApi=Mock(return_value=api), snapshot_download=snapshot)
            with patch.object(models, 'require_dependencies'), patch.dict(sys.modules, {'huggingface_hub': fake_hub}):
                with self.assertRaises(ValueError):
                    models.download({'candidate': 'deberta', 'revision': revision, 'model_dir': directory})
            snapshot.assert_not_called()

    def test_pickle_and_escaping_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'weights.bin').write_bytes(b'pickle')
            with self.assertRaises(ValueError):
                models.snapshot_files(root)
            (root / 'weights.bin').unlink()
            with tempfile.NamedTemporaryFile() as outside:
                (root / 'model.safetensors').symlink_to(outside.name)
                with self.assertRaises(ValueError):
                    models.snapshot_files(root)

    def test_cli_failure_does_not_echo_text_or_traceback(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            job, out = root / 'job.json', root / 'out.json'
            job.write_text(json.dumps({'candidate': 'bad-CANARY-PRIVATE-TEXT', 'action': 'score'}))
            completed = subprocess.run([sys.executable, str(Path(models.__file__)), '--job', str(job), '--out', str(out)],
                                       text=True, capture_output=True)
            self.assertEqual(completed.returncode, 1)
            self.assertEqual(json.loads(out.read_text())['status'], 'failed')
            self.assertNotIn('CANARY', out.read_text() + completed.stdout + completed.stderr)
            self.assertNotIn('Traceback', completed.stderr)


if __name__ == '__main__':
    unittest.main()
