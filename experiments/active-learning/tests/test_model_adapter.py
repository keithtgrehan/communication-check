"""Adapter tests with synthetic fixtures and a mocked trainer; never fit a model."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace, ModuleType
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('active_learning_model_adapter', Path(__file__).resolve().parents[1] / 'model_adapter.py')
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)


def rows():
    return [dict(id=f'base-{i:03}', group=f'base-family-{i // 6}', split='train' if i < 120 else 'dev',
                 text=f'Original fictional passage number {i}.', label=i % 2,
                 category='firm_delivery' if i % 2 else 'other') for i in range(150)]


def additions():
    return [dict(id=f'new-{i}', group=f'new-family-{i // 4}', split='train', text=f'New isolated passage {i}.',
                 label=i % 2, category='firm_delivery' if i % 2 else 'request',
                 rationale='Must never enter the training dataset.') for i in range(8)]


class AdapterContractTests(unittest.TestCase):
    def test_manifest_recomputes_map_digest_and_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'a').write_text('original')
            files = {'a': adapter._sha(root / 'a')}
            digest = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
            manifest = root / 'freeze.json'
            manifest.write_text(json.dumps(dict(files=files, bundleSha256=digest)))
            self.assertEqual(adapter._verify_manifest(root, manifest, digest, 1)['files'], 1)
            with self.assertRaises(ValueError):
                adapter._verify_manifest(root, manifest, digest, 2)
            (root / 'a').write_text('tampered')
            with self.assertRaises(ValueError):
                adapter._verify_manifest(root, manifest, digest, 1)
            files['a'] = adapter._sha(root / 'a')
            manifest.write_text(json.dumps(dict(files=files, bundleSha256=digest)))
            with self.assertRaisesRegex(ValueError, 'digest'):
                adapter._verify_manifest(root, manifest, digest, 1)

    def test_manifest_rejects_path_escape_even_with_matching_digest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'root'
            root.mkdir()
            (root.parent / 'outside').write_text('outside')
            files = {'../outside': adapter._sha(root.parent / 'outside')}
            digest = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
            manifest = root / 'freeze.json'
            manifest.write_text(json.dumps(dict(files=files, bundleSha256=digest)))
            with self.assertRaisesRegex(ValueError, 'escapes'):
                adapter._verify_manifest(root, manifest, digest, 1)

    def test_integrity_checked_after_failed_operation(self):
        with patch.object(adapter, 'baseline_integrity') as verify:
            with self.assertRaises(RuntimeError):
                with adapter._protected_use():
                    raise RuntimeError('mock failure')
            self.assertEqual(verify.call_count, 2)

    def test_import_isolated_from_common_module_and_cache_preserved_sources(self):
        sentinel = ModuleType('unrelated_common')
        with patch.dict(sys.modules, {'common': sentinel}):
            api = adapter.prior_api()
            self.assertIs(sys.modules['common'], sentinel)
            self.assertEqual(api.ROOT, adapter.PRIOR)
        import os
        self.assertTrue(sys.dont_write_bytecode)
        for key in ('HF_HOME', 'HF_HUB_CACHE', 'HF_DATASETS_CACHE', 'TORCH_HOME', 'XDG_CACHE_HOME'):
            self.assertTrue(Path(os.environ[key]).is_relative_to(adapter.ROOT))
        self.assertEqual(os.environ['HF_HUB_OFFLINE'], '1')

    def test_threshold_grid_fallback_and_tie_break(self):
        result = adapter.select_threshold([0, 1], [.8, .2])
        self.assertFalse(result['gatePassed'])
        self.assertEqual(result['threshold'], .5)
        self.assertEqual([r['threshold'] for r in result['curve']], [i / 100 for i in range(5, 96, 5)])
        result = adapter.select_threshold([0, 1], [.1, .92])
        self.assertTrue(result['gatePassed'])
        self.assertEqual(result['threshold'], .9)

    def test_invalid_scores_have_explicit_text_free_reason(self):
        for scores in ([float('nan')], [float('inf')], [-.1], [1.1], [], ['private input'], [True]):
            with self.subTest(scores=scores), self.assertRaises(adapter.InvariantError) as caught:
                adapter._scores_valid(scores, 1)
            self.assertEqual(caught.exception.reason_code, 'INVALID_SCORES')
            self.assertEqual(str(caught.exception), 'Invalid model scores.')
        self.assertEqual(adapter._scores_valid([0., .5, 1.], 3), [0., .5, 1.])

    def test_invariant_codes_are_allowlisted_and_cannot_carry_input_text(self):
        self.assertEqual(set(adapter.INVARIANT_REASONS), {
            'RELOAD_PARITY', 'INVALID_SCORES', 'OPTIMIZATION_INCOMPLETE',
            'ENCODER_UNCHANGED', 'CPU_CONSTRAINT', 'NONFINITE_WEIGHTS'})
        with self.assertRaisesRegex(ValueError, '^Unknown model invariant reason code.$'):
            adapter.InvariantError('private user text')

    def test_recipe_change_rejected(self):
        for key in adapter.FIXED_RECIPE:
            recipe = dict(adapter.FIXED_RECIPE)
            recipe[key] = 999
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'recipe'):
                adapter._validate_training(rows() + additions(), recipe)

    def test_original_rows_immutable_and_additions_train_only(self):
        with patch.object(adapter, 'load_base_rows', return_value=rows()), patch.object(adapter, 'contamination_rows', return_value=rows()):
            data = rows() + additions()
            train, dev = adapter._validate_training(data, adapter.FIXED_RECIPE)
            self.assertEqual((len(train), len(dev)), (128, 30))
            for mutate in (lambda x: x[0].update(text='changed'), lambda x: x[-1].update(split='dev'), lambda x: x.pop()):
                changed = rows() + additions()
                mutate(changed)
                with self.assertRaises(ValueError):
                    adapter._validate_training(changed, adapter.FIXED_RECIPE)

    def test_prior_teaching_examples_cannot_enter_fit(self):
        with patch.object(adapter, 'load_base_rows', return_value=rows()), patch.object(adapter, 'contamination_rows', return_value=rows() + [{'text': additions()[0]['text']}]):
            with self.assertRaisesRegex(ValueError, 'Previous teaching'):
                adapter._validate_training(rows() + additions(), adapter.FIXED_RECIPE)

    def test_added_families_cannot_reuse_base_group_or_have_one_label(self):
        with patch.object(adapter, 'load_base_rows', return_value=rows()), patch.object(adapter, 'contamination_rows', return_value=rows()):
            for change in ('base-group', 'one-label'):
                data = rows() + additions()
                for row in data[-8:-4]:
                    row.update(group='base-family-0') if change == 'base-group' else row.update(label=1, category='firm_delivery')
                with self.subTest(change=change), self.assertRaisesRegex(ValueError, 'distinct'):
                    adapter._validate_training(data, adapter.FIXED_RECIPE)

    def test_admission_prevents_scoring_rejected_text(self):
        api = SimpleNamespace(tokenizer=lambda: object(), admission=lambda text, tokenizer: {'admitted': False})
        with patch.object(adapter, 'baseline_integrity'), patch.object(adapter, 'prior_api', return_value=api), patch.object(adapter, '_baseline_scores') as scorer:
            with self.assertRaisesRegex(ValueError, 'admission'):
                adapter.score_baselines(['oversized fake input'])
            scorer.assert_not_called()

    def test_baseline_thresholds_use_saved_operating_points(self):
        api = SimpleNamespace(summary=lambda: {'candidates': [dict(name=n, operatingPoint={'threshold': v}) for n, v in zip(adapter.BASELINES, [.5, .55, .6])]})
        with patch.object(adapter, 'baseline_integrity'), patch.object(adapter, 'prior_api', return_value=api):
            self.assertEqual(adapter.baseline_thresholds(), {'A': .5, 'B': .55, 'C42': .6})

    def test_candidate_path_cannot_escape_new_package(self):
        with self.assertRaises(ValueError):
            adapter._run_path(adapter.PRIOR / 'artifacts/models/C42')

    def test_candidate_nested_symlink_cannot_escape_run(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = root / 'round-1'
            (run / 'model').mkdir(parents=True)
            (root / 'outside.json').write_text('{}')
            (run / 'model/head.json').symlink_to(root / 'outside.json')
            with patch.object(adapter, 'ROOT', root), patch.object(adapter, 'baseline_integrity'), self.assertRaisesRegex(ValueError, 'escapes'):
                adapter.score_candidate(run, ['fictional text'])


class MockedTrainingTests(unittest.TestCase):
    def exercise(self, *, steps=50, change=True, device='cpu', reload_delta=0, second_attempt=False,
                 nonfinite_weights=False, invalid_scores=False, helper_cpu_failure=False):
        import numpy as np
        common = adapter._common()
        captured = {}

        class Tensor:
            def __init__(self, value):
                self.value = np.array(value, dtype=float)
                self.device = SimpleNamespace(type=device)
            def detach(self): return self
            def clone(self): return Tensor(self.value.copy())
            def __sub__(self, other): return Tensor(self.value - other.value)
            def abs(self): return Tensor(np.abs(self.value))
            def max(self): return self.value.max()

        class Body:
            def __init__(self, reloaded=False):
                self.parameter = Tensor([1, 2])
                self.reloaded = reloaded
            def named_parameters(self): return [('weight', self.parameter)]
            def parameters(self): return iter([self.parameter])
            def save_pretrained(self, path, safe_serialization):
                Path(path).mkdir()
                (Path(path) / 'fake.json').write_text('{}')

        def load_body(path):
            captured.setdefault('loads', []).append(str(path))
            return Body(reloaded=str(path) != 'original-pretrained-checkpoint')

        class Model:
            def __init__(self, model_body, model_head, normalize_embeddings):
                self.model_body, self.model_head = model_body, model_head
                captured['normalizeEmbeddings'] = normalize_embeddings

        def train(model):
            captured['trained'] = True
            if change:
                model.model_body.parameter.value += .01
            if nonfinite_weights:
                model.model_body.parameter.value[0] = np.nan

        def trainer(model, arguments, dataset):
            if helper_cpu_failure:
                raise ValueError('The declared CPU-only training device was not respected.')
            captured['dataset'] = dataset
            captured['arguments'] = arguments
            return SimpleNamespace(train=lambda: train(model), st_trainer=SimpleNamespace(
                state=SimpleNamespace(global_step=steps), args=SimpleNamespace(device=device),
                accelerator=SimpleNamespace(device=device)))

        def scores(matrix, head):
            if invalid_scores:
                return np.full(matrix.shape[0], np.nan)
            return matrix[:, 0]

        def encode(body, texts):
            # Binary scores intentionally give perfect synthetic DEV separation.
            return np.asarray([[.9 if int(text.split()[-1].rstrip('.')) % 2 else .1] for text in texts]) + (reload_delta if body.reloaded else 0)

        labels = [r['label'] for r in rows() if r['split'] == 'dev']
        baseline_scores = [.9 if y else .1 for y in labels]
        operating = common.select_threshold(labels, baseline_scores)
        api = SimpleNamespace(reference=lambda: {'snapshot': 'original-pretrained-checkpoint'}, load_body=load_body,
            new_head=lambda seed: SimpleNamespace(predict_proba=lambda matrix: np.column_stack([1 - matrix[:, 0], matrix[:, 0]])),
            cpu_trainer=trainer, export_head=lambda head: {'fake': True}, score_head=scores, encode=encode,
            select_threshold=common.select_threshold, metrics=common.metrics,
            summary=lambda: {'candidates': [dict(name=n, operatingPoint=operating) for n in adapter.BASELINES]})
        fake_modules = {
            'torch': SimpleNamespace(manual_seed=lambda seed: captured.update(seed=seed)),
            'datasets': SimpleNamespace(Dataset=SimpleNamespace(from_dict=lambda data: data)),
            'setfit': SimpleNamespace(SetFitModel=Model, TrainingArguments=lambda **kwargs: kwargs),
        }
        with tempfile.TemporaryDirectory() as directory, patch.object(adapter, 'ROOT', Path(directory)), \
                patch.object(adapter, 'baseline_integrity'), patch.object(adapter, 'load_base_rows', return_value=rows()), \
                patch.object(adapter, 'contamination_rows', return_value=rows()), patch.object(adapter, 'prior_api', return_value=api), \
                patch.object(adapter, '_require_admitted'), patch.object(adapter, '_baseline_scores', return_value={n: baseline_scores for n in adapter.BASELINES}), \
                patch.dict(sys.modules, fake_modules):
            run = Path(directory) / 'round-1'
            report = adapter.train_candidate(run, rows() + additions(), adapter.FIXED_RECIPE)
            self.assertTrue((run / 'model/head.json').exists())
            if second_attempt:
                with self.assertRaisesRegex(ValueError, 'already exist'):
                    adapter.train_candidate(run, rows() + additions(), adapter.FIXED_RECIPE)
            return report, captured

    def test_fixed_training_checkpoint_cpu_fields_and_provenance_exclusion(self):
        report, captured = self.exercise(second_attempt=True)
        self.assertEqual(set(captured['dataset']), {'text', 'label'})
        self.assertEqual(len(captured['dataset']['text']), 128)
        self.assertNotIn(rows()[120]['text'], captured['dataset']['text'])
        self.assertEqual(captured['loads'][0], 'original-pretrained-checkpoint')
        self.assertTrue(captured['loads'][1].endswith('/model/encoder'))
        self.assertTrue(captured['normalizeEmbeddings'])
        self.assertEqual(captured['arguments']['max_steps'], 50)
        self.assertEqual(captured['arguments']['batch_size'], 16)
        self.assertEqual(captured['arguments']['num_iterations'], 5)
        self.assertEqual(captured['arguments']['body_learning_rate'], 2e-5)
        self.assertEqual(report['optimization']['successfulCpuSteps'], 50)
        self.assertEqual(report['optimization']['changedParameterTensors'], 1)
        self.assertEqual(report['parity']['savedReloadMaxError'], 0)
        self.assertEqual(set(report['baselines']), set(adapter.BASELINES))
        self.assertTrue(all(len(r['operatingPoint']['curve']) == 19 for r in report['baselines'].values()))
        self.assertEqual(len(report['operatingPoint']['curve']), 19)

    def test_incomplete_steps_rejected(self):
        with self.assertRaises(adapter.InvariantError) as caught:
            self.exercise(steps=49)
        self.assertEqual(caught.exception.reason_code, 'OPTIMIZATION_INCOMPLETE')

    def test_unchanged_encoder_rejected(self):
        with self.assertRaises(adapter.InvariantError) as caught:
            self.exercise(change=False)
        self.assertEqual(caught.exception.reason_code, 'ENCODER_UNCHANGED')

    def test_non_cpu_device_rejected(self):
        with self.assertRaises(adapter.InvariantError) as caught:
            self.exercise(device='mps')
        self.assertEqual(caught.exception.reason_code, 'CPU_CONSTRAINT')

    def test_frozen_trainer_cpu_rejection_has_explicit_reason(self):
        with self.assertRaises(adapter.InvariantError) as caught:
            self.exercise(helper_cpu_failure=True)
        self.assertEqual(caught.exception.reason_code, 'CPU_CONSTRAINT')

    def test_reload_parity_above_tolerance_rejected(self):
        with self.assertRaises(adapter.InvariantError) as caught:
            self.exercise(reload_delta=1e-8)
        self.assertEqual(caught.exception.reason_code, 'RELOAD_PARITY')

    def test_nonfinite_encoder_weights_have_distinct_reason(self):
        with self.assertRaises(adapter.InvariantError) as caught:
            self.exercise(nonfinite_weights=True)
        self.assertEqual(caught.exception.reason_code, 'NONFINITE_WEIGHTS')

    def test_invalid_training_scores_have_distinct_reason(self):
        with self.assertRaises(adapter.InvariantError) as caught:
            self.exercise(invalid_scores=True)
        self.assertEqual(caught.exception.reason_code, 'INVALID_SCORES')


if __name__ == '__main__':
    unittest.main()
