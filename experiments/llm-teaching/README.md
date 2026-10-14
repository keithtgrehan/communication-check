# Let Codex teach a local classifier

This package lets an LLM propose fictional training examples, a separate agent
review their labels, and a local trainer create a new SetFit candidate. It is a
bounded, auditable teaching round—not an automatic promise of better accuracy.
The shipped checker and both earlier experiments remain unchanged.

## Easiest way to use it

In this existing Codex project, ask:

> Run one LLM teaching round using experiments/llm-teaching/RUN_WITH_CODEX.md.
> Generate and independently review the fictional examples for me, train one
> local candidate, and report whether it improves on the development set.

[RUN_WITH_CODEX.md](RUN_WITH_CODEX.md) contains the complete agent procedure.
Codex supplies the teacher and reviewer; Keith does not need to hand-author the
examples or configure another model API. The LLM authoring uses the Codex service.
The trained classifier runs locally and does not generate text or call an LLM.

## Demonstrated round: teacher-demo-001

**The teaching workflow completed; this candidate did not improve.** A real Codex
teacher authored 40 fictional examples. The separate reviewer labelled every item
before seeing teacher answers. One category disagreement excluded its whole
four-example family. The remaining 36 examples from nine families augmented TRAIN
to 156 rows; all original 150 TRAIN/DEV records were preserved exactly.

On the same 30 previously used development examples:

| Model | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Original C42 | 10 | 1 | 14 | 5 | 90.9% | 66.7% | 0.769 |
| LLM-taught candidate | 10 | 2 | 13 | 5 | 83.3% | 66.7% | 0.741 |

Both failed the development rule and use diagnostic threshold 0.50. The candidate
has one qualified-statement false positive and one “other” false positive; neither
model flagged the four requests or four reported statements. This is an aggregate
comparison on synthetic development data, not a new independent evaluation.
All 19 thresholds are in the [saved report](runs/teacher-demo-001/dev-report.json).

Training completed 50 CPU steps with networking blocked, changing 101 of 103
parameter tensors. Saved-score/reload differences were zero. Fit time was 8.82
seconds; the full training/report workflow took 10.29 seconds on this machine.
The model occupies 91,831,677 bytes locally. All 186 TRAIN/DEV inputs were admitted;
their maximum token length was only 22, so these results say little about long drafts.

Recommendation: keep the reusable workflow and preserve this unsuccessful round.
Do not replace the earlier model or the app. Human review of what feedback is
useful is a stronger next product step than repeatedly generating synthetic data
against the same development set. Future independently tested claims need fresh
data and a separately reviewed plan.

Evidence: [pre-training clearance](artifacts/training-clearance.json),
[prepared data summary](runs/teacher-demo-001/prepared.json),
[frozen candidate manifest](runs/teacher-demo-001/freeze.json),
[engineering verification](artifacts/engineering-verification.json),
[independent local runtime checks](artifacts/lead-verification.json),
[independent product review](artifacts/product-review.md).
Candidate bundle: `35b3a7066873c6c5a5ce57cad255cecbfe228fa0750027c271e67fcd1560a51c`.
The teacher wrote the initial batch before the generated kit existed, then verified
it against the exported prompt/schema before review. The demonstration does not
claim prompt export caused that earlier authoring.

Try the saved demonstration model from the repository root:

```sh
printf '%s' 'We will deliver the revised schedule on Friday.' | experiments/encoder-comparison/.venv/bin/python experiments/llm-teaching/teaching.py predict --run-id teacher-demo-001
```

## What is learned

The unchanged binary target is **author-owned, unqualified future delivery of a
concrete work item**. A positive includes ordinary promises. It does not mean a
promise is false, unauthorised, risky or useful to flag. Negative review categories
are qualified delivery, requests, reported speech and other statements.

The teacher proposes at most 40 fictional examples in ten contrasting scenario
families. A different reviewer labels a shuffled packet containing only opaque
IDs and text. Teacher answers, rationales and family IDs are hidden. Exact file
hashes bind the review to the proposal. Any disagreement, ambiguity, invalid input
or detected overlap excludes the entire family; the pipeline never silently
changes a label to force agreement.

Accepted examples augment the original 120 training rows. The original 30
development rows remain exactly unchanged. Duplicate and token-set similarity
checks are conservative guards, not proof of semantic independence. All labels
remain AI judgments, not human ground truth. Continuing agents have project
history; the limited procedural blinding is described in [DESIGN.md](DESIGN.md).

## Local commands

Run from the repository root with the existing pinned comparison environment.
Use new batch, output and run names for every round; existing outputs are refused.

```sh
PY=experiments/encoder-comparison/.venv/bin/python
CLI=experiments/llm-teaching/teaching.py

$PY $CLI export-kit --batch-id my-round-002 --out experiments/llm-teaching/inbox/my-round-002/teacher-kit
# Codex's teacher writes proposals.json using the exported schema and rubric.
$PY $CLI review-kit --batch experiments/llm-teaching/inbox/my-round-002/proposals.json --out experiments/llm-teaching/inbox/my-round-002/review-kit
# A separate agent writes review.json using only the reviewer packet and rubric.
$PY $CLI prepare --run-id my-round-002 --batch experiments/llm-teaching/inbox/my-round-002/proposals.json --packet experiments/llm-teaching/inbox/my-round-002/review-kit/packet.json --review experiments/llm-teaching/inbox/my-round-002/review.json
# Review prepared.json and resolve code/integrity findings before training.
$PY $CLI train --run-id my-round-002
$PY $CLI status --run-id my-round-002
printf '%s' 'We will deliver the revised schedule on Friday.' | $PY $CLI predict --run-id my-round-002
```

The saved report is `runs/<run-id>/dev-report.json`. `status` verifies hashes and
prints that report. Prediction accepts one passage from standard input, does not
echo it, and returns an uncalibrated score and diagnostic/gate status. It rejects
empty text, text over 2,000 UTF-16 units or over 256 actual tokenizer tokens,
including special tokens; it never silently truncates an accepted passage.

An explicit `prepare --parent <completed-run-id>` retains that run's accepted
training additions and records its frozen lineage. Every new candidate still
starts from the original pretrained checkpoint. A failed or completed training
run cannot be overwritten or silently retried under the same ID. Preserve failures
and use a new ID only for a justified repair or another explicitly requested round.

## Fixed training and interpretation

The workflow reuses the pinned environment and read-only helpers/checkpoint from
[the completed encoder comparison](../encoder-comparison/README.md). It verifies
that experiment's 67-file frozen bundle before and after use. This first version
is bound to the verified local baseline and its cached model paths. It deliberately
refuses an absent or different baseline. Moving to another machine requires a
separately verified baseline restoration or reproduction and an explicit update
of that binding; copying these four scripts alone is not a portable installation.

MiniLM revision `1110a243fdf4706b3f48f1d95db1a4f5529b4d41` is Apache-2.0.
The fixed recipe uses seed 42, 50 CPU encoder steps, five pair iterations, batch 16,
learning rate 2e-5, normalized embeddings and the same logistic-regression head.
Pairs and weights use training rows only. External reporting and uploads are off.

Thresholds are 0.05–0.95 by 0.05. Require precision ≥90% **and** recall ≥70%, then
maximize recall, precision and threshold in that order. If none qualifies, mark
failure and use 0.50 only for diagnostics. Report every threshold and compare with
the saved original C42 on the same development rows; an optional parent comparison
is also development-only. Repeated use of these rows can overfit model selection.
No private historical test is opened, reused or presented as new validation.

Each prepared run snapshots its proposal, blind review, accepted/quarantined
records, complete data, source and recipe. Training checks actual encoder updates
and exact saved-score parity. A final manifest freezes the resulting artifacts.
These hashes detect accidental changes; local owners can still edit files and
manifests, so this is not a security sandbox or cryptographic attestation of people.

No automatic promotion, application integration, browser export, publishing,
deployment, customer-data collection or paid service is part of this workflow.
Development improvement alone cannot establish production reliability or usefulness.

## Verification

```sh
experiments/encoder-comparison/.venv/bin/python -m unittest discover -s experiments/llm-teaching/tests -v
experiments/encoder-comparison/.venv/bin/python -m pip check
```

All 12 workflow tests pass, covering strict schemas, duplicate keys, hash-bound
reviews, hidden teacher answers, family quarantine, overlap, immutable snapshots
and tampering. Independent runtime checks passed six prediction/admission cases
with operating-system networking denied, including exactly 256 accepted tokens
and 257 rejected tokens. Empty, oversized and Unicode inputs were rejected.
The network-denial control independently failed a loopback connection as expected.
Completed retraining and duplicate preparation were refused; all 31 run files
including the freeze manifest stayed unchanged. A fictional canary was neither
echoed nor found in 99 checked text artifacts. All 132 protected prior-experiment
files and the separate 55-file original app/experiment manifest remained unchanged.
These checks do not establish safety or accuracy for customer drafts. The previous
application checks were not rerun for this isolated workflow; app source/dependencies
are unchanged.
