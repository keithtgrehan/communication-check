# Independent product and workflow review

Date: 2026-10-14 (Europe/Berlin). Reviewer: `senior_product_reviewer`, a separate Codex AI agent. Requested model was gpt-6-astra; actual runtime identity was not independently verified.

**APPROVE delivery of the reusable teaching workflow. REJECT promotion of this candidate as an improvement or integration into the shipped checker.** No blocking product or implementation finding remains in the reviewed scope.

The authorized finish line was a real, bounded LLM teaching cycle with independent label review, an auditable training snapshot, local training and an honest development comparison. That workflow completed. Improved generalization was not demonstrated, and the candidate was worse at the declared diagnostic operating point.

## Label review and training clearance

I independently labeled the 40 shuffled opaque-ID/text items without opening teacher suggestions, family mappings or rationales. My review was frozen before comparison at SHA-256 `fb4f4c1379be316c66c22a13002ee0015ce9884be69a37c7c300120168b4d858` and remained unchanged through completion. I did not reopen historical heldout fixtures or rerun them.

The validator accepted 36 examples across nine whole families and quarantined all four examples in one family after a category disagreement. No examples were silently relabeled or replenished. Accepted categories were 18 firm delivery, five qualified delivery, five request, four reported and four other. The prepared snapshot contained 156 training rows and the unchanged 30 development rows; all 186 inputs met admission limits.

I cleared that exact prepared snapshot, SHA-256 `b2bbd3e372f0bfaf11ffabf8b64fa40bbe5b95ae00dfd5924ba0fab4aad4fbbe`, for one fixed CPU seed-42 cycle. This review is procedural independence between agent roles, not human validation, a fresh researcher without project history, or a security sandbox.

## Observed result

Both models use the declared diagnostic threshold 0.50 because neither satisfied the joint development precision/recall rule.

| Same 30 development rows | TP | FP | TN | FN | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frozen original C42 | 10 | 1 | 14 | 5 | 90.9% | 66.7% |
| Candidate with reviewed teaching data | 10 | 2 | 13 | 5 | 83.3% | 66.7% |

The candidate introduced one additional false positive in the `other` category. It retained one qualified-delivery false positive. Neither model flagged the four requests or four reported statements in this development set. These small counts do not establish performance on new language. All 19 threshold results are retained in [the development report](../runs/teacher-demo-001/dev-report.json); no favorable threshold or seed was substituted after observing the result.

## Verification and claim review

I reviewed `contracts.py`, `kit.py`, `adapter.py`, `teaching.py`, the focused tests, DESIGN.md, RUN_WITH_CODEX.md and the final README. The implementation enforces bound reviews, whole-family quarantine, unchanged development data, TRAIN-only fitting, exclusive run IDs, source/input snapshots, frozen candidate checks and explicit diagnostic failure. The reusable prompt is concrete, and the README plainly reports the unsuccessful demonstration and its local baseline dependency.

I independently verified the prepared/current-source manifest and all 30 files listed in the completed run manifest, whose bundle hash is `35b3a7066873c6c5a5ce57cad255cecbfe228fa0750027c271e67fcd1560a51c`. I also checked the saved aggregate report: 50 CPU optimization steps, 101 of 103 parameter tensors changed, and zero measured exported-head and saved-reload score differences.

I inspected [engineering verification](engineering-verification.json) and [the lead's independent runtime verification](lead-verification.json), rather than claiming to have rerun those checks myself. They record 12 passing focused tests, dependency consistency, OS-blocked training/prediction, six input-admission cases, refusal to repeat a completed run or overwrite a prepared run, and preservation of prior artifacts and application files. The lead's checks admitted exactly 256 tokens, rejected 257 tokens and oversized UTF-16/character inputs, and found no prediction canary in output or 99 inspected text artifacts. These are bounded workflow/privacy checks, not a universal privacy or reliability proof.

## Delivery decision

Keep the reusable workflow and preserve this unsuccessful round. A user-requested future round can use RUN_WITH_CODEX.md without requiring Keith to hand-author examples or configure another model API. Do not automatically continue rounds, replace a model, or claim improvement from repeated development selection. Product integration remains contingent on fresh independent evaluation and human review of whether the resulting findings are useful; the wording label alone does not establish that usefulness.
