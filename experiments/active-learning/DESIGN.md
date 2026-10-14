# Bounded active-learning experiment for Communication Check

## 1. Outcome and boundaries

Build and run an isolated experiment answering: **do up to three rounds of selectively acquired, independently AI-labelled fictional examples improve commitment-wording classification?**

Keep the existing target: author-owned, unqualified future delivery of a concrete work item. Results will not establish whether a promise is risky, incorrect or useful to flag.

Repository inspection and two independent planning reviews support a sibling package at `/Users/keith/Developer/communication-check/experiments/active-learning`. The existing teaching workflow’s category caps conflict with selecting whole families by model predictions, so leave that workflow unchanged.

The 67-file encoder-comparison manifest and 30-file teaching-demo manifest currently verify without mismatches. Preserve both experiments, current uncommitted work and the application.

No app integration, deployment, publishing, paid services, customer data or historical heldout access. No implementation or goal activation occurs during this planning phase.

## 2. Implementation and agent ownership

**Reuse the existing environment and training logic.** Add a small experiment controller with commands for campaign initialization, pool freezing, acquisition, label-packet export, preparation, training, candidate selection, evaluator-only final evaluation, reporting and prediction. No public application API changes or new package dependencies.

Adapt the existing training adapter into the sibling package. Import frozen encoder helpers read-only; redirect caches and outputs into the new package. Do not call the old evaluation command, which writes into the preserved experiment.

**Separate records by purpose:**

- Pool: opaque passage/family IDs, fictional text and author provenance.
- Acquisition: model hashes, scores, thresholds, selection route and remaining eligibility.
- Annotations: packet hash, actor identity, clear/ambiguous decision, label/category, rationale and exact supporting quotations.
- Round: accepted/quarantined IDs, cumulative training snapshot, recipe, source hashes, model and complete development results.
- Campaign: immutable protocol, append-only execution events and terminal outcome.

Validate supporting quotations as literal substrings; different valid quotations need not match between annotators. Only text and agreed labels enter fitting.

Use exclusive start markers and campaign-wide attempt accounting. New run IDs or output paths cannot bypass limits. Keep mutable execution events outside frozen model bundles. Verify manifest-map digests and file hashes before and after protected-artifact use.

**Agent sequence, with at most three subagents alongside the lead:**

- Lead owns controller integration, manifests, project records and final reporting.
- Astra High implementation worker owns the training/scoring adapter and its tests.
- Pool author creates fictional passages; fresh Astra High teacher and reviewer independently label selected packets.
- Fresh Astra Extra High reviewer checks integrated engineering before experimental execution.
- After candidate selection, fresh evaluator and reference-label reviewer own final fixtures and scoring.

Label reviewers and final evaluators receive no inherited chat history. They receive only necessary packets, rubric and approved interfaces. Separation is procedural, not enforced filesystem isolation. Only the lead handles Git or project handoffs.

The methodology uses acquisition principles documented by [small-text](https://small-text.readthedocs.io/en/latest/components/query_strategies.html) and CPU adaptation supported by [SetFit](https://huggingface.co/docs/setfit/en/conceptual_guides/setfit). No additional broad research is needed before implementation.

## 3. Frozen data and acquisition protocol

**Starting data:** retain the original 120 TRAIN rows and 30 DEV rows exactly. Exclude all 40 previous teaching-demo proposals from the new training lineage, including its 36 accepted additions; use all 40 for contamination checks. C42 remains the primary unchanged baseline.

**Pool:** author one batch of 300 English passages in 75 four-passage scenario families. Each family intends two firm assertions and two contrasting negatives. Rotate the six pairings of qualified delivery, requests, reported speech and other controls. Include negation, hypotheticals, different speakers and varied business contexts.

Each family contains two single-sentence and two multi-sentence passages, with intended labels balanced across length. Generation intentions are not labels and are hidden from annotators.

Before scoring, freeze the raw pool and exclude entire families with invalid inputs or overlap. Use existing admission limits: nonempty, at most 2,000 UTF-16 units and 256 tokenizer tokens including special tokens, without truncation.

Reject normalized exact duplicates, cross-family token-set Jaccard similarity ≥0.85, and identified scenario/paraphrase reuse. Related contrasts within a family may be similar but not exact duplicates. Check against original TRAIN/DEV, previous teaching proposals and the full new pool. These guards do not prove semantic independence.

Use the residual original pool throughout; never generate replacements based on results.

**Each round selects ten families, at most 40 passages:**

| Route | Families | Exact rule |
|---|---:|---|
| Random | 2 | Sample uniformly from all remaining eligible families first. |
| Disagreement | 5 | Rank remaining families by the number of passages where frozen TF-IDF and frozen MiniLM predictions disagree. Require at least one disagreement. |
| Uncertainty | 3 | Rank remaining families by their smallest absolute passage-score distance from the current SetFit threshold. |

Use each frozen baseline’s saved threshold for disagreement. Use C42 for first-round uncertainty and the latest successfully completed candidate thereafter. Uncertainty is an uncalibrated ranking, not confidence in correctness.

Freeze seed 42; derive stage/round-specific random streams and hash-based tie order from that seed. Transfer unfilled disagreement places to uncertainty. Record fallback selections explicitly. If fewer than ten eligible families remain, stop acquisition rather than changing batch composition.

Remove every queried family permanently, including quarantined families. Never refill slots after labelling.

**Independent labelling:** teacher and reviewer receive separately shuffled opaque-ID/text packets without family IDs, intended labels, predictions, acquisition reasons or each other’s answers. Freeze both responses before comparison.

Accept a family only when every item has valid evidence and both actors agree on its clear binary label and category, with at least one positive and one negative in the family. Any ambiguity, disagreement, invalid evidence or overlap quarantines all four members. Report category counts without enforcing the old per-category caps.

**Human audit:** export all disputed cases plus a seeded, label-stratified random sample of accepted agreements: `max(4, ceil(10% of accepted passages))`, capped by availability and including both labels. Show text before AI answers to reduce anchoring.

Human review may remain pending. No human-validation claim follows from agent agreement. An explicit human correction to an accepted label halts the campaign for protocol review; do not relabel and continue. Disputed cases remain excluded throughout this experiment.

## 4. Training, selection and final evaluation

**Fixed training recipe:**

- Original pinned MiniLM checkpoint, revision `1110a243fdf4706b3f48f1d95db1a4f5529b4d41`.
- Seed 42; 50 CPU encoder steps; five pair iterations; batch 16; learning rate `2e-5`.
- Existing normalized embeddings and logistic-regression head settings.
- Original 120 TRAIN rows plus cumulative accepted additions; maximum 240 TRAIN rows.
- Restart from pretrained weights every round; no warm starts, alternate seeds or parameter search.
- Require at least two accepted families/eight new passages before fitting.

Verify actual CPU devices, completed optimization steps, changed encoder parameters and saved-model score parity within the existing `1e-12` tolerance. Block networking during fitting and inference. Codex authoring and review still use the Codex service.

**Development policy:** preserve the threshold grid 0.05–0.95 in steps of 0.05. Eligibility requires precision ≥90% and recall ≥70%; choose maximum recall, then precision, then threshold. Otherwise use 0.50 for diagnostics.

Report every threshold and every round against C42, frozen TF-IDF, frozen MiniLM and earlier rounds on unchanged DEV. DEV contains only five scenario families and is tuning evidence.

Select one new candidate for final comparison:

- If any pass DEV: highest recall, then precision, then earliest round.
- Otherwise: highest F1 at 0.50, then fewer false positives, then more true positives, then earliest round; mark it diagnostic.
- C42 remains the incumbent on ties or regression. Selection never replaces a saved baseline.

**One fresh final evaluation:** freeze selected model, threshold and comparator manifests before final-test authoring. Compare that candidate with C42, TF-IDF and frozen MiniLM; do not test all rounds and choose a winner afterward.

A fresh evaluator authors 120 passages in 30 new four-passage families, intending 60 positives and 15 examples in each negative category. Each family has two single-sentence and two multi-sentence passages. Independently review reference labels using the same blind procedure.

Check against the entire acquisition pool, original TRAIN/DEV and previous teaching proposals. Never open historical heldouts. Historical non-content fingerprints may be used if already available; otherwise disclose that historical disjointness was not independently verified.

Quarantine disputed or overlapping families before prediction, without replacement. Require at least:

- 27 complete families/108 passages;
- 50 examples per class;
- 10 examples in every negative category.

Otherwise stop before scoring and report insufficient final-reference coverage. Freeze accepted fixtures and exclusions, then consume a campaign-wide evaluation marker before any predictions. Failed evaluation remains consumed.

Report confusion counts, precision, recall, F1, category/length errors, family counts and paired differences against C42. Use 10,000 paired whole-family bootstrap resamples, seed 42, for exploratory intervals; disclose undefined precision replicates and synthetic-data limitations.

The research gate requires passing DEV and final precision ≥90%, recall ≥70%, and zero request/reported-speech false positives. A failed DEV candidate cannot become a passing candidate through final results.

Report gains below the gate as diagnostic only. Excluding disagreements makes the evaluation agreement-filtered. Without a matched random-only training arm, no result establishes that active selection caused improvement.

## 5. Verification, limits and completion

Before freezing the executable protocol, test:

- Deterministic quotas, shortages, ties and permanent removal of queried families.
- Blind packets, distinct actors, both-role ambiguity, Unicode quotations and whole-family quarantine.
- Exact base/DEV preservation, cumulative lineage and pretrained-checkpoint restart.
- Tampering, path escape, concurrent attempts, round-limit enforcement and final-test replay prevention.
- Threshold/ranking rules, no qualifying candidate, insufficient accepted data and all terminal outcomes.
- CPU execution, meaningful weight updates, reload parity, blocked-network controls and preservation of prior artifacts.

Fix implementation defects before experimental execution and obtain independent engineering clearance. After the experiment starts, integrity failures halt it; repairs do not silently restart the campaign.

**Limits:** three queried rounds and at most three fitting attempts; ten minutes per fit; 90 minutes for the experimental phase beginning with pool authoring; 2 GB of new experiment artifacts. No retries or replacement seeds. Failed/interrupted fitting, integrity failure, resource exhaustion or confirmed label error terminates the experiment with preserved evidence. Normal acquisition exhaustion or insufficient additions may proceed to the single final comparison using already completed candidates.

Deliver reproducible commands, frozen manifests, every attempted round’s results, accepted/quarantined lineage, final-evaluation status, human-review packet and independent review findings. Update existing project records and the authorized aggregate-only companion handoff.

Completion means the protocol reached its declared endpoint and the audit report is finished. No improvement, insufficient reference labels or a documented integrity stop are valid experimental outcomes. An unfinished implementation or unverified result is not completion.

The next action is explicit execution authorization after leaving Plan mode.



Start one foreground goal to execute the accepted bounded active-learning experiment in this existing chat. Inspect existing goal state first; do not create a competing goal or overwrite an unrelated unfinished goal.
I authorise the local research implementation, fictional-data generation, agent labelling, CPU training and evaluation specified in the accepted plan. This narrowly authorises those new research rounds while preserving all application, production, spending and privacy boundaries.
Implement and verify the protocol, obtain the planned independent review, freeze the experiment settings, and run up to three acquisition/training rounds. Then perform the single fresh final evaluation if the frozen eligibility rule permits it. Produce the complete audit report and human-review packet.
Use the agreed agents and ownership. Continue autonomously through routine implementation choices, tests and permitted fixes. Preserve existing work, previous models, every attempted round and all unsuccessful results. Do not expand the search, relax criteria, add rounds or tune against final-test results.
Human review may remain pending under the agreed exploratory protocol. Identify pending items clearly and make no human-validation claims. If an integrity failure occurs, halt experimental execution, preserve evidence and complete an incident report without silently restarting.
The goal is complete when the bounded protocol has reached its declared endpoint, required checks and independent reviews are documented, and the report explains whether improvement was observed, absent or inconclusive. A documented protocol-defined early stop is a valid endpoint. Exhausted budget or an unresolved implementation blocker is not successful completion.
Keep the existing project progress record current. Finish with what changed, what was actually verified, every round’s result, final-evaluation status, remaining limitations and the single best next action. Do not integrate or deploy any candidate.
