# LLM teaching workflow — 14 October 2026

## Objective and completion evidence

The active user goal is to create a way for an LLM to train/improve Communication
Check. The prior goal turn made progress by completing a local model comparison;
it did not provide a reusable teaching workflow. This package supplies that missing
workflow using Codex agents as teacher and independent label reviewer, then local
SetFit training. Codex is the LLM service for authoring; this is not an on-device LLM.
No separately configured model API or customer draft collection is required.

Completion requires a runnable prompt/export/review/prepare/train/report/predict
workflow, a real LLM-authored batch and independently labelled review packet, a
validated immutable training snapshot, a saved trained candidate and comparison,
meaningful rejection/integrity/offline tests, and a reusable Codex run instruction.
An improvement is measured, not promised. A worse candidate still demonstrates a
working teaching process; it must be reported honestly and never silently promoted.

## Fixed first cycle

- Preserve both earlier experiments and all existing frozen sources/models/results.
  Never open or rerun their private heldout sets. The application remains unchanged.
- Same target: author-owned unqualified future delivery assertions, including routine
  work-item promises. No claim about truth, authorisation, risk or finding usefulness.
- One proposed batch of 40 fictional examples in ten scenario families: 20 firm,
  five each qualified/request/reported/other. These are upper caps after review.
  No replenishment or resampling after seeing model results. No human label claim.
- Export machine-readable schemas and teacher instructions. Proposal includes author
  provenance and synthetic-only declaration. Freeze exact proposal bytes before review.
- Review kit contains shuffled opaque IDs and text, with teacher answers, rationale,
  categories and family IDs omitted. Bind review to exact batch and packet hashes.
  Reviewer identity differs from teacher. Reviewer can mark clear, ambiguous or reject.
- Accept a whole family only when every member is clear and teacher/reviewer labels
  agree. Quarantine disagreement/uncertainty/invalid overlap; do not silently relabel.
  Enforce strict schemas, unique IDs/text, class/category caps, original token and
  UTF-16 limits, and duplicate/near-overlap checks against original train/development.
  Predeclare token-set Jaccard >=0.85 against base TRAIN/DEV or another proposed
  family as near overlap; contrast pairs within one family are allowed. This rule
  is fixed before candidate results, not tuned to obtain accepted examples.
  Similarity checks are not proof of independent semantic content or legal provenance.
- Snapshot the original 120 training records plus accepted augmentation. Preserve
  the original 30 development records exactly. No fitting vocabulary, pairs or weights
  on development examples. Parent-round lineage may add prior accepted training only.
- Fixed candidate: pinned MiniLM revision and SetFit CPU recipe from the verified
  comparison, seed 42, 50 encoder steps, five pair iterations, batch 16, learning
  rate 2e-5, normalized embeddings and matched logistic head. Restart from original
  pretrained weights, not a silently warm-started previous candidate.
- Compare saved original C42 and the candidate on unchanged development data only.
  Same threshold grid and joint precision/recall rule; retain diagnostic fallback.
  Report full counts, curves, seed/recipe/data lineage and actual adaptation proof.
  This is development iteration, not a new independent generalisation test.
- Inference stays local. No customer text, external reporting, model publishing,
  app integration, new UI, deployment, paid service or automatic model promotion.

## Review independence and history

The continuing teacher authored/audited the original train/development data and
previously saw aggregate evaluation results. The reviewer also has project history.
They are instructed to use the rubric/training scope for this round; no claim is
made that development wording was never seen. Reviewer blindness means only that
the new teacher labels/rationales are hidden during labelling. Both labels are AI
judgments; shared biases remain. Future integration needs separate human usefulness
review and fresh independent validation, beyond this workflow demonstration.

## Ownership and gates

Engineer owns new workflow code/tests/config. PM owns the real teacher proposal.
Independent reviewer owns blind decisions and final review. Lead owns this design,
run instructions, documentation, integration and engineering verification.

Product manager and independent product reviewer approved this concrete design
before training. Lead engineering approval covers immutable inputs, strict review
binding, no old-source edits, development-only reporting, fixed one-cycle budget
and no promotion. Training additionally waits for inspection of the prepared
snapshot and independent review clearance. Previous results remain unchanged.
