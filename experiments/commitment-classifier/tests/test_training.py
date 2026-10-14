import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('training', Path(__file__).resolve().parents[1] / 'train.py')
training = importlib.util.module_from_spec(spec)
spec.loader.exec_module(training)


def fixture():
    return [dict(id=str(i), group=str(i), split=split, text=text, label=label, category='firm_delivery' if label else 'other')
            for i, (split, text, label) in enumerate([
                ('train', 'We will deliver the module.', 1), ('train', 'Please check the module.', 0),
                ('dev', 'We shall launch the connector.', 1), ('dev', 'The module was launched.', 0)])]


class TrainingValidation(unittest.TestCase):
    def test_accepts_disjoint_binary_splits(self):
        training.validate(fixture())

    def test_blocks_group_leakage(self):
        rows = fixture()
        rows[2]['group'] = rows[0]['group']
        with self.assertRaisesRegex(ValueError, 'Group leakage'):
            training.validate(rows)

    def test_blocks_duplicate_text(self):
        rows = fixture()
        rows[2]['text'] = rows[0]['text']
        with self.assertRaisesRegex(ValueError, 'Duplicate text'):
            training.validate(rows)

    def test_rejects_hidden_test_split(self):
        rows = fixture()
        rows[2]['split'] = 'test'
        with self.assertRaisesRegex(ValueError, 'train/dev'):
            training.validate(rows)


if __name__ == '__main__':
    unittest.main()
