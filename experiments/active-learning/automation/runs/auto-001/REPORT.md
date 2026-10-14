# Automated wording comparison

Status: completed. No production integration.

AI synthetic references are not human gold. Firm delivery does not establish whether product advice is useful.

## Synthetic final reference

| Candidate | TP | FP | FN | Precision | Recall | Coverage | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C42 | 13 | 3 | 12 | 0.812 | 0.520 | 1.000 | 0.634 |
| setfit-auto | 13 | 3 | 12 | 0.812 | 0.520 | 1.000 | 0.634 |
| deberta | 4 | 1 | 21 | 0.800 | 0.160 | 1.000 | 0.267 |
| modernbert | 12 | 2 | 13 | 0.857 | 0.480 | 1.000 | 0.615 |

Diagnostic best under the declared synthetic tests: C42. No candidate established improvement under the predeclared rule. No production promotion or usefulness claim.

## Published labels and agreement

Published ML-Promise PI is a separate ESG task; it is never counted as target-task evidence or used for training. Its non-commercial data stays under external/research-only/.

- deberta: TP 12, FP 4, FN 18; precision 0.75, recall 0.27906976744186046, coverage 0.734375.
- modernbert: TP 10, FP 3, FN 17; precision 0.7692307692307693, recall 0.23255813953488372, coverage 0.6875.
The author-hosted test release contains 400 rows, versus 200 English test rows described in the paper; this is a fixed 64-row sample of that release, not an exact published-score reproduction.
prepared

Pairwise model agreement is in report.json and is not calibrated confidence. Training labels require two separate validated actor sessions; shared model-family bias remains.

## Runtime and limits

- C42: load 3.16s; batch inference 0.14s (2.4 ms/passage amortized); peak process RSS 0.60 GiB.
- setfit-auto: load 2.97s; batch inference 0.12s (2.2 ms/passage amortized); peak process RSS 0.60 GiB.
- deberta: load 0.75s; batch inference 7.54s (134.6 ms/passage amortized); peak process RSS 1.46 GiB.
- modernbert: load 1.10s; batch inference 5.52s (98.6 ms/passage amortized); peak process RSS 1.21 GiB.

Category failures and targeted negation/attribution/conditional scenario slices are in report.json; all difficult final rows remain, including null-reference ambiguity diagnostics.

All thresholds and hypotheses were frozen before final scoring. No final-error tuning or example replacement. Results are a small synthetic diagnostic, not customer-email accuracy or warning usefulness.

Human audit from active-001 remains unperformed; it is not a gate for this automated milestone.

Best next action: retain the measured candidate results as local research; use this frozen run for reproducibility checks before considering a separately authorised product decision.
