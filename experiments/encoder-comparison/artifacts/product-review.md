# Independent product review — 14 October 2026

**Decision: APPROVE delivery of the isolated research package. REJECT detector integration.** All five candidates failed the predeclared development eligibility rule and final research criterion. No further test-guided tuning or repeat evaluation is authorised by this result.

## Reviewed scope and method

The task is classification of current author-owned, unqualified prospective delivery wording, including routine document delivery. It does not determine whether a commitment is true, approved, problematic or useful to flag. The supplied passage is the evaluation unit; no useful-finding or evidence-localisation claim follows.

The independent evaluator approved the design before training, reviewed the admission, threshold, train-only fitting, seed reporting and aggregate evaluation paths, and ran the frozen evaluator once after engineering clearance. The reviewer inspected the explicit CPU-device guard added after a runtime attempt selected MPS: it restores the approved CPU recipe and checks trainer, accelerator and model devices before fitting. The failed attempt remains documented; this was a runtime repair, not a response to final-test evidence.

Sixty new fictional cases were authored after receiving only the training/development family inventory. No raw train/development text or historical private holdout file was read. The new set has six scenario groups: 30 firm cases and 30 negatives, comprising eight qualified, eight request, eight reported/quoted/historical and six other cases. Broad grammatical constructions remain shared with training. This is a scenario-heldout, purposive synthetic test, not proof of language independence or real-world representativeness. Labels are agent judgments, not human gold; separation is procedural, not a security sandbox.

A tokenizer-only preflight admitted all 60 cases before fixture freeze; maximum length was 26 tokens including special tokens and 123 UTF-16 units. No predictions were computed during authoring/preflight. All 60 entered the final denominator; none was truncated or excluded. The final runner found zero normalized duplicate texts and zero overlapping group identifiers. Those checks cannot prove semantic independence automatically.

## Single-run results

All candidates lacked a qualifying development threshold under the joint precision >=90% and recall >=70% rule. They therefore used the predeclared 0.50 diagnostic fallback. Development failures remain failures regardless of final-test scores. The final research criterion also required zero false positives on requests and reported wording.

| Candidate | TP | FP | TN | FN | Firm precision | Firm recall | F1 |
| --- | ---: | ---: | ---: | ---: | --- | --- | ---: |
| A · TF-IDF + logistic regression | 27 | 11 | 19 | 3 | 27/38 (71.1%) | 27/30 (90.0%) | 0.7941 |
| B · frozen MiniLM + logistic regression | 24 | 8 | 22 | 6 | 24/32 (75.0%) | 24/30 (80.0%) | 0.7742 |
| C42 · SetFit, predeclared primary seed | 27 | 6 | 24 | 3 | 27/33 (81.8%) | 27/30 (90.0%) | 0.8571 |
| C43 · SetFit, robustness seed | 24 | 7 | 23 | 6 | 24/31 (77.4%) | 24/30 (80.0%) | 0.7869 |
| C44 · SetFit, robustness seed | 27 | 7 | 23 | 3 | 27/34 (79.4%) | 27/30 (90.0%) | 0.8438 |
| Always negative | 0 | 0 | 30 | 30 | Undefined: no emissions | 0/30 (0%) | 0 |

C42 was designated the primary SetFit seed before the final test; C43 and C44 are robustness checks, not alternative seeds selected after inspection. SetFit precision ranged from 77.4% to 81.8%, recall from 80% to 90%, and F1 from 0.7869 to 0.8571. Report this variation rather than only the strongest score.

All three SetFit seeds falsely classified three of eight qualified passages and two of six other passages as firm. Request false positives were one of eight for C42 and two of eight for C43/C44. None flagged the eight reported passages. The lexical arm flagged four of those reported passages; the frozen encoder flagged none, but still flagged four of eight qualified passages and two of eight requests.

On this same fresh set, primary C42 detected 27 firm cases in total, matching the lexical arm's detection count, while producing six false positives rather than eleven. The frozen encoder detected 24, with eight false positives. This is a descriptive comparison of the locked recipes, not a statistically established winner. In particular, the balanced 50% positive prevalence and six shared scenario clusters do not establish expected precision in actual customer drafts. No population confidence claim is made.

Do not compare these figures with the older experiment's 1/30 detection result as measured improvement: the evaluation cases and operating-threshold policy differ. The earlier failed research remains preserved as history. The shipped checker was not scored for useful findings in this comparison.

## Integrity and delivery decision

The evaluator independently verified all 67 frozen file hashes before and after the run. The fixture and fixture-manifest hashes remained unchanged, and the consumed-run marker records completion. Only this aggregate report and aggregate evaluation entered the repository; raw test passages and case-level labels remain private.

- Frozen bundle SHA256: `ce05cc78086746d0d2c2e59c693dfee7e5f40924dc72804c888fa445e3d450ea`.
- Frozen test SHA256: `55e564e23f665f0d82f3c607037fbe8a1d987788f34ed4f04fef7f2a65e204b1`.
- Private fixture-manifest SHA256: `f7e842fc6eb8d9b66970f58ede98e9705ea36a6248db5d98195d2aed5fafda66`.
- Evaluation SHA256: `86f9196e69d2e52990552c19a1afb522ca4fb2f97eb338b3daaead4f80be8cb8`.
- Shared result: [evaluation.json](evaluation.json).

No product or measurement blocker remains for delivery of the reproducible research artifacts and an honest negative gate result. The trained candidates remain local research artifacts. No new interface, model service, deployment or product integration is approved by this review. Engineering validation, offline execution and preservation evidence are recorded by the lead separately; this review does not recast them as human validation.

The best next action is a small human-adjudicated, rights-cleared set that distinguishes wording classification from genuinely useful review prompts before considering further model work. This review does not authorise outreach, collection, another training round or integration. If a later experiment uses these results to change its design, it needs new independent evaluation material.
