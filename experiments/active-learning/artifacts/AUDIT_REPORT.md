# Active-learning audit — active-001

**Outcome: development improvement observed; independent final performance is inconclusive.** The bounded protocol ended correctly at `insufficient_final_reference`. Three fits completed; no final-test predictions occurred. Nothing was integrated or deployed.

## Every development result

Unchanged DEV: 30 passages in five scenario families. These results were used for threshold and candidate selection.

| Model | TRAIN | Threshold | TP / FP / TN / FN | Precision | Recall | F1 | DEV gate |
|---|---:|---:|---|---:|---:|---:|---|
| TF-IDF | 120 | 0.50 | 13 / 6 / 9 / 2 | 68.4% | 86.7% | 0.765 | Fail |
| Frozen MiniLM | 120 | 0.50 | 10 / 2 / 13 / 5 | 83.3% | 66.7% | 0.741 | Fail |
| C42 incumbent | 120 | 0.50 | 10 / 1 / 14 / 5 | 90.9% | 66.7% | 0.769 | Fail |
| round-1 | 160 | 0.50 | 9 / 1 / 14 / 6 | 90.0% | 60.0% | 0.720 | Fail |
| round-2 | 200 | 0.50 | 9 / 1 / 14 / 6 | 90.0% | 60.0% | 0.720 | Fail |
| round-3 | 240 | 0.45 | 11 / 1 / 14 / 4 | 91.7% | 73.3% | 0.815 | Pass |

Round 3 was selected and its model/threshold/comparator hashes frozen before final-reference authoring. Its DEV gain versus C42 is one additional true positive with the same one false positive; F1 rose by 0.0456. Rounds 1 and 2 were worse than C42. This is tuning evidence and does not establish generalization or an effect caused by active selection. C42 remains the incumbent; all models are preserved.

## Pool, acquisition and labels

One authoring attempt produced 300 fictional passages in 75 contrasting families: 150 single-sentence and 150 multi-sentence. Admission, exact/near-duplicate checks and a separate semantic audit excluded no pool families. Semantic audit is judgment, not proof of independence.

Each round queried ten previously unused families: two random first, five frozen TF-IDF/MiniLM disagreements, three ranked by current SetFit distance to its threshold. No fallback was needed. Current uncertainty used C42, then Round 1, then Round 2. Scores were uncalibrated selection ranks, never correctness certificates.

Fresh teacher/reviewer sessions independently agreed on all 40 passages in each round, with valid literal evidence and binary/category agreement. No training families were quarantined. Accepted additions total 120 across 30 families; TRAIN sizes were 160, 200 and 240. Original 120 TRAIN and 30 DEV records are unchanged; all 40 previous teaching proposals were excluded from the lineage and included in contamination checks. All category counts, lineage, route records and all 19 thresholds per model/round remain in the linked machine-readable evidence.

## Final-reference stop

After selection, a fresh author generated 120 passages in 30 families. Fresh blind teacher and reviewer agreed on all reference labels. A separate semantic overlap reviewer identified scenario reuse in 11 families against the full acquisition pool and original/prior proposal references. All 44 members were excluded without replacement. This was a conservative AI judgment, not human adjudication; it was applied as frozen and never relaxed after seeing coverage.

Only 76 passages / 19 families remained: 38 positives and 38 negatives; qualified delivery 10, request 7, reported speech 12, other 9. Required coverage was at least 108 passages / 27 families, 50 per class and ten per negative category. Coverage failed, so the final evaluation marker was never consumed and no model made final-test predictions. Final confusion counts, category/length errors, paired differences and 10,000-family bootstrap intervals are therefore **not available**, rather than zero. The joint research gate is **not established**, despite the DEV pass. No final errors were available to feed back into training.

Raw reference texts, labels, logs and exclusions remain in the evaluator directory outside the repository. Only aggregates and bundle hashes are reported here. Historical raw heldouts were not opened; historical disjointness was not independently verified.

## Verification and limits

All 93 meaningful unit/controller tests and dependency consistency checks passed before freezing. Independent engineering reviews 001 and 002 found defects; they were fixed before experimental execution. Review 003 cleared the remaining blocker. The fresh reviewers documented that their read-only sandboxes prevented temporary-file tests; the lead ran those successfully.

All three fits restarted the pinned pretrained MiniLM revision with seed 42, batch 16, five pair iterations, 50 CPU steps and learning rate 2e-5. Each changed 101 parameter tensors, recorded CPU trainer/accelerator/parameters and achieved exact zero saved-reload score difference. Fitting and inference ran with OS networking denied. Actual allowed/blocked connection controls and inbound/outbound sandbox checks passed. Seven admission boundaries and four selected-candidate CLI checks passed; the latter left 241 package files unchanged and showed no canary echo/persistence within that checked scope.

Three acquisition rounds and three fit attempts were used. Experimental execution lasted 21.38 minutes (limit 90); each fit was under ten minutes. Artifact size including private reference/human-audit files at this audit was 279,182,038 bytes (limit 2,000,000,000). All 178 protected files and both prior model bundles still verify. No executable setting changed after initialization. No integrity failure, retry, alternate seed, replacement pool or final-test replay occurred.

Actors used the existing Codex account with fresh ephemeral Astra High sessions for data roles and Astra Extra High for engineering review. All data actors had distinct recorded sessions and no tools/history; engineering review 001 lacks a recoverable session ID in its older runner metadata. Identity/configuration records are not independent model telemetry. Isolation is procedural, not an enforced filesystem boundary, and shared model bias remains possible.

Fresh independent [result review](result-review.json) approved the completed workflow report with no material findings. It recomputed 228 threshold entries from saved DEV scores and independently verified protected/source/model/data manifests. This is not candidate approval. [Final boundary checks](final-boundary-verification.json) also verify no final-scoring request and no complete final passage in 247 checked shared text artifacts.

## Human review and interpretation

Human review is pending. Each training round exports four seeded label-stratified agreements (12 total; both labels in each sample), with passages before answers. There were no annotation disputes. A separate private final audit contains all 44 overlap-excluded passages and eight sampled accepted agreements. These extra final review files do not alter the frozen reference bundle. Corrections cannot silently resume or relabel this terminal campaign.

The data are fictional, AI-labelled and agreement-filtered. DEV has five families and was repeatedly consulted. Artificial prevalence limits precision interpretation. No matched random-only training arm exists. The wording target does not establish risk, truth, permission or whether a product warning is helpful. No reliability, human-validation or deployment claim follows.

**Best next action:** human-review the 12 sampled training agreements, beginning with Round 3, before deciding whether any separately authorized experiment is worthwhile.

## Evidence and commands

- [Complete machine-readable audit](audit-report.json): every round, all thresholds, previous-round comparisons and final status.
- [Actual lineage and training verification](actual-lineage-verification.json).
- [Final reference coverage and exclusions, aggregate only](final-reference-summary.json).
- [Prediction runtime evidence](prediction-runtime.json), [network controls](preflight-runtime.json), [admission boundaries](admission-runtime.json), [pre-freeze test result](verification-pre-freeze.json).
- [Engineering review 001](engineering-review-001.json), [002](engineering-review-002.json), [003 clearance](engineering-review-003.json).
- [Actor provenance](actor-provenance.json).
- [Round 1 human packet](../campaigns/active-001/rounds/round-1/human-review.md), [Round 2](../campaigns/active-001/rounds/round-2/human-review.md), [Round 3](../campaigns/active-001/rounds/round-3/human-review.md).
- [Protocol and immutable manifests](../campaigns/active-001/campaign.json); selection and round freeze manifests are in the same campaign tree.
- [Runbook](../README.md) and [approved specification](../DESIGN.md). The existing campaign is terminal: do not rerun mutation commands or create replacement campaigns. Read-only `status` and `predict` remain available; report export requires a fresh output path.

The allowlisted project handoff was delivered to the existing companion and acknowledged. [Delivery evidence](handoff-delivery.json) records its hash and response. This was task-message delivery, not Project Sources synchronization.
