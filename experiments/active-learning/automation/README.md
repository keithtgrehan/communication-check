# Automatic local classification and comparison

This is an automatic mode inside the existing active-learning experiment. It reuses
its frozen C42 baseline, model adapter, teacher/reviewer packet validation and Codex
actor runner. It does not mutate `active-001`, the earlier teaching run, any consumed
heldout, or the production checker. No examples, labels, adjudication or human-review
packet are requested from the user.

From `/Users/keith/Developer/communication-check`:

```sh
experiments/encoder-comparison/.venv/bin/python -B experiments/active-learning/automation/pipeline.py run --run-id auto-002
```

Use a new run ID for an explicitly intended experiment. Existing IDs are refused,
including failed runs: no overwrite, silent retry, replenishment or final-test
retuning. The delivered run is `auto-001`; do not rerun it. A new authoring run uses
the same frozen scenario families and is a replication of this design, not a new
independent research population. No scheduler or automatic promotion exists.

Observed `auto-001`: completed in 13.94 minutes with 36 accepted training additions
and four quarantined passages. One compact fit completed; its final F1 tied C42 at
0.634, versus ModernBERT 0.615 and DeBERTa 0.267. No candidate met the declared
improvement rule. All 56 final passages remain (52 binary references and four
ambiguous references). See [the frozen comparison](runs/auto-001/REPORT.md),
[machine report](runs/auto-001/report.json) and [verification](validation.json).

Verify the delivered run and recompute its final metrics from saved annotations:

```sh
experiments/encoder-comparison/.venv/bin/python -B experiments/active-learning/automation/pipeline.py verify --run-id auto-001
```

`verify` performs local hash checks and deterministic metric reproduction without
new LLM calls, model fitting or test consumption. Exact model job inputs, checkpoint
hashes and dependency versions are retained for offline prediction reproduction;
new execution of those inputs is replication, never fresh evidence. Generated text
can vary between authoring runs; the saved raw text/labels are the reproducible data.

## What the command does

1. Freeze the protocol and implementation hashes; verify existing model bundles and
   historical files; test operating-system network denial with an allowed control.
2. Obtain the two pinned public safe-tensor checkpoints, checking model licence,
   revision and dependencies before download. Verified cached models are reused.
3. Prepare the author-hosted ML-Promise English **test** release as a separate,
   non-commercial native-label benchmark. Its 64 rows are selected by source-ID/text
   hash before examining labels. No external training data or target-label mapping.
4. Generate 40 TRAIN, 28 DEV and 56 FINAL passages in disjoint assigned scenario
   families, using separate existing-account Codex sessions. References are synthetic
   AI judgments, never human gold. The diverse discourse scenarios include attribution,
   negation, conditional dependencies, deadlines, requests, past actions, explicit
   assurances, pronouns, corrections and genuinely mixed passages.
5. Independently label the 40 training passages in shuffled, opaque teacher/reviewer
   packets. Validate schema, actual session separation and exact evidence quotes.
   Quarantine whole training families on ambiguity, invalid evidence, disagreement
   or overlap; never ask the user to resolve them. Both annotators use the existing
   runner's `gpt-6-astra`; same-family bias is explicitly recorded. No separately
   configured model-family service is assumed or purchased.
6. Add only eligible synthetic training families to the original 120 TRAIN rows.
   If there are at least eight additions, four per class and two complete families,
   train one seed-42 / 50-step CPU SetFit model from the pinned original MiniLM.
   The legacy adapter's original 30 DEV rows remain diagnostic only. Threshold
   selection uses the new 28 DEV rows for every candidate, including C42.
7. Freeze models and thresholds, then score all 56 FINAL passages once. Author-null
   references remain in ambiguity diagnostics; disagreements never remove difficult
   final rows. Overlap invalidates target evaluation rather than cherry-picking a
   cleaner final set. No final-error correction loop exists.
8. Score DeBERTa and ModernBERT on native ML-Promise PI at the fixed 0.50 threshold,
   using its separate predeclared ESG hypothesis. C42 was trained for a different
   task and is not presented as a native ESG benchmark model.
9. Export per-passage annotations, all threshold curves, category/scenario failures,
   coverage/abstentions, precision/recall/FP, model agreement, latency, memory,
   a comparison report, terminal status and a full output manifest.

## Outputs

In `runs/<run-id>/`:

- `REPORT.md`: concise comparison and limitations.
- `report.json`: metrics, threshold curves, training verification, resources,
  category-level failures and targeted scenario-family slices.
- `annotations/*-{dev,final}.json`: candidate passage ID, binary label/abstention,
  category, score, threshold and model/data provenance. Scores have no invented
  rationale or evidence: those fields are `null`. Compact negative predictions
  are `not_firm_delivery`, not an invented negative subtype; NLI negative subtypes
  are explicitly diagnostic hypothesis rankings.
- `annotations/{teacher,reviewer}-train.json`: joined passage IDs, accepted
  pseudo-labels or quarantine abstentions, validated evidence and actor rationale.
- `annotations/synthetic-references.json`: author reference labels/evidence, distinct
  from model predictions. `data/*-raw.json` preserves all original author/actor output.
- `prepared.json`: complete synthetic rows, accepted training additions, quarantine
  reasons, split integrity and provenance. No external rows enter this file.
- `external/research-only/`: original ML-Promise test file, source inventory,
  licence/provenance, native labels and predictions. This path is Git-ignored and
  never read by the training or synthetic-authoring stages.
- `protocol.json`, `source-freeze.json`, `model-freeze.json`, `selection-freeze.json`,
  `final-consumed.json`, `freeze.json`: reproducibility and replay/integrity records.
- `jobs/`: exact local worker inputs/results, bounded resource observations and logs.
  Native benchmark inputs/results are under the research-only directory instead.

`SOURCE_AUDIT.md` and `source-audit.json` document primary-source definitions,
actual availability, provenance, licences and explicit non-mappings. MailEx's public
archive is available, but its event ontology is not equivalent to author-owned firm
work-item delivery. ML-Promise's published PI includes ESG principles/strategies and
uses CC BY-NC-SA 4.0. Its current English test file has 400 rows, while the paper
reports 200; results identify the actual author-hosted release rather than pretending
to reproduce the paper's score. No non-commercial data enters training. ModernBERT
is research-only here because its permissive model licence does not resolve all
licences in its mixed training sources.

## Fixed rules and interpretation

The unchanged rubric is `../../encoder-comparison/data/rubric.md`. A positive means
an author's unqualified future delivery of a concrete work item. It does **not** mean
that a promise is false, risky, unauthorised or useful to warn about.

The protocol is frozen in `protocol.json` with `protocol.sha256`. The threshold grid
is .05–.95 in .05 increments. Require DEV precision >=90%, recall >=70%, coverage
>=90%; maximize recall, precision, then threshold. Otherwise use .50 diagnostically.
Diagnostic ranking uses final F1, precision, fewer false positives, then fixed model
order. Improvement additionally requires a DEV pass, strictly greater final F1 than
C42 and no more final false positives. This is a small synthetic comparison, not a
statistical superiority or customer-population claim. A failure to improve is a valid
terminal outcome; it never triggers another training round.

Recall includes positive abstentions in its denominator; selective recall is also
reported separately. Undefined precision is null, not zero. Native-label metrics,
synthetic-reference metrics and model agreement are never pooled. Neither NLI scores
nor teacher/reviewer/model agreement are calibrated confidence. Challenge tags
identify preassigned scenario-family slices, not human-verified passage phenomena.

Deduplication uses exact normalized text, IDs/families and token-set Jaccard >=.85,
including the original TRAIN/DEV, prior teaching proposals and old active pool.
Historical heldouts are never read. Assigned scenario domains are disjoint, but
lexical checks cannot prove semantic independence or rule out pretrained-model data
contamination. DEV and FINAL references each come from one separate author session;
they are not independently adjudicated reference labels. Teacher/reviewer consensus
is required only for training additions. This avoids filtering final cases by
agreement, but leaves possible author-reference mistakes in the diagnostic scores.
Independent sessions may share systematic reference-label mistakes.
The prior human audit remains **unperformed**, not relabelled complete or required.

## Runtime and setup

The installed environments are separate. Existing SetFit dependencies remain pinned
and unchanged. NLI uses Python 3.11, Transformers 4.51.3 and PyTorch 2.10.0; the complete
resolved environment is `requirements-nli-lock.txt`. CPU ModernBERT/DeBERTa imports
were verified. To restore the isolated NLI environment on a compatible machine:

```sh
experiments/encoder-comparison/.venv/bin/python -m venv experiments/active-learning/automation/.venv-nli
experiments/active-learning/automation/.venv-nli/bin/python -m pip install -r experiments/active-learning/automation/requirements-nli-lock.txt
```

The legacy frozen bundle/checkpoint paths must also exist and verify; this workflow
fails closed rather than replacing them. On another machine restore the existing
encoder experiment following its runbook first. The existing-account Codex CLI runner
uses pinned CLI 0.162.1; no API key or new paid service is configured. Synthetic
passages go to that service; external benchmark passages do not. This is not an
entirely offline authoring workflow.

macOS `sandbox-exec` is required for local inference/training network denial.
CPU threads4, batch8 NLI pairs, maximum256 tokens including hypotheses and2000 UTF-16
units; inadmissible inputs abstain without truncation. Model/download/actor stages
have ten-minute limits, the run has a one-hour limit, process trees12 GiB RSS and
watched run/model/cache artifacts5 GB. Live checks kill over-budget process trees;
failures retain outputs and terminate without user labelling. Resource measurements
are local CPU observations; batch-amortized latency is not interactive or browser
latency. Peak process RSS and process-tree samples are recorded separately.

Run the new integrity/workflow tests:

```sh
experiments/encoder-comparison/.venv/bin/python -B -m unittest discover -s experiments/active-learning/automation -p 'test_*.py' -v
```

Production, prior campaign state, consumed tests and old human-review packets remain
unchanged. No deployment, automatic candidate integration, model publishing or paid
service purchase is part of this command.
