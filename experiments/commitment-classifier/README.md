# Commitment wording lab

An isolated, local experiment for Communication Check. It learns a binary wording
classification from fictional examples. It is not imported by the application and
does not change the production checker.

## Result: do not integrate this candidate

The frozen candidate failed the research criterion. On 60 independently authored
synthetic cases, it detected **1 of 30 firm-delivery assertions and missed 29**.
It emitted no false positives on 30 non-firm cases. Its one emission happened to
be correct; the resulting precision fraction of 1/1 is not a reliability claim.

| Frozen independent synthetic test | Learned classifier | Existing checker proxy | Always negative |
| --- | ---: | ---: | ---: |
| Firm assertions detected | 1/30 | 0/30 | 0/30 |
| Firm assertions missed | 29/30 | 30/30 | 30/30 |
| Non-firm passages incorrectly flagged | 0/30 | 0/30 | 0/30 |
| Recall for this synthetic wording task | 3.3% | 0% | 0% |

The existing checker deliberately suppresses many ordinary delivery statements in
this different task. This table therefore **does not demonstrate improved product
detection**. The learned candidate's low recall is independently enough to reject
integration. All eight separately unscored ambiguous passages were forced into the
negative class; no semantic-uncertainty capability was demonstrated.

Development results had already warned of the issue: the selected 0.65 threshold
detected 1/15 positives and no false positives among 15 negatives. At 0.50 it would
have detected 13/15 positives but incorrectly flagged 6/15 negatives. These are
development-only observations, not alternative independently evaluated candidates.

Only one independent evaluation was performed. The evaluator verified all frozen
implementation/model/baseline hashes before and after it; no test-informed model
or threshold changes followed. [Aggregate report](artifacts/evaluation-summary.json)
and [frozen hashes](artifacts/freeze.json) preserve the evidence. Raw blind fixtures
remain outside the repository and were not supplied to implementation agents.

The package demonstrates that training, portable inference and local privacy can
be engineered separately from recognition quality. It does not validate this data
recipe or model choice. A possible later study would first align labels with useful
customer-follow-up findings and obtain human adjudication, then compare a pretrained
encoder against this lexical baseline using a new untouched evaluation set. That
study has not been performed and is not a release prerequisite for the current app.

## Run locally

Verified: 11 JavaScript tests, four Python tests and 16 Chromium lab checks,
including exact text/selection, editing invalidation, offline inference, no input
requests/logging/persistence, zero automated accessibility violations and 320px
layout. The lead independently retrained the model and verified all 14 frozen
hashes. Existing application validation passed (8 setup, 466 unit, 94 browser,
typecheck/build/source guards). These are automated checks, not human validation.
Both reviewers approve delivery of the research package and reject integration of
this candidate. [Engineering evidence](artifacts/engineering-verification.json)
and [browser evidence](artifacts/browser-verification.json) record the checks.

From the repository root, with the existing Node installation:

```sh
node experiments/commitment-classifier/server.mjs
```

Open <http://127.0.0.1:4187/>. The saved model is ready to load; retraining is not
required to try the lab. Keep the server process running while using it.

To reproduce training and checks using Python 3.11.3 with the versions in
`requirements-training.txt` (already available on the development machine):

```sh
python3 experiments/commitment-classifier/train.py --data experiments/commitment-classifier/data/train-dev.json --out work/commitment-classifier-retrain
python3 -m unittest discover -s experiments/commitment-classifier/tests -p 'test_*.py'
node --test experiments/commitment-classifier/tests/*.test.mjs
```

Retraining writes to a separate ignored directory to preserve the evaluated
artifact. Compare its `model.json` hash with `artifacts/freeze.json`. Bit-for-bit
reproducibility was checked within the recorded environment, not across all
platforms/library versions. The original independent test fixtures remain private
to the evaluator; their aggregate report is the shareable evaluation evidence.

## Question being tested

Can a small trained text classifier recognise an author's unqualified prospective
delivery assertion across unseen wording? A positive classification does **not**
mean a commitment is wrong, unapproved, untrue or useful to flag. Determining
whether a review prompt helps a writer is a separate product question.

The input is one English passage of at most 2,000 UTF-16 code units. The displayed
passage is exactly what was supplied; it is not a model-generated explanation or
learned span localisation. Quotes, requests, qualified intentions, historical
statements and non-delivery wording are negative examples. Mixed or ambiguous
passages are tested separately from binary accuracy. Invalid inputs are rejected;
the current model does not reliably recognise semantic uncertainty or abstain on it.

## What learns

The trainer fits a word unigram/bigram TF-IDF vocabulary on training examples only,
then fits balanced logistic regression with fixed settings. The resulting weights,
vocabulary and IDF values are exported to JSON. Browser JavaScript performs the
same feature calculation and prediction. This is a learned lexical model, not a
pretrained semantic encoder, a generative LLM or a list of manually assigned
classification keywords. Generalisation beyond familiar words may be limited.

The development set chooses a threshold from 0.50–0.90 in 0.05 steps: require at
least 0.90 precision, maximise recall and break ties toward the larger threshold.
If none qualifies, the threshold is 0.90 and the development gate explicitly fails.
Model scores are uncalibrated; they are not confidence percentages or probabilities
that a draft is safe/correct. They are kept out of the interactive presentation.

## Evidence boundaries

- Training/development material is newly written fictional text with labels supplied
  by an AI product-manager agent. It is not human ground truth or customer research.
- The independent product-review agent authors and freezes separate evaluation
  material outside the repository. Implementers receive only aggregate results.
  This is procedural separation, not a filesystem sandbox or independent human
  authorship. Shared model-family biases can still affect both sets.
- Scenario families must not cross train/development splits; exact duplicates are
  rejected. These checks do not establish semantic independence automatically.
- Model, operating threshold and evaluation implementation are frozen before a
  single blind test. No tuning against that test or repeated untouched-test claim.
- The baseline calls the actual unchanged `checkDraft` engine and selects its
  commitment-confirmation findings. That engine covers pricing and capabilities as
  well as delivery, and intentionally suppresses ordinary document-sharing promises
  that this experiment labels positive. It is a non-equivalent comparator in both
  directions. An always-negative baseline is also reported. Neither comparison
  measures finding usefulness or establishes an improvement to the whole checker.
- The provisional 90% precision / 70% recall / zero request-or-report false-positive
  criterion only decides whether a later human-labelled study is worth considering.
  It does not authorise integration or establish general reliability.

No earlier heldout material is used, and no historical failed result is replaced.
The production application, frozen baseline and Prism experiment remain preserved.

## Data and privacy

The experiment uses no customer data, hosted LLM API, pretrained download or paid
service. The page and static model load from a loopback-only local server; submitted
passages are classified in browser memory. The server serves static assets and has
no classification/submission API. Runtime browser checks must verify no passage in
network requests, console output, URLs or browser storage and successful offline
classification. Reloading clears user input and results. Do not infer that all
possible browser extensions, host software or unrelated workflows share this scope.

The synthetic train/development files and model artifact are intentionally stored
for reproducibility. User-entered lab passages are not training data and do not
update the model. New learning requires a deliberate labelled-data/training cycle.

## Research informing the choice

Reviewed 13 October 2026; no public datasets were ingested into this experiment.

- [scikit-learn text feature extraction](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)
  documents the small, reproducible lexical baseline used here.
- [SetFit documentation](https://huggingface.co/docs/setfit/en/index) describes a
  potential later pretrained-encoder comparator. It is not implemented or benchmarked
  here; adding downloads/export complexity was outside this bounded first test.
- [Synthetic Data Generation with LLMs: Potential and Limitations](https://aclanthology.org/2023.emnlp-main.647/)
  motivates measuring domain/subjectivity limits instead of treating generated
  labels as validation.
- [Stanford Politeness Corpus](https://zissou.infosci.cornell.edu/socialkit/documentation/stack_politeness.html)
  labels politeness in online requests, not the present delivery-wording task.
- [RADAR action-item dataset](https://www.cs.cmu.edu/~pbennett/action-item-dataset.html)
  supplies action-item labels but replaces word tokens with random strings and is
  described as distributed for research; it was not used as semantic training text.

The plan and both review decisions are recorded in
[`docs/IMPLEMENTATION_PLAN.md`](../../docs/IMPLEMENTATION_PLAN.md).
