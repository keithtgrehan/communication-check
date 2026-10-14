# Local research experiments

These packages are isolated research workflows. The deployed Communication Check
app continues to use its reviewed deterministic rules; no experimental candidate
has been integrated or promoted.

| Package | Review starting point |
| --- | --- |
| Commitment classifier | [Workflow and results](commitment-classifier/README.md) |
| Encoder comparison | [Comparison and limits](encoder-comparison/README.md) |
| LLM teaching | [Validated teaching workflow](llm-teaching/README.md) |
| Bounded active learning | [Campaign](active-learning/README.md) and [aggregate audit](active-learning/artifacts/AUDIT_REPORT.md) |
| Automatic comparison | [Runbook](active-learning/automation/README.md) and [aggregate result](active-learning/automation/runs/auto-001/REPORT.md) |

## Public source and local evidence

The October 14 publication includes source, tests, synthetic training/development
fixtures, training-round records and aggregate results. AI-generated labels are
not human validation. The latest comparison did not establish an improved model.

Reserved final passages and per-case final annotations, private reviewer feedback,
raw execution logs, downloaded model checkpoints and external research-only data
remain local. No frozen artifact was rewritten to remove inconvenient results.
The repository ignore rules preserve those files without publishing them.

The historical runbooks describe the full local research workspace. References to
excluded files are intentionally unavailable in a public clone. In particular,
full frozen-run verification and saved-model replay require the original local
artifacts and environments; a public clone alone cannot reproduce those checks.
Source and aggregate reports remain available for review. Do not treat a new run
on previously consumed final examples as fresh independent evaluation.

## Publication checks

Before publication, the existing local workspace passed 164 Python experiment
tests and 11 JavaScript experiment tests. The original `auto-001` integrity check
verified all 168 frozen outputs and reproduced its recorded metrics. The app's
8 setup tests, 466 unit tests, typecheck and production build also passed.
These are local verification results, not a fresh evaluation or browser test.
