#!/usr/bin/env python3
"""Automatic, bounded extension of the existing teaching and active-learning tools."""
import argparse
import contextlib
import hashlib
import json
import math
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
sys.path.insert(0, str(ROOT.parent))
from core import read, write_new, sha, check_id
import model_adapter
import models

ORDER = ('C42', 'setfit-auto', 'deberta', 'modernbert')

class ResourceLimit(RuntimeError):
    pass
OLD_PYTHON = REPO / 'experiments/encoder-comparison/.venv/bin/python'
NLI_PYTHON = ROOT / '.venv-nli/bin/python'


def binary_metrics(labels, predictions):
    if len(labels) != len(predictions):
        raise ValueError('Metric length mismatch')
    if any(type(y) is not int or y not in (0, 1) for y in labels):
        raise ValueError('Invalid reference')
    if any(p is not None and (type(p) is not int or p not in (0, 1)) for p in predictions):
        raise ValueError('Invalid prediction')
    tp = sum(y == 1 and p == 1 for y, p in zip(labels, predictions))
    fp = sum(y == 0 and p == 1 for y, p in zip(labels, predictions))
    tn = sum(y == 0 and p == 0 for y, p in zip(labels, predictions))
    fn = sum(y == 1 and p == 0 for y, p in zip(labels, predictions))
    ap = sum(y == 1 and p is None for y, p in zip(labels, predictions))
    an = sum(y == 0 and p is None for y, p in zip(labels, predictions))
    n = len(labels)
    return dict(n=n, tp=tp, fp=fp, tn=tn, fn=fn, abstainedPositive=ap, abstainedNegative=an,
                abstentions=ap+an, coverage=(n-ap-an)/n if n else None,
                precision=tp/(tp+fp) if tp+fp else None,
                recall=tp/(tp+fn+ap) if tp+fn+ap else None,
                selectiveRecall=tp/(tp+fn) if tp+fn else None,
                f1=2*tp/(2*tp+fp+fn+ap) if 2*tp+fp+fn+ap else 0,
                falsePositiveRate=fp/(fp+tn+an) if fp+tn+an else None)


def predictions(scores, threshold):
    if not 0 <= threshold <= 1 or any(s is not None and (type(s) not in (float,int) or not math.isfinite(s) or not 0 <= s <= 1) for s in scores):
        raise ValueError('Invalid scores')
    return [None if s is None else int(s >= threshold) for s in scores]


def choose_threshold(rows, scores):
    if len(rows) != len(scores):
        raise ValueError('Score count mismatch')
    pairs = [(r['label'], s) for r, s in zip(rows, scores) if r['label'] is not None]
    labels, values = zip(*pairs) if pairs else ([], [])
    curve = [dict(threshold=i/100, **binary_metrics(labels, predictions(values, i/100))) for i in range(5,96,5)]
    eligible = [x for x in curve if (x['precision'] or 0) >= .9 and (x['recall'] or 0) >= .7 and (x['coverage'] or 0) >= .9]
    chosen = max(eligible, key=lambda x:(x['recall'],x['precision'],x['threshold'])) if eligible else curve[9]
    return dict(threshold=chosen['threshold'], gatePassed=bool(eligible), chosen=chosen, curve=curve)


def assess(rows, scores, threshold):
    if len(rows) != len(scores):
        raise ValueError('Score count mismatch')
    preds = predictions(scores, threshold)
    def subset(indices):
        return binary_metrics([rows[i]['label'] for i in indices], [preds[i] for i in indices])
    indices = [i for i,r in enumerate(rows) if r['label'] is not None]
    categories = {category:subset([i for i in indices if rows[i]['category']==category]) for category in sorted({rows[i]['category'] for i in indices})}
    tags = sorted({tag for row in rows for tag in row.get('tags', [])})
    targeted = {tag:subset([i for i in indices if tag in rows[i].get('tags',[])]) for tag in tags}
    ambiguous = [i for i,r in enumerate(rows) if r['label'] is None]
    return dict(metrics=subset(indices), categories=categories, targeted=targeted,
                ambiguous=dict(n=len(ambiguous), abstentions=sum(preds[i] is None for i in ambiguous), positive=sum(preds[i]==1 for i in ambiguous), negative=sum(preds[i]==0 for i in ambiguous)),
                failures=[dict(id=rows[i]['id'], reference=rows[i]['label'], prediction=preds[i], category=rows[i]['category']) for i in indices if preds[i]!=rows[i]['label']])


def protected_files():
    files = {}
    for base in (REPO/'experiments', REPO/'web', REPO/'evaluation'):
        for path in sorted(base.rglob('*')):
            if not path.is_file() or path.is_relative_to(ROOT):
                continue
            rel = path.relative_to(REPO)
            if any(p in ('.venv','cache','model-cache','__pycache__','node_modules','dist','holdout') for p in rel.parts):
                continue
            files[str(rel)] = sha(path)
    for name in ('package.json','package-lock.json','AGENTS.md'):
        path=REPO/name
        if path.exists(): files[name]=sha(path)
    return files


def verify_map(files, base):
    for relative, expected in files.items():
        path = base/relative
        if not path.resolve().is_relative_to(base.resolve()) or not path.is_file() or sha(path)!=expected:
            raise ValueError('Frozen artifact integrity mismatch: '+relative)


def network_control(run):
    code = "import ctypes,os,socket; lib=ctypes.CDLL('/usr/lib/libsandbox.1.dylib'); assert all(lib.sandbox_check(os.getpid(),op,0)==1 for op in (b'network-outbound',b'network-inbound')); s=socket.socket();\ntry: s.bind(('127.0.0.1',0))\nexcept PermissionError: print('network denied')\nelse: raise AssertionError('network unexpectedly allowed')"
    result = subprocess.run(['/usr/bin/sandbox-exec','-p','(version 1)(allow default)(deny network*)',str(OLD_PYTHON),'-c',code],capture_output=True,text=True,timeout=20)
    if result.returncode or result.stdout.strip()!='network denied':
        raise RuntimeError('OS network-denial control failed')
    # Unsandboxed loopback must work to distinguish unavailable networking from denial.
    import socket
    with socket.socket() as listener: listener.bind(('127.0.0.1',0))
    write_new(run/'network-control.json', dict(deniedControl=True, allowedLoopbackControl=True))


class Executor:
    def __init__(self, run, protocol):
        self.run, self.protocol = run, protocol
        self.started = time.monotonic()
        self.counter = 0
        self.frozen_models = {}

    def freeze_model(self, candidate, directory):
        files={str(p.relative_to(directory)):sha(p) for p in directory.rglob('*') if p.is_file() and '.cache' not in p.relative_to(directory).parts}
        self.frozen_models[candidate]=dict(directory=str(directory),files=files)

    def verify_models(self):
        for frozen in self.frozen_models.values(): verify_map(frozen['files'],Path(frozen['directory']))

    def storage_bytes(self):
        return sum(p.stat().st_size for base in (self.run,ROOT/'models',ROOT/'cache') if base.exists() for p in base.rglob('*') if p.is_file())

    def process(self, command, name, timeout, offline=False):
        import psutil
        if time.monotonic()-self.started>=self.protocol['limits']['totalSeconds']:
            raise ResourceLimit('run_time_limit')
        self.counter += 1
        stem = self.run/'jobs'/f'{self.counter:02d}-{name}'
        stem.parent.mkdir(exist_ok=True)
        if offline:
            command=['/usr/bin/sandbox-exec','-p','(version 1)(allow default)(deny network*)']+command
        env=dict(os.environ, PYTHONDONTWRITEBYTECODE='1', HF_HOME=str(ROOT/'cache'), HF_HUB_DISABLE_TELEMETRY='1', HF_HUB_DISABLE_IMPLICIT_TOKEN='1', HF_HUB_DISABLE_XET='1', DO_NOT_TRACK='1', OMP_NUM_THREADS='4', MKL_NUM_THREADS='4')
        # Credentials are only used implicitly by the existing Codex actor runner.
        if offline: env.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',HF_DATASETS_OFFLINE='1')
        peak=0; reason=None; started=time.monotonic(); known={}; storage=0; last_storage=0
        with stem.with_suffix('.stdout.log').open('xb') as stdout, stem.with_suffix('.stderr.log').open('xb') as stderr:
            p=subprocess.Popen(command,cwd=REPO,env=env,stdout=stdout,stderr=stderr,start_new_session=True)
            while p.poll() is None:
                try:
                    root=psutil.Process(p.pid)
                    for child in [root]+root.children(recursive=True): known[child.pid]=child
                    rss=sum(child.memory_info().rss for child in known.values() if child.is_running())
                    peak=max(peak,rss)
                except (psutil.NoSuchProcess,psutil.AccessDenied): pass
                if time.monotonic()-started>timeout: reason='stage_time_limit'
                if time.monotonic()-self.started>self.protocol['limits']['totalSeconds']: reason='run_time_limit'
                if peak>self.protocol['limits']['peakProcessTreeBytes']: reason='memory_limit'
                if time.monotonic()-last_storage>=1:
                    storage=self.storage_bytes(); last_storage=time.monotonic()
                if storage>self.protocol['limits']['artifactBytes']: reason='artifact_limit'
                if reason:
                    for child in reversed(list(known.values())):
                        with contextlib.suppress(psutil.Error): child.kill()
                    with contextlib.suppress(ProcessLookupError): os.killpg(p.pid,signal.SIGKILL)
                    break
                time.sleep(.2)
            returncode=p.wait()
        result=dict(exitCode=returncode,seconds=time.monotonic()-started,peakProcessTreeBytes=peak,stopReason=reason,networkDenied=offline,watchedArtifactBytes=storage)
        write_new(stem.with_suffix('.resources.json'),result)
        if reason: raise ResourceLimit(f'{name}: {reason}; run stopped')
        if returncode:
            raise RuntimeError(f'{name}: {reason or "worker_failed"}; see preserved job log')
        artifact_bytes=self.storage_bytes()
        if artifact_bytes>self.protocol['limits']['artifactBytes']: raise ResourceLimit('run_artifact_limit')
        return result

    def actor(self,prompt,out,schema):
        path=out.with_suffix('.prompt.txt'); path.write_text(prompt)
        command=[str(OLD_PYTHON),'-B',str(ROOT.parent/'run_agent.py'),'--prompt',str(path),'--out',str(out),'--schema',str(schema),'--no-tools','--cwd','/tmp']
        self.process(command,'actor-'+out.stem,self.protocol['limits']['actorSeconds'])
        return read(out.with_suffix('.actor.json'))

    def worker(self,job,name,offline=True):
        job=dict(job); job.setdefault('run_dir',str(self.run/'candidate'))
        candidate=job['candidate']
        if candidate in ('deberta','modernbert'):
            job.setdefault('model_dir',str(ROOT/'models'/candidate))
            job.setdefault('revision',self.protocol['models'][candidate]['revision'])
        job_folder=self.run/('external/research-only/jobs' if 'hypotheses' in job else 'jobs')
        path=job_folder/f'{self.counter+1:02d}-{name}.job.json'
        if job['action']=='score': self.verify_models()
        write_new(path,job)
        out=path.with_suffix('.result.json')
        python=NLI_PYTHON if candidate in ('deberta','modernbert') else OLD_PYTHON
        resource=self.process([str(python),'-B',str(ROOT/'models.py'),'--job',str(path),'--out',str(out)],name,self.protocol['limits']['downloadSeconds' if not offline else 'modelSeconds'],offline)
        result=read(out); result['processResources']=resource
        if job['action']=='score': self.verify_models()
        if result.get('status')!='ok': raise RuntimeError(name+': '+result.get('status','unknown'))
        return result


def export_annotations(run,rows,candidate,result,threshold,split):
    scores=result['scores']; preds=predictions(scores,threshold)
    if len(scores)!=len(rows): raise ValueError('Annotation score mismatch')
    out=[]
    for i,row in enumerate(rows):
        label=preds[i]
        category='abstain' if label is None else ('firm_delivery' if label else (result['categories'][i] or 'not_firm_delivery'))
        out.append(dict(passageId=row['id'],category=category,label=label,score=scores[i],threshold=threshold,
                        supportingText=None,rationale=None,explanationAvailability='Classifier returns scores, not explanatory evidence.',
                        split=split,model=candidate,modelProvenance=result['provenance'],
                        dataProvenance={k:row.get(k) for k in ('source','group','scenarioDomain','scenarioFamily','referenceProvenance')},
                        referenceLabel=row['label'],referenceCategory=row['category']))
    write_new(run/'annotations'/f'{candidate}-{split}.json',out)


def export_reference_annotations(run, data):
    quarantined={r['id'] for r in data['quarantine']}
    rows={r['id']:r for r in data['rows']}
    for role in ('teacher','reviewer'):
        raw=read(run/'data'/f'{role}-raw.json')
        mapping=read(run/'data'/f'{role}-mapping.json')
        inverse={v:k for k,v in mapping.items()}
        output=[]
        for decision in raw['decisions']:
            ident=inverse[decision['id']]; row=rows[ident]
            valid=bool(decision['evidence']) and all(q and q in row['text'] for q in decision['evidence'])
            accepted=ident not in quarantined
            output.append(dict(passageId=ident,category=decision['category'] if accepted else 'abstain',label=decision['label'] if accepted else None,
                supportingText=decision['evidence'] if valid else None,rationale=decision['rationale'],trainingEligible=accepted,
                annotationType='AI pseudo-label',modelProvenance=data['provenance']['actors'][role]['metadata'],
                dataProvenance=dict(source=row['source'],group=row['group']),quarantined=not accepted))
        write_new(run/'annotations'/f'{role}-train.json',output)
    write_new(run/'annotations/synthetic-references.json',[dict(passageId=r['id'],category=r['category'],label=r['label'],supportingText=r['evidence'],rationale=r['rationale'],split=r['split'],annotationType='AI authored synthetic reference, not human gold',source=r['source'],group=r['group']) for r in data['rows']])


def comparison_report(run,report):
    lines=['# Automated wording comparison', '', f"Status: {report['status']}. No production integration.", '', 'AI synthetic references are not human gold. Firm delivery does not establish whether product advice is useful.', '', '## Synthetic final reference', '', '| Candidate | TP | FP | FN | Precision | Recall | Coverage | F1 |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |']
    for candidate in ORDER:
        result=report.get('candidates',{}).get(candidate,{})
        m=result.get('final',{}).get('metrics')
        if m:
            fmt=lambda value: 'n/a' if value is None else f'{value:.3f}'
            lines.append(f"| {candidate} | {m['tp']} | {m['fp']} | {m['fn']} | {fmt(m['precision'])} | {fmt(m['recall'])} | {fmt(m['coverage'])} | {fmt(m['f1'])} |")
        else: lines.append(f"| {candidate} | — | — | — | {result.get('status','unavailable')} | — | — | — |")
    lines += ['',report.get('decision','No candidate comparison completed.'),'','## Published labels and agreement','', 'Published ML-Promise PI is a separate ESG task; it is never counted as target-task evidence or used for training. Its non-commercial data stays under external/research-only/.', '']
    for name,value in report.get('publishedBenchmark',{}).get('candidates',{}).items():
        m=value['metrics'];lines.append(f"- {name}: TP {m['tp']}, FP {m['fp']}, FN {m['fn']}; precision {m['precision']}, recall {m['recall']}, coverage {m['coverage']}.")
    lines += ['The author-hosted test release contains 400 rows, versus 200 English test rows described in the paper; this is a fixed 64-row sample of that release, not an exact published-score reproduction.',report.get('publishedBenchmark',{}).get('status','Not run.'),'', 'Pairwise model agreement is in report.json and is not calibrated confidence. Training labels require two separate validated actor sessions; shared model-family bias remains.', '', '## Runtime and limits','']
    for name,value in report.get('candidates',{}).items():
        if 'runtime' in value:
            r=value['runtime'];lines.append(f"- {name}: load {r['timing']['loadSeconds']:.2f}s; batch inference {r['timing']['inferenceSeconds']:.2f}s ({r['amortizedMillisecondsPerPassage']:.1f} ms/passage amortized); peak process RSS {r['peakRssBytes']/1024**3:.2f} GiB.")
    lines += ['', 'Category failures and targeted negation/attribution/conditional scenario slices are in report.json; all difficult final rows remain, including null-reference ambiguity diagnostics.']
    lines += ['', 'All thresholds and hypotheses were frozen before final scoring. No final-error tuning or example replacement. Results are a small synthetic diagnostic, not customer-email accuracy or warning usefulness.', '', 'Human audit from active-001 remains unperformed; it is not a gate for this automated milestone.', '', 'Best next action: retain the measured candidate results as local research; use this frozen run for reproducibility checks before considering a separately authorised product decision.', '']
    if report.get('failure'): lines += ['Failure: '+report['failure'],'']
    (run/'REPORT.md').write_text('\n'.join(lines))


def run_pipeline(args):
    check_id(args.run_id)
    run=ROOT/'runs'/args.run_id
    run.mkdir(parents=True,exist_ok=False)
    protocol=read(ROOT/'protocol.json')
    if sha(ROOT/'protocol.json')!=(ROOT/'protocol.sha256').read_text().strip(): raise ValueError('Protocol hash mismatch')
    write_new(run/'protocol.json',protocol)
    source={str(p.relative_to(REPO)):sha(p) for base in (ROOT,ROOT.parent) for p in base.glob('*.py')}
    source.update({str(p.relative_to(REPO)):sha(p) for p in ROOT.glob('*.json')})
    write_new(run/'source-freeze.json',source)
    preserved=protected_files();write_new(run/'protected.json',preserved)
    report=dict(status='failed',candidates={},publishedBenchmark={},decision='No valid comparison completed.',protocolSha256=sha(run/'protocol.json'))
    executor=Executor(run,protocol)
    started=time.time()
    try:
        model_adapter.baseline_integrity(); network_control(run)
        for candidate in ('deberta','modernbert'):
            try:
                model_dir=ROOT/'models'/candidate
                if (model_dir/'worker-model-reference.json').exists():
                    models.verify_model(dict(candidate=candidate,model_dir=str(model_dir),revision=protocol['models'][candidate]['revision']))
                    write_new(run/f'{candidate}-download.json',dict(status='verified_cached',reference=read(model_dir/'worker-model-reference.json')))
                else:
                    result=executor.worker(dict(action='download',candidate=candidate),'download-'+candidate,offline=False)
                    write_new(run/f'{candidate}-download.json',result)
            except ResourceLimit: raise
            except Exception as error:
                report['candidates'][candidate]=dict(status='unavailable',reason=str(error))
        from external_data import prepare_external
        external=prepare_external(run)
        write_new(run/'external-summary.json',{k:v for k,v in external.items() if k!='rows'})
        report['publishedBenchmark']=dict(status=external.get('status','prepared'),sources=external.get('sources',[]),candidates={})
        from data_stage import prepare
        data=prepare(run,protocol,executor.actor)
        write_new(run/'prepared.json',data)
        export_reference_annotations(run,data)
        if not data['protocolValid']: raise ValueError('Synthetic split integrity failed; all rows retained, no target scoring.')
        additions=data['trainAdditions']
        eligible=len(additions)>=8 and all(sum(r['label']==y for r in additions)>=4 for y in (0,1))
        if eligible:
            try:
                trained=executor.worker(dict(action='train',candidate='setfit-auto',data=model_adapter.load_base_rows()+additions,recipe=protocol['training']['recipe']),'train-once')
                report['training']=trained
            except ResourceLimit: raise
            except Exception as error: report['candidates']['setfit-auto']=dict(status='failed',reason=str(error))
        else: report['candidates']['setfit-auto']=dict(status='skipped_insufficient_eligible_data')
        report['data']=dict(trainAdditions=len(additions),quarantine=len(data['quarantine']),dev=len(data['dev']),final=len(data['final']),provenance=data['provenance'])
        for candidate in ('deberta','modernbert'):
            if candidate not in report['candidates']: executor.freeze_model(candidate,ROOT/'models'/candidate)
        if 'setfit-auto' not in report['candidates']: executor.freeze_model('setfit-auto',run/'candidate/model')
        write_new(run/'model-freeze.json',executor.frozen_models)
        thresholds={}
        for candidate in ORDER:
            if candidate in report['candidates']: continue
            try:
                result=executor.worker(dict(action='score',candidate=candidate,texts=[r['text'] for r in data['dev']]),candidate+'-dev')
                operating=choose_threshold(data['dev'],result['scores'])
                thresholds[candidate]=operating
                report['candidates'][candidate]=dict(status='dev_complete',operatingPoint=operating,dev=assess(data['dev'],result['scores'],operating['threshold']))
                export_annotations(run,data['dev'],candidate,result,operating['threshold'],'dev')
            except ResourceLimit: raise
            except Exception as error: report['candidates'][candidate]=dict(status='failed',reason=str(error))
        write_new(run/'selection-freeze.json',dict(thresholds=thresholds,hypotheses=models.HYPOTHESES,finalSha256=hashlib.sha256(json.dumps(data['final'],sort_keys=True).encode()).hexdigest(),compactModelFreeze=executor.frozen_models.get('setfit-auto'),modelFiles={c:read(ROOT/'models'/c/'worker-model-reference.json') for c in ('deberta','modernbert') if c in thresholds}))
        write_new(run/'final-consumed.json',dict(startedAt=time.time(),note='Any subsequent execution is replication, never fresh evidence.'))
        final_preds={}
        for candidate,operating in thresholds.items():
            try:
                result=executor.worker(dict(action='score',candidate=candidate,texts=[r['text'] for r in data['final']]),candidate+'-final')
                report['candidates'][candidate].update(status='complete',final=assess(data['final'],result['scores'],operating['threshold']),runtime=dict(timing=result['timing'],amortizedMillisecondsPerPassage=result['timing']['inferenceSeconds']*1000/len(data['final']),peakRssBytes=result['peakRssBytes'],processResources=result['processResources']))
                final_preds[candidate]=predictions(result['scores'],operating['threshold'])
                export_annotations(run,data['final'],candidate,result,operating['threshold'],'final')
            except ResourceLimit: raise
            except Exception as error: report['candidates'][candidate].update(status='failed_final',reason=str(error))
        report['modelAgreement']={a+' vs '+b:dict(n=len(pa),bothCovered=sum(x is not None and y is not None for x,y in zip(pa,final_preds[b])),agree=sum(x==y and x is not None for x,y in zip(pa,final_preds[b])),interpretation='Agreement is not correctness or confidence.') for i,(a,pa) in enumerate(final_preds.items()) for b in list(final_preds)[i+1:]}
        finals={c:v for c,v in report['candidates'].items() if 'final' in v}
        if finals:
            winner=max(finals,key=lambda c:(finals[c]['final']['metrics']['f1'],finals[c]['final']['metrics']['precision'] or 0,-finals[c]['final']['metrics']['fp'],-ORDER.index(c)))
            base=finals.get('C42',{}).get('final',{}).get('metrics')
            best=finals[winner]['final']['metrics']
            improved=bool(base and winner!='C42' and best['f1']>base['f1'] and best['fp']<=base['fp'] and finals[winner]['operatingPoint']['gatePassed'])
            report.update(diagnosticWinner=winner,improved=improved,decision=f'Diagnostic best under the declared synthetic tests: {winner}. '+('Met the predeclared diagnostic improvement rule.' if improved else 'No candidate established improvement under the predeclared rule.')+' No production promotion or usefulness claim.')
        for candidate in ('deberta','modernbert'):
            if candidate not in thresholds or not external.get('rows'): continue
            try:
                extrows=external['rows']
                result=executor.worker(dict(action='score',candidate=candidate,texts=[r['text'] for r in extrows],hypotheses={'firm_delivery':protocol['publishedBenchmark']['hypothesis']}),candidate+'-published')
                report['publishedBenchmark']['candidates'][candidate]=assess(extrows,result['scores'],.5)
                # Keep restricted passages/labels and derivatives in their own research-only area.
                write_new(run/'external/research-only'/f'{candidate}-predictions.json',[dict(passageId=r['id'],publishedLabel=r['label'],prediction=p,score=s,task='ML-Promise PI, not firm_delivery',provenance=result['provenance']) for r,p,s in zip(extrows,predictions(result['scores'],.5),result['scores'])])
            except ResourceLimit: raise
            except Exception as error: report['publishedBenchmark'].setdefault('failures',{})[candidate]=str(error)
        report['status']=('completed' if len(finals)==4 else 'completed_with_unavailable_candidates') if 'C42' in finals and len(finals)>=2 else 'failed_insufficient_comparison'
    except Exception as error:
        report['failure']=str(error)
        report['improved']=False
        report['decision']='Run did not complete; any recorded partial metrics are diagnostic only. No improvement established.'
    finally:
        try:
            verify_map(preserved,REPO);verify_map(source,REPO);model_adapter.baseline_integrity();executor.verify_models()
            report['integrity']=dict(protectedFilesVerified=len(preserved),sourcesVerified=len(source),baselineBundlesVerified=True)
        except Exception as error:
            report['status']='failed_integrity';report['failure']=str(error);report['improved']=False;report['decision']='Integrity failed; no valid improvement claim.'
        report['wallSeconds']=time.time()-started
        write_new(run/'report.json',report);comparison_report(run,report)
        files={str(p.relative_to(run)):sha(p) for p in sorted(run.rglob('*')) if p.is_file()}
        write_new(run/'freeze.json',dict(files=files,bundleSha256=hashlib.sha256(json.dumps(files,sort_keys=True).encode()).hexdigest()))
    print(json.dumps(dict(run=str(run),status=report['status'],decision=report['decision'],failure=report.get('failure'))))
    return 1 if report['status'].startswith('failed') else 0


def verify_run(run):
    freeze=read(run/'freeze.json')
    if hashlib.sha256(json.dumps(freeze['files'],sort_keys=True).encode()).hexdigest()!=freeze['bundleSha256']: raise ValueError('Manifest map mismatch')
    verify_map(freeze['files'],run)
    verify_map(read(run/'protected.json'),REPO)
    report=read(run/'report.json')
    # Deterministically recompute recorded final metrics without consuming another model run.
    data=read(run/'prepared.json') if (run/'prepared.json').exists() else None
    if data:
        for candidate,result in report['candidates'].items():
            if 'final' not in result: continue
            annotations=read(run/'annotations'/f'{candidate}-final.json')
            if assess(data['final'],[r['score'] for r in annotations],result['operatingPoint']['threshold'])!=result['final']: raise ValueError('Metric reproduction differs')
    return dict(status='verified',files=len(freeze['files']),bundleSha256=freeze['bundleSha256'],recordedStatus=report['status'])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('run','verify'))
    parser.add_argument('--run-id',required=True)
    args=parser.parse_args();check_id(args.run_id)
    if args.command=='run': return run_pipeline(args)
    print(json.dumps(verify_run(ROOT/'runs'/args.run_id)));return 0

if __name__=='__main__':
    raise SystemExit(main())
