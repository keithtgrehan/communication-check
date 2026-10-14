# Local encoder comparison — 14 October 2026

## Finish line and authority

Keith explicitly authorised this local research package: train lexical, frozen
encoder and SetFit candidates; perform one frozen independent synthetic comparison;
deliver reproducible scripts, local models, validation and an honest recommendation.
No app changes, interface, browser export, hosted inference, release or spending.
Preserve the earlier experiment and all historical evaluation material.

## Locked experimental design

- Target: author-owned, unqualified prospective delivery assertion. Includes routine
  document promises; does not identify wrong, unapproved or useful-to-flag promises.
- Begin with the existing 150 fictional agent-labelled examples. PM audits labels,
  duplicate text and actual scenario/template/paraphrase families. Preserve original
  data. If necessary make a documented grouped split shared by every arm. No examples
  from heldout sets, development-fitted vocabulary, or development contrastive pairs.
- A: word unigram/bigram TF-IDF plus balanced logistic regression, C=1, liblinear,
  max_iter=1000, tol=1e-8, random_state=42. Fit vocabulary/IDF on training only.
- B: frozen sentence-transformers/all-MiniLM-L6-v2 plus that logistic head; normalised
  embeddings. Pin the same immutable checkpoint revision used by C.
- C: SetFit adaptation of that checkpoint, same normalised embeddings/head as B.
  Predetermined seeds 42, 43, 44; C42 is the primary adapted-encoder comparison and
  C43/C44 are robustness checks. All are reported, no best-test-seed selection. Initial
  bounded recipe: CPU, batch 16, five pair-sampling iterations, max 50 body steps,
  one epoch, body learning rate 2e-5. Runtime feasibility changes may use TRAIN-only
  smoke checks and must be recorded before model fitting/development evaluation.
  Logistic-head random_state remains 42 for every arm; only adaptation seeds vary.
- Admission: nonempty English passage within the existing 2,000 UTF-16 limit and
  actual tokenizer length including special tokens <=256. No silent truncation.
  Apply identical admission to all arms; report exclusions and coverage separately.
- Development thresholds: 0.05 through 0.95 in 0.05 increments. Eligibility requires
  positive precision >=0.90 AND recall >=0.70. Choose maximum recall, then precision,
  then threshold. If none qualifies, mark FAILED and use 0.50 for diagnostics only.
  Undefined precision is null, never a perfect score. Scores are uncalibrated.
- Independently author and freeze 60 fresh synthetic test passages (30/30), with
  qualified/request/reported/other negative categories and grouped scenarios.
  Evaluator keeps raw material outside shared source and implementation-agent access.
  This is procedural separation, not an enforced sandbox; labels are not human truth.
- Freeze source, inputs, environment, model artifacts and thresholds before evaluating
  all arms together once. Verify hashes before/after. No test-informed tuning.
- Report confusion counts, precision/recall/F1, negative-category false positives,
  coverage, all seed results, full development threshold curves, training/inference
  timing and artifact sizes. Provisional test interest criterion: >=90% precision,
  >=70% recall and zero request/report false positives; development failures remain
  failures. These are exploratory decisions, not statistical or production guarantees.
- Run locally in isolated Python environment. Public checkpoint/package downloads
  only; no model uploads, customer text or hosted classification. Disable third-party
  reporting; verify cached inference with network disabled. Keep large weights and
  environment local and ignored, while retaining reproducible metadata/checksums.

## Ownership and review gate

PM owns data and data-audit.md. Engineer owns code/tests/config/generated artifacts.
Independent reviewer owns fresh test fixtures, aggregate evaluation and final product
review. Lead owns this design, README, project records, integration and independent
engineering review. Training waits for product and engineering design approval plus
the completed data audit. Final delivery requires independent implementation review.

Review decisions and final frozen identifiers will be recorded below.

- Before training: independent senior product reviewer APPROVED this concrete design.
  Lead senior engineering review APPROVED the shared admission, matched-head,
  train-only fitting, bounded recipe, offline verification and freeze/evaluation design.
- PM read all 150 labels and audited scenario contrasts and nearest text pairs.
  No material duplicate leakage requiring a corrected split was found. Preserve
  120/30 and document shared general grammatical constructions rather than claiming
  linguistic independence. Final data/provenance hashes are recorded by the PM.
- Evaluator preflights all 60 cases without prediction before fixture freeze. The
  primary test requires all 60 admitted; otherwise abort before model predictions.
  General admission diagnostics still report rejected counts and coverage. Rejection
  never becomes a negative prediction or disappears from the stated denominator.
- Evaluator froze the fresh test after tokenizer-only preflight, before predictions:
  60/60 admitted, 30 positive, negatives 8 qualified / 8 requests / 8 reported /
  6 other, six scenarios, maximum 26 tokens including special tokens. Test SHA-256
  `55e564e23f665f0d82f3c607037fbe8a1d987788f34ed4f04fef7f2a65e204b1`;
  private manifest SHA-256
  `f7e842fc6eb8d9b66970f58ede98e9705ea36a6248db5d98195d2aed5fafda66`.
  The lead/implementer received these aggregates only, not the raw fixtures.
- Runtime repair before the final CPU fit: SetFit's inner trainer selected MPS
  despite a CPU-loaded body. Its first 50-step attempt stopped at the device-delta
  verification before any C development scoring/export or test prediction. A/B
  attempt artifacts are preserved locally. The implementation now scopes supported
  `use_cpu=True`/reporting arguments into inner-trainer construction. A second attempt
  stopped at zero updates because Accelerate still selected MPS; the environment now
  also sets `ACCELERATE_USE_CPU=true` before imports. Model, trainer and accelerator
  devices must all be CPU before fitting. Data, recipe, seeds and threshold policy
  are unchanged. Dependency
  compatibility fixes and the aborted attempt are recorded in setup-notes.json.
