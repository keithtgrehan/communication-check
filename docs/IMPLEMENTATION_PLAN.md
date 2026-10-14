# Communication Check implementation plan

## Approved automated wording comparison — 14 October 2026

The user explicitly authorised a fully automated local extension in
`experiments/active-learning/automation/`. The frozen protocol, exact launch command
and source/licence audit live there. Finish line: automatic data preparation and
schema/evidence-validated teacher/reviewer labels; at most one eligible SetFit fit;
pinned C42/DeBERTa/ModernBERT comparison; separate native published-label benchmark;
machine annotations, honest terminal report and integrity checks. Unresolved training
families are quarantined automatically. No human authoring, labelling or adjudication
gate, dashboard prerequisite, production integration, deployment or paid service.
The earlier human audit remains unperformed. Prior campaign states and consumed
heldouts are preserved; all hypotheses, selection rules and limits precede scoring.

## Approved bounded active learning — 14 October 2026

Keith accepted `experiments/active-learning/DESIGN.md` and explicitly authorised
its local implementation, fictional pool, independent AI labelling, up to three
CPU training attempts and one fresh final evaluation if the fixed gates permit.
Original 120 TRAIN/30 DEV and all earlier experiments remain unchanged. The new
sibling controller passed engineering clearance and executed all three fits. The
protocol stopped before final scoring when only 76 references survived overlap
exclusions. See `experiments/active-learning/artifacts/AUDIT_REPORT.md`; DEV gain
is observed, independent final performance inconclusive, human review pending.
No source changes after experimental start, replacement rounds, historical heldout
access, app integration, deployment, spending or customer data. Human audit may
remain pending and must be reported as such. Detailed stop/completion rules are
in the accepted design; an unsuccessful or protocol-stopped result is reportable.

## LLM teaching workflow — 14 October 2026

The preceding completed milestone created a way for an LLM to train the local classifier.
The completed comparison below is preserved. The bounded follow-on in
`experiments/llm-teaching/DESIGN.md` uses Codex as teacher, a separate blind label
reviewer, whole-family quarantine, immutable training snapshots and one fixed local
SetFit candidate. The original development rows stay unchanged; this is development
iteration, not another independent test. No consumed heldout access or promotion.
Finish with a demonstrated real teaching batch/review/training/report, reusable
Codex instructions, local prediction, integrity/privacy checks and final review.
An inferior model still demonstrates a working process and must be reported honestly.
Completed: 40 real teacher proposals, 36 accepted and four family-quarantined;
one saved CPU candidate trained on 156 rows. Original 30 DEV rows unchanged.
Candidate TP10/FP2 versus baseline TP10/FP1; both fail the development target.
Twelve workflow tests and OS-network-blocked predictions passed; earlier artifacts
remain unchanged. Final reviews approve the reusable workflow, reject promotion.

## Approved encoder comparison — 14 October 2026

Keith authorised the three-way local comparison in
`experiments/encoder-comparison/DESIGN.md`: lexical TF-IDF, frozen MiniLM and
SetFit-adapted MiniLM (seeds 42/43/44), using the same audited data and operating
policy. Both product and lead engineering design reviews approved before training.
PM owns the data audit; engineer owns isolated Python implementation; independent
reviewer owns fresh private synthetic evaluation; lead integrates and reviews.
Finish with saved models, reproducible commands, one frozen aggregate comparison,
offline verification and an honest result. No app/UI/export/deployment changes.
The earlier failed experiment and historical heldouts remain preserved.
Completed: all five candidates saved, 13 contract tests and OS-network-blocked
inference passed; one frozen 60-case comparison completed. All development and
research gates failed. C42 primary: TP27 / FP6 / TN24 / FN3; TF-IDF: 27/11/19/3.
Full all-seed results and limitations are in the runbook. Both final reviews approve
research delivery and reject integration. No post-test source/model tuning.

## Approved local classifier experiment — 13 October 2026

Keith requested a plan from product and engineering agents, approval by senior
product and engineering reviewers, then implementation within approximately 30
minutes. This explicitly reopens one bounded learning experiment; historical
evaluation results and the live checker remain unchanged. Start: 21:46 UTC.

**Finish line:** a reproducible trained classifier, a separate local browser lab,
one frozen blind synthetic comparison, and an honest continue/stop conclusion.
The task is classification of an author's unqualified prospective delivery wording,
not proof that a promise is wrong, agreed, authorised or worth changing.

- Binary target: `firm_delivery` versus `other`. Retain negative categories for
  qualified wording, requests, reported/quoted wording and other text. Input is one
  passage of at most 2,000 UTF-16 code units; evidence is the entire original input,
  not a learned token-level explanation. Mixed/ambiguous challenges are separate
  from primary metrics. Only invalid input abstains; no semantic abstention claim.
- Data: 120 training and 30 development fictional, AI-authored/labelled examples,
  with disjoint scenario families and explicit provenance. No customer data,
  historical heldout access, public-corpus ingestion or external LLM API calls.
- Model: training-only word unigram/bigram TF-IDF and balanced logistic regression
  with fixed settings/seed. Export vocabulary, IDF and weights for local JavaScript
  inference. No dependency changes or pretrained downloads in this experiment.
- Development threshold: candidates 0.50 through 0.90 in 0.05 increments; require
  precision >= 0.90, maximise recall, then prefer the larger threshold. If none
  qualifies, use 0.90 and explicitly record a failed development gate. Scores are
  uncalibrated and must not be presented as correctness probabilities.
- Freeze model, threshold and implementation hashes before a single independently
  authored synthetic test. Evaluator-only fixtures live outside the repository;
  only aggregates return to implementers. Separation is procedural, not a sandbox.
  No tuning on those results or repeated claim of an untouched test.
- Compare against the unchanged `checkDraft` commitment-confirmation output on
  identical inputs and an always-negative baseline. The existing checker has a
  broader task; publish confusion counts, precision/recall and negative-category
  errors without implying a whole-product accuracy comparison.
- Provisional criterion for considering a later human-labelled study: >=90% firm
  precision, >=70% recall and no firm emissions on requests/reported text. These
  are experiment decisions, not production acceptance or statistical guarantees.
  No integration into the shipped checker even if the criterion passes.
- Verify deterministic training, Python/JavaScript parity, input limits/Unicode,
  schema/split integrity, local browser workflow, offline operation and no input in
  network/logs/storage. Existing application checks must remain passing.

**Review decisions:** senior product reviewer approved the scope and evidence
boundaries. Lead, acting as senior engineering reviewer, approved the implementation
plan with the baseline, ambiguity and freeze conditions above before implementation.
The tool allows four agent threads including the lead, so the four roles are the
product manager, senior engineer, senior product reviewer and lead engineering
reviewer. The engineer owns all experiment implementation; PM owns train/dev data;
product reviewer owns blind fixtures; lead owns project records and code review.
All work is local on `codex/communication-check-next`; no deployment, merge,
spending, runtime LLM connection or changes to the frozen/Prism branches.

## Current override — 16 September 2026

Keith explicitly started the approved Canvas3 and local tone/review update.
`docs/PRODUCT_BRIEF.md` and `docs/FINDING_CONTRACT.md` record the current scope,
contracts and file ownership. The Desktop implementation handoff/build prompt
supersede conflicting historical instructions below. PR #1 is merged; work from
main b22bcfd on `codex/communication-check-tone-review`. Two disjoint Astra High
workers implement UI and tone; a fresh Astra Extra High reviewer inspects the
integrated result. Preserve clarity behavior and historical failed evaluations.
This slice delivers local code, checks/screenshots, review and a bounded one-hour
How it works case-study refinement. No deployment, merge, new research, model,
extra app screen, public launch, outreach or paid commitment. Historical hosting
and evaluation milestones below are not repeated as requirements for this slice.


## Current delivery override — 2026-09-10

Keith explicitly redirected the work: “put focus on shipping quickly, it just has
to look good on portfolio.” Ship the reviewed existing app as a polished, functional
portfolio prototype. Cancel the deeper proposition-normalizer experiment and its
60-case challenge for this delivery; no prototype was implemented or executed and
no challenge was frozen. Preserve the assessment privately as optional future work.

Complete the latest reviewed hosted preview, browser/privacy verification,
screenshots, concise case study, demo script and draft PR. The ten failed reserved
evaluations remain visible and the original detection gate remains unmet; do not
claim it passed. That accuracy target is future product-readiness work, not a
blocker for this revised portfolio delivery. All original data-handling, no-spend,
private-repository, no-merge and no-public-launch boundaries remain. The older
architecture experiment section below is historical and superseded by this decision.

## Baseline and execution boundaries

Root: `/Users/keith/Documents/ChatGPT/communication-check`. Remote: private `keithtgrehan/communication-check`. Work on `codex/communication-check-mvp`.

Before any implementation, inspect existing files, branch, remotes, progress and applicable `AGENTS.md`. Resume completed setup; do not import sources again or overwrite work. The authorised source is Vibe Signal at `000ba0685f961e253b0d34c0b02539ac897356e9`. If native same-owner/private forking is unavailable, use a selective independent private snapshot with a source/commit/path/licence/reason ledger. Copy no secrets, private data or deployment credentials. Verify rights for every copied component.

Reuse React/Vite foundations and useful evidence/demo presentation. Replace Vibe's relationship language, 30-word overload rule, confidence labels, canned results, backend calls and offset-shifting preprocessing. RCR evidence rendering and review-state patterns may be reused only after licence and relevance checks. Do not import the Sales NLP extractor unchanged. Other portfolio systems remain references; do not inherit their product instructions, datasets or whole architectures. Leave their repositories and deployments untouched.

Authorised implementation includes routine setup, fixes, tests, implementation-branch commits/pushes, a draft PR and a separate preview within verified existing no-new-spend hosting allowance. No merge to main, public launch, repository visibility change, domain change or new paid commitment. No external outreach messages.

## Build budget and ownership

Approximately five focused build days is an effort budget, not a schedule of artificial pauses. Deliver useful work as soon as ready.

| Milestone | Deliverable | Ownership |
| --- | --- | --- |
| 1: first end-to-end flow | Audited baseline, finding contract, fictional sample → real finding → edit → recheck → copy in a working local preview | Lead integrates bounded interface and engine work |
| 2: conservative checks | Complete frozen check families, suppression rules, original-text spans and development fixtures | Engine/test agent; lead reviews language |
| 3: usable interface | Three real-engine demos, dismissal, reset, empty/error states, evidence selection and accessible responsive flow | Interface agent |
| 4: evaluation and repair | Frozen reserved evaluation, browser tests, privacy verification and fixes | Evaluation agent; lead integrates |
| 5: reviewable delivery | Independent final review, resolved serious defects, verified preview, draft PR and portfolio materials | Independent reviewer then lead |

Use one Astra lead and at most three bounded agents alongside it. Interface ownership and engine/test ownership must not overlap; agree the finding contract first. The reviewer assesses the integrated candidate independently. The lead owns shared configuration, dependencies, integration and hosting.

## Architecture and behaviour

Static React/Vite application with a deterministic TypeScript engine. A finding records rule ID, original-text start/end offsets, exact quote, explanation and review prompt. Rank/deduplicate to present up to three useful findings. Never use arbitrary overall scores or present rule confidence as measured accuracy.

Preserve the original text throughout matching. Exclude recognised signatures and quoted history without changing original positions. Any edit invalidates existing findings and highlights. Recheck replaces results and their review state. Copy uses current editor text; handle clipboard denial with a truthful manual-copy option. Reset clears the draft and findings. The checker must work offline after static assets load.

Drafts and findings remain in memory. They must not enter telemetry, feedback payloads, logs, URLs, storage, analytics or error reporting. Avoid third-party runtime resources where unnecessary. Distinguish the host's static page requests from draft-bearing requests. Do not publish a no-draft-transmission claim until runtime checks pass.

## Measurable engineering acceptance

### Checks and evaluation

- Assemble 30 varied fictional evaluation drafts: 18 for development and 12 reserved. The three visible demos are additional examples.
- Reserve examples, labels and close paraphrases before rule development; keep related paraphrases in the same partition. Store reserved material outside shared project sources and milestone handoffs, with evaluator-controlled access until the evaluation pass.
- Include all check families, delivery/pricing/functionality commitments, legitimate deadlines, long technical emails, negation, acronyms, signatures, quoted content and uncertain promises.
- The 12 reserved drafts include four clean controls and at least 12 expected useful findings across the remaining drafts, respecting the three-finding display cap. Freeze labels and matching criteria before evaluating.
- Detect at least 10 of the 12 preselected expected findings, achieve at least 90% agreement between emitted findings and pre-agreed useful findings, and emit zero findings on the four clean controls. Report raw counts, denominators, disagreements and example provenance.
- Agent-created labels and fictional examples are engineering evidence, not human validation or estimates of real-world accuracy.
- If failures inform changes, promote those examples to regression tests. Use a fresh reserved set for any new heldout claim.
- No output invents a date, owner, promise, agreement or assertion of unauthorised commitments. With missing context, prompt confirmation instead of asserting a violation.

### Functional and interface checks

- Every quote equals its original-text slice; highlights work for repeated phrases, emoji, accented characters, whitespace and line breaks.
- Tests exercise actual check behaviour, suppression, ranking/deduplication and span correctness rather than mirroring implementation internals.
- Browser checks cover the full sample/paste → check → edit → recheck → copy flow, stale-result invalidation, dismissal, reset, empty/error states and clipboard success/failure.
- All three demos use the same engine as pasted drafts.
- Keyboard-only operation, focus visibility, accessible field/control labels, zoom and layouts at 320px, 390px and desktop widths pass. Identify automated mobile emulation honestly; do not imply physical-device testing.

### Privacy, delivery and review

- Inspect runtime requests and storage across load, typing, checking, editing, rechecking, copying and reset; use a distinctive synthetic canary to detect draft leakage. Test reload clearing and offline checking after load.
- No draft text appears in transmitted payloads, application logs, URLs or persistent browser storage. Record methodology and limitations.
- Production build and relevant dependency checks pass. Resolve serious defects and document material remaining limitations.
- An independent reviewer inspects the final integrated candidate; lead verifies fixes before delivery.
- The hosted preview corresponds to the reviewed implementation commit, or clearly reports the hosted preview as outstanding if the hosting gate is blocked.

## Hosting gate and dependencies

Prefer a separate static deployment with a provider URL; do not reuse Vibe or RCR deployment credentials/configuration. Before deploying, verify actual account allowance, commercial-use terms, billing/overage behaviour and that the action creates no new spend. Render static hosting is a candidate, not an established entitlement. Vercel Hobby must not be assumed suitable for this product's commercial intent. If no compliant no-new-spend option is available, complete a verified local preview and PR, report the hosted-preview blocker and seek a concrete decision only then.

Dependency or access blockers must identify the failed action and evidence. Continue independent engineering and documentation work while a hosting or human-validation dependency is unresolved.

## Human validation protocol

Keith recruits participants; no automated outreach. Prepare consent and redaction guidance without collecting draft text through product telemetry.

Three usability sessions: test comprehension, finding evidence, editing, rechecking, dismissal and copying. Desired signals are all three finishing, at least two unaided, and no participant believing the product verified facts or agreements. Record actual completion and misconceptions without manufacturing missing data.

Five AM/CSM pilots over seven working days: invite voluntary reports on useful findings, rejected findings and return use. Directional continuation signals are four completing two uses, three returning unprompted and three describing a useful revision. Small pilot results remain directional; participation and feedback are outstanding until supplied.

Engineering can finish while Keith arranges testers. Human feedback, public release and commercial readiness are separate gates.

## Final deliverables and release decision

Deliver a verified working preview, reviewable draft PR, README, source ledger, portfolio case study, 60–90 second demo script, screenshots, rollback instructions and an explicit list of outstanding validation. Include how to run/check the product, the evaluated commit, validation evidence and honest limitations.

Rollback documents how to restore the previous preview deployment or disable this separate preview without touching other projects. Keep the repository private and the PR unmerged. Prepare all reviewable work before requesting public-release approval. Document the later RCR approved-commitments → writer's draft → Communication Check concept only.

## Architecture decision after ten failed reserved evaluations

The tenth reviewed candidate detected 4/12 expected findings. Independent contract
review found all twelve labels and four clean controls within the frozen scope;
none of the eight misses resulted from evidence matching or the finding cap.
All ten failures remain recorded. The current surface recognizers have not shown
reliable transfer, despite strong known-case results. Stop adding individual phrase
repairs and do not run another reserved set automatically.

Proceed with one isolated deterministic proposition-normalizer experiment, outside
the production import graph, within the original approximate five-day effort budget.
Cap this feasibility slice at two focused engineering days, with no artificial wait.
Represent task assignment, decision approval and monetary bounds/benefits together
with their participants, original spans and predicate-local assertion/negation/
qualification. Unknown structures and unresolved references remain unknown. Reuse
the span tokenizer; add no dependency, LLM, network, persistence or UI change.

Freeze a precise private grammar/semantic inventory and atomic development examples
before an independent evaluator freezes a 60-case composition challenge. It contains
30 positives and 30 matched controls across the three relations, including fifteen
meaning-preserving pairs and unseen combinations of disclosed atoms. It is a bounded
development experiment, not a new original-format heldout acceptance claim. The
implementer must not see the completed challenge before the prototype is frozen.

Allow exactly one challenge run. Integration requires all sixty expected outcomes,
zero control flags, exact spans and consistent decisions across all fifteen pairs,
plus independent confirmation that the implementation composes relations/operators
rather than adding case-specific exceptions. Any failure stops integration; preserve
the result and make an explicit next decision. Do not automatically create a replacement
challenge. A passing slice permits narrow adapters and review within the remaining
original effort budget; it does not establish all-five-family detection acceptance.

Product typing and timing attachment remain separate, bounded integration work.
Do not infer software merely from an unfamiliar noun or absence of a human role.
Preserve the existing verified UI, API, evidence semantics and privacy behaviour.
One implementer owns the private prototype and, only after approval to integrate,
propositions.ts and engine adapters. The lead owns types/index, configuration,
runtime manifests, Git, hosting and docs; the evaluator owns the private challenge.
A fresh reviewer must inspect any final integrated candidate. Adding a runtime
module requires a new complete manifest and all original verification gates.

No narrowing of the product, weakened labels/thresholds, LLM or public launch is
authorised by this experiment. If it fails or cannot remain within the small offline
engine constraint, prepare a concrete product/architecture decision for Keith.
