# Independent result review — auto-001

**Cleared for local research delivery. No material integrity or reporting defect found.** This review verifies the frozen experiment and its reported results; it does not validate the AI labels as human gold or authorise product integration.

Verified all 168 frozen run files, 15 source files and 438 preserved prior files, plus both baseline bundles and all three candidate model manifests. Development and final model provenance match. The run bundle is `8758ec17cb83cade28e6761de02395c069a5d71c42f335e20f0b61b0c002cfdd`.

Independently recomputed every DEV threshold curve and selected operating point, all DEV/FINAL binary, category, scenario-tag and ambiguity results, pairwise agreement, and native benchmark metrics from saved scores. All match. No additional inference, fitting, relabelling or prompt tuning occurred.

The fit used exactly the original 120 TRAIN rows plus 36 agreed additions. Both annotators marked one stone-quarry item ambiguous, correctly quarantining its complete four-row family. Five distinct actual actor sessions are confirmed in runner logs. Evidence quotes and annotation exports match the original responses. Classifier outputs contain scores with null rationale/evidence, rather than invented explanations.

All 56 FINAL rows remain: 25 positive, 27 negative and four author-ambiguous references. Each candidate covers all 52 binary references; ambiguity predictions are reported separately. External rows never enter training. The 50-step CPU fit changed 101 parameter tensors with exact saved-score parity. All 18 jobs succeeded; the 11 training/inference jobs used OS network denial. Runtime was 836.4 seconds, peak monitored process-tree memory 1.44 GB, and watched artifacts peaked at 0.78 GB, within the declared bounds.

| Candidate | DEV threshold | DEV gate | Final TP / FP / FN | Final F1 |
| --- | ---: | --- | --- | ---: |
| C42 | 0.50 | Failed | 13 / 3 / 12 | 0.634 |
| New compact model | 0.55 | Passed | 13 / 3 / 12 | 0.634 |
| DeBERTa | 0.50 | Failed | 4 / 1 / 21 | 0.267 |
| ModernBERT | 0.50 | Failed | 12 / 2 / 13 | 0.615 |

**No improvement is established.** C42 wins the declared tie-break; the new compact model ties its final aggregate metrics despite passing DEV. ModernBERT has one fewer false positive but also one fewer true positive and lower F1. These are small synthetic diagnostic results, not useful-warning or customer-email reliability evidence.

The native ML-Promise benchmark stays separate. Verified the 400-row author-hosted release hash, independently reproduced the 64-row label-blind hash selection, and checked native Yes/No labels. This release differs from the paper's stated 200-row English test split. DeBERTa covers 47/64 rows and ModernBERT 44/64. Their 17/20 abstentions include 13/16 positive references and correctly reduce recall to 27.9%/23.3%; separate FN fields exclude these abstentions. Character limits account for three abstentions each, with token limits accounting for the remainder. No selected native passage appears outside the restricted research directory.

References remain AI judgments from the same model family. Scenario slices are assigned family tags, not independent linguistic annotations. Unknown pretraining contamination, external licensing restrictions and lack of real-user usefulness evidence remain. The prior human audit is unperformed and is not a gate for this authorised automated milestone.

The next action is to deliver and preserve this frozen no-improvement result. No new fit, consumed-final tuning or product promotion is implied.
