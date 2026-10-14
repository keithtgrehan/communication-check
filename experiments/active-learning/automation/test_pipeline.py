import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
import pipeline as p

class MetricsTests(unittest.TestCase):
    def test_abstentions_do_not_inflate_recall(self):
        m=p.binary_metrics([1,1,0,0],[1,None,1,None])
        self.assertEqual(m['recall'],.5)
        self.assertEqual(m['precision'],.5)
        self.assertEqual(m['coverage'],.5)
        self.assertEqual(m['fp'],1)
        self.assertEqual(m['selectiveRecall'],1)
        self.assertEqual(m['abstentions'],2)
    def test_no_predictions_is_undefined_precision(self):
        m=p.binary_metrics([1,0],[None,None])
        self.assertIsNone(m['precision']);self.assertEqual(m['recall'],0);self.assertEqual(m['coverage'],0)
    def test_threshold_never_uses_ambiguous_references(self):
        rows=[{'label':1},{'label':0},{'label':None}]
        a=p.choose_threshold(rows,[.8,.2,.9])
        b=p.choose_threshold(rows,[.8,.2,.1])
        self.assertEqual(a,b);self.assertTrue(a['gatePassed']);self.assertEqual(a['threshold'],.8)
    def test_low_coverage_cannot_pass_development(self):
        result=p.choose_threshold([{'label':1},{'label':1},{'label':0}],[.9,None,.1])
        self.assertFalse(result['gatePassed']);self.assertEqual(result['threshold'],.5)
    def test_invalid_scores_fail_closed(self):
        for value in (float('nan'),float('inf'),1.1,-.1,True):
            with self.assertRaises(ValueError):p.predictions([value],.5)
    def test_difficult_and_ambiguous_not_dropped(self):
        rows=[dict(id='a',label=1,category='firm_delivery',tags=['negation']),dict(id='b',label=0,category='reported',tags=['attribution']),dict(id='c',label=None,category='ambiguous',tags=['mixed'])]
        result=p.assess(rows,[.1,.9,.9],.5)
        self.assertEqual(result['metrics']['n'],2)
        self.assertEqual(len(result['failures']),2)
        self.assertEqual(result['ambiguous']['positive'],1)
        self.assertEqual(result['targeted']['attribution']['fp'],1)
    def test_binary_negative_never_gets_fabricated_category_or_rationale(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            rows=[dict(id='a',label=0,category='request',source='synthetic-ai-author',group='g')]
            p.export_annotations(root,rows,'C42',dict(scores=[.1],categories=[None],provenance={'modelId':'original'}),.5,'final')
            row=json.loads((root/'annotations/C42-final.json').read_text())[0]
            self.assertEqual(row['category'],'not_firm_delivery');self.assertIsNone(row['rationale']);self.assertIsNone(row['supportingText'])
    def test_manifest_rejects_tamper_and_escape(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);path=root/'data';path.write_text('original')
            manifest={'data':p.sha(path)};p.verify_map(manifest,root)
            path.write_text('changed')
            with self.assertRaises(ValueError):p.verify_map(manifest,root)
            with self.assertRaises(ValueError):p.verify_map({'../outside':'unused'},root)
    def test_run_id_replay_is_refused_before_mutation(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);run=root/'runs/already';run.mkdir(parents=True);(run/'sentinel').write_text('preserved')
            with patch.object(p,'ROOT',root),self.assertRaises(FileExistsError):
                p.run_pipeline(type('Args',(),{'run_id':'already'})())
            self.assertEqual((run/'sentinel').read_text(),'preserved')

if __name__=='__main__':unittest.main()
