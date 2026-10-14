# Bounded active learning

This isolated experiment asks whether three rounds of independently AI-labelled
fictional additions improve the existing commitment-wording classifier. The
application, previous experiments and historical heldouts stay unchanged.

The target is an author's unqualified future delivery of a concrete work item.
It does not assess truth, risk, authority or whether a warning would be useful.
AI agreement is not human ground truth. Human audit may remain pending.

## Completed campaign active-001

The protocol ended at `insufficient_final_reference`: all three CPU fits completed,
but final overlap exclusions left 76 passages / 19 families, below the required 108 / 27.
No final-test predictions or bootstrap were run, and no replacements were generated.
Rounds 1/2 DEV: TP9/FP1, 90% precision/60% recall (fail). Round 3: TP11/FP1,
91.7% precision/73.3% recall at 0.45 (pass). C42: TP10/FP1 at 0.50.
This is a DEV improvement; independent final performance remains inconclusive.

Read [the full audit](artifacts/AUDIT_REPORT.md), [machine report](artifacts/audit-report.json)
and [Round 3 human-review packet](campaigns/active-001/rounds/round-3/human-review.md).
Independent [result review](artifacts/result-review.json) approved the report, not model promotion.
Human audit is pending. The existing campaign is terminal; do not rerun its mutation
commands or start a replacement campaign. C42 and production remain unchanged.

## Fixed protocol

The approved specification is DESIGN.md; executable constants are in core.py.
Original 120 TRAIN / 30 DEV; one 300-passage pool in 75 contrasting families;
up to three 40-passage acquisition rounds, random-first 2 families, disagreement
5, uncertainty 3. Disagreement shortages transfer to uncertainty. Whole-family
quarantine, no replacements, no repeated families. Each fit restarts the pinned
original MiniLM using the unchanged seed42/50-step CPU recipe. All previous
teaching proposals are overlap exclusions, not new starting training rows.

Each stage hashes its immutable inputs. Three attempts are counted at campaign
level. Training and inference use macOS sandbox-exec to deny all networking.
An independent positive/negative network control must pass before starting.
The 90-minute experimental clock begins with start-authoring, not implementation.
There is a ten-minute fit limit and a two-billion-byte artifact limit.

Raw final fixtures live in an evaluator-owned directory outside the repository.
One selected candidate and A/B/C42 are evaluated once, with campaign-wide replay
protection, after independent reference labelling. The test has 120 authored rows;
at least 27 complete families, 50 examples per class and ten per negative category
must survive. Any lower coverage stops scoring without replacement.

## Running the existing campaign

Use the repository's existing Python environment. Never overwrite a run, clear a
start marker, change a frozen source file, or create a replacement campaign to
restart an unsuccessful experiment. Commands below are the sequence, not permission
to run a new experiment merely by reading this document.

```sh
PY=experiments/encoder-comparison/.venv/bin/python
CLI=experiments/active-learning/campaign.py
$PY -B $CLI init
$PY -B $CLI start-authoring
# Fresh author produces pool.json. An independent unlabelled overlap audit may
# provide a bound audit file; all generation occurs after the timer starts.
$PY -B $CLI freeze-pool --pool path/to/pool.json
$PY -B $CLI acquire
$PY -B $CLI label-kit --round round-1 --role teacher
$PY -B $CLI label-kit --round round-1 --role reviewer
# Separate fresh actors label the two packets independently.
$PY -B $CLI prepare --round round-1 --teacher path/to/teacher.json --reviewer path/to/reviewer.json
$PY -B $CLI train --round round-1
# Repeat acquisition/preparation/fitting for rounds 2 and 3 if allowed.
$PY -B $CLI select-final
# Fresh evaluator authors private pool.json only after candidate selection.
$PY -B $CLI final-kit --private /absolute/evaluator/directory
# Fresh teacher and separate reference reviewer produce annotation files there.
$PY -B $CLI final-prepare --private /absolute/evaluator/directory
$PY -B $CLI final-evaluate
$PY -B $CLI status
$PY -B $CLI report --out experiments/active-learning/artifacts/audit-report.json
printf '%s' 'We will send the revised timetable on Friday.' | $PY -B $CLI predict
```

Prediction reads stdin and emits no passage text. It persists neither that passage
nor a model request. An inadmissible passage abstains; accepted text is never
silently truncated. This Python CLI is not a browser integration.

## Agents and independence

Implementation uses repository-approved Astra agents. For fresh labelling and
review roles, run_agent.py launches pinned Codex CLI 0.162.1 with `--ephemeral`,
no user configuration, a separate minimal prompt and read-only tool sandbox.
It uses the existing Codex account, not a separately configured API service.
The older installed CLI cannot access Astra; the newer runner is used from npm's
temporary cache without replacing the global executable or changing dependencies.
Keep at most three actors active alongside the lead. Actor logs contain their
packets, so final-reference prompts, logs and outputs must remain outside the repo.

Each label actor receives only its shuffled opaque-ID/text packet, rubric, output
schema and packet hash. No family IDs, scores, routes or other actor answers.
Actual session IDs, configured model and effort are recorded where available.
Configured identity is not independent model telemetry. Procedural isolation does
not prove agents lack shared biases or enforce a security boundary.

Human packets show passages before AI answers. Inspect human-review.md in each
round, with the answers stored separately. Review disagreements and the fixed
label-stratified random agreement sample. An explicit human correction to an
accepted label halts the current campaign for a new protocol decision.

## Verification and interpretation

```sh
experiments/encoder-comparison/.venv/bin/python -B -m unittest discover -s experiments/active-learning/tests -v
experiments/encoder-comparison/.venv/bin/python -m pip check
```

DEV is tuning data and contains five scenario families. The fresh final set is
synthetic, agreement-filtered and artificially balanced; bootstrap intervals
resample entire families and are exploratory. No matched random-only training
arm exists, so changes cannot be causally attributed to active acquisition.
Every failed round remains reportable. A final pass cannot erase a failed DEV
gate. No result authorises model integration, deployment or reliability claims.

Methods: [small-text acquisition strategies](https://small-text.readthedocs.io/en/latest/components/query_strategies.html)
and [SetFit adaptation](https://huggingface.co/docs/setfit/en/conceptual_guides/setfit).
