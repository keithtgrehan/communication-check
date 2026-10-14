# Local encoder comparison

This isolated research package compares learned lexical features, a frozen small
pretrained encoder and SetFit adaptation. The target is an author's unqualified
future-delivery assertion. It does not determine whether a promise is true,
approved, risky or useful to flag. The shipped Communication Check is unchanged.

## Results

**Complete: local training works; no candidate meets the research criteria.**

The preselected SetFit run C42 detected 27/30 firm assertions, matching TF-IDF,
while incorrectly flagging 6/30 non-firm passages versus 11/30. These are five fewer
false positives in aggregate, not proof of five specific corrections or a statistically
established improvement. C42 precision is 27/33 = 81.8%, below the 90% target.

| Candidate | TP | FN | FP | TN | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A — TF-IDF | 27 | 3 | 11 | 19 | 71.1% | 90.0% | 0.794 |
| B — frozen MiniLM | 24 | 6 | 8 | 22 | 75.0% | 80.0% | 0.774 |
| C42 — SetFit primary | 27 | 3 | 6 | 24 | 81.8% | 90.0% | 0.857 |
| C43 — SetFit robustness | 24 | 6 | 7 | 23 | 77.4% | 80.0% | 0.787 |
| C44 — SetFit robustness | 27 | 3 | 7 | 23 | 79.4% | 90.0% | 0.844 |

All 60 cases were admitted. Every development gate failed, so all test thresholds
were the predeclared diagnostic 0.50. Every research gate also failed. No settings
were changed after the test. An always-negative baseline has TP0/FN30/FP0/TN30;
its positive precision is undefined and recall is zero.

Negative-category errors (each entry is false positives / category count):

| Candidate | Qualified | Requests | Reported | Other |
| --- | ---: | ---: | ---: | ---: |
| A — TF-IDF | 2/8 | 2/8 | 4/8 | 3/6 |
| B — frozen MiniLM | 4/8 | 2/8 | 0/8 | 2/6 |
| C42 — SetFit primary | 3/8 | 1/8 | 0/8 | 2/6 |
| C43 — SetFit robustness | 3/8 | 2/8 | 0/8 | 2/6 |
| C44 — SetFit robustness | 3/8 | 2/8 | 0/8 | 2/6 |

SetFit varied across seeds: 24–27/30 positives detected and 6–7/30 false
positives. C42 was designated primary before testing; it was not chosen because
of this result. Frozen MiniLM also had zero reported-speech errors, so that change
cannot be attributed exclusively to SetFit adaptation. This test has artificial
50/50 prevalence and six scenario clusters; it is not 60 independent real-user
observations. Do not compare directly with the earlier experiment's 1/30 result:
its test cases and threshold policy differed.

Observed final-run CPU costs (warm single-passage latency uses ten training passages):

| Candidate | Build seconds | Artifact MB | Warm median ms |
| --- | ---: | ---: | ---: |
| A — TF-IDF | 0.28 | 0.06 | 0.076 |
| B — frozen MiniLM | 1.56 | 91.63 | 4.293 |
| C42 — SetFit primary | 11.15 | 91.83 | 4.276 |
| C43 — SetFit robustness | 8.12 | 91.83 | 4.193 |
| C44 — SetFit robustness | 7.97 | 91.83 | 4.180 |

**Recommendation:** retain these models as an exploratory local research result.
Do not integrate a candidate. Human-review 20–30 new passages to establish when a
commitment prompt is useful; that is rubric development, not accuracy validation.
Do not tune against the consumed test or silently change this wording target.

Evidence: [full test aggregates](artifacts/evaluation.json),
[development curves and fitting metadata](artifacts/training-summary.json),
[frozen bundle](artifacts/freeze.json), [independent product review](artifacts/product-review.md).
The frozen bundle covers 67 files; its SHA-256 is
`ce05cc78086746d0d2c2e59c693dfee7e5f40924dc72804c888fa445e3d450ea`.

## Design and data

[DESIGN.md](DESIGN.md) records the pre-training product/engineering approvals and
fixed experiment. All arms use the same 120 training / 30 development passages;
[data-audit.md](data-audit.md) documents the unchanged labels and split. These are
fictional AI-authored labels, not human validation. Related scenario contrasts stay
together. Broad grammatical constructions still overlap across splits; this is
not a template-independent or natural-prevalence sample.

- **A:** unigram/bigram TF-IDF and balanced logistic regression.
- **B:** frozen MiniLM, normalized sentence embeddings and logistic regression.
- **C42/C43/C44:** the same encoder adapted by SetFit using three predetermined
  seeds, then the same logistic head. C42 is primary; C43/C44 measure seed sensitivity.
- Model: `sentence-transformers/all-MiniLM-L6-v2`, Apache-2.0, immutable revision
  `1110a243fdf4706b3f48f1d95db1a4f5529b4d41`. Model card and downloaded-file hashes are
  in `artifacts/model-reference.json`. Large weights and the virtual environment
  remain local and ignored; scripts and metadata reproduce them.
- CPU adaptation: 50 optimization steps per seed, five pair-sampling iterations,
  batch 16, learning rate 2e-5. Only training examples generate pairs or fit heads.
  No broad hyperparameter search. All head random states remain 42.
- Development selects from thresholds 0.05–0.95 by 0.05, requiring precision >=90%
  **and** recall >=70%, then maximizing recall, precision and threshold. A failed
  development gate uses 0.50 only for diagnostics and cannot become a passing candidate.
- Input must be nonempty, <=2,000 UTF-16 units, and <=256 actual tokenizer tokens
  including special tokens. Oversized input is rejected, not truncated. The same
  rule applies to every arm. English is the study scope, not a detected language guarantee.

An independent agent authors and freezes 60 fresh cases, 30 per label, in six new
scenarios. Negative categories cover qualified wording, requests, reported speech
and other statements. Raw fixtures stay outside the repository; implementers see
only aggregates. Separation is procedural, not an access-control sandbox. Shared
AI author biases and short passages limit inference about real drafts.

The candidate bundle is frozen before the single test. The evaluator verifies
hashes before and after, checks overlap/admission, and marks the run consumed before
predictions. No test-informed tuning or best-seed selection is permitted. A test
result meeting 90% precision / 70% recall and zero request/report false positives is
only a provisional research criterion, not permission to integrate or deploy.

## Use the saved local models

From this directory, provide one passage through standard input:

```sh
printf '%s' 'We will deliver the revised schedule on Friday.' | .venv/bin/python experiment.py predict --candidate C42
```

Choose `A`, `B`, `C42`, `C43` or `C44`. Output includes a label, admission result,
threshold, development-gate status and an explicitly uncalibrated score. It does not
echo or persist the passage. This is a local Python command, not the existing browser
lab. It neither updates itself from input nor writes review findings to the app.

## Reproduce without overwriting the evaluated run

`train` refuses existing model outputs; `prepare` and `freeze` also refuse overwrite.
Use a fresh copy containing only the experiment source/data:

```sh
# Run from the repository root. The existing virtual environment is reused.
mkdir -p work
comparison_copy=$(mktemp -d "$PWD/work/encoder-reproduce.XXXXXX")
cp experiments/encoder-comparison/*.py experiments/encoder-comparison/requirements* experiments/encoder-comparison/DESIGN.md experiments/encoder-comparison/data-audit.md "$comparison_copy/"
cp -R experiments/encoder-comparison/data experiments/encoder-comparison/tests "$comparison_copy/"
experiments/encoder-comparison/.venv/bin/python "$comparison_copy/experiment.py" prepare --revision 1110a243fdf4706b3f48f1d95db1a4f5529b4d41
experiments/encoder-comparison/.venv/bin/python "$comparison_copy/experiment.py" train
```

On a fresh machine, create a Python 3.11 virtual environment and install
`requirements-lock.txt` before running. The lock records the observed macOS CPU
environment; cross-platform binary availability and bitwise equality are not promised.
PyArrow 19.0.1 and pandas 2.2.3 are pinned to keep the dataset stack compatible with
NumPy 1.26.4. No global Python or app dependencies were changed. Two device-selection attempts
were preserved: the first stopped after 50 MPS updates before C export/development
scoring; the second stopped at zero updates because Accelerate still selected MPS.
A separate one-step TRAIN-only CPU smoke passed; its weights were discarded. Final
models each restart from the original checkpoint and complete 50 CPU steps. The
fix sets CPU controls before trainer creation and checks the actual model, trainer
and accelerator devices. See [setup notes](artifacts/setup-notes.json).

Reproducing training is a development check, not another untouched test. The original
independent fixtures remain evaluator-held. Exact evaluation audit uses their saved
hash and the aggregate report; do not rerun a consumed test and call it fresh evidence.

## Verification and interpretation

All 13 contract tests passed, covering threshold selection, input limits,
schema/leakage checks, freeze/replay guards and portable score equivalence. Training records actual optimization steps, changed
encoder tensors and saved-model reload parity. The lead separately verifies cached
prediction with operating-system networking disabled and preservation of the earlier
experiment/application. All five candidates passed OS-network-blocked prediction. Three rejection checks
passed; inference left 86 artifact files unchanged, with no input echo or canary
in artifact text. The 55 protected original experiment/application files remained
unchanged. Existing app checks passed: eight setup tests, 466 unit tests, typecheck,
build and source guards. Browser tests were not rerun for this isolated Python work.
See [engineering checks](artifacts/engineering-verification.json),
[lead checks](artifacts/lead-verification.json) and [runtime checks](artifacts/runtime-verification.json).

Timings are local CPU observations. Candidate build time includes loading, fitting,
some validation and serialization; it is not pure optimization time. Evaluation
reports model loading separately from batch inference. The TRAIN-only runtime
check additionally measures warm single-passage latency after an excluded warmup.
Its load timings occur sequentially in one process; later models benefit from
already-imported libraries, so these are not clean comparative cold-start benchmarks. Milliseconds per passage
are amortized over the 60-case batch, not interactive single-request latency.
Artifact bytes include encoder configuration/tokenizer files and are not a measured
browser download or memory footprint. Scores are not calibrated probabilities of safety.

The artificial 50/50 prevalence means test precision does not estimate precision in
real customer follow-ups. A positive classification includes ordinary promises that
the current checker intentionally suppresses. Better wording classification therefore
cannot establish better product findings. Human review of a small set of useful versus
unnecessary prompts is the next product decision, separate from this technical pilot.

## Sources

- [SetFit concepts](https://huggingface.co/docs/setfit/en/conceptual_guides/setfit)
- [SetFit training configuration](https://huggingface.co/docs/setfit/en/reference/trainer)
- [Pinned MiniLM model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/blob/1110a243fdf4706b3f48f1d95db1a4f5529b4d41/README.md)

No hosted inference, customer data, model publication, app integration, browser
export, deployment or paid compute is part of this experiment.
