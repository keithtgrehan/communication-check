# Finding contract — version 3 (16 September 2026)

## Approved bounded correction after first review

Keith authorized this correction after reviewing the local app. This section
supersedes the narrower tone policy below; clarity and snapshot behavior remain
unchanged. No model, general sentiment assessment or new reserved evaluation.

- Rename the optional lens to **Tone cues**, explain supported checks upfront,
  and state that intent changes review questions, not detection sensitivity.
- Add one clearly fictional tone demo using the ordinary draft/check path.
  Existing clarity demos remain intact. No fabricated findings or auto-analysis.
- Add `judgmental-framing`: bounded evaluative **not a good look** constructions
  (including a trailing comma clause), and addressed **you should know better**.
  Do not flag ordinary **not a good look at/view of** descriptions, questions,
  quoted/reported/conditional wording or negation of the concern.
- Extend dismissal with **as I already told you, [request]**; extend request-ending
  pressure with **no more excuses**. Keep explicit request grounding for these.
  No generic negative-word list, deadline penalty or inference of recipient mood.
- A narrowly matched cue may contain `not`; only that cue's own token may bypass
  the existing negation safeguard. Other qualifications retain suppression.
- At most one finding per family, two total. Existing family ordering stays;
  judgmental framing follows the original three. Original UTF-16 spans remain exact.
- Development checks cover positive variants and ordinary/negated/quoted/reported
  counterexamples, boundaries, repeated phrases, emoji and current UI behavior.
  Passing them is not evidence of broad language reliability.

Ownership for this correction: interface worker owns App.tsx, styles.css,
demos.ts and all tests/browser files; engine worker owns only tone.ts and
tone.test.ts. Lead owns shared types, this contract, docs, dependencies and Git.
Fresh independent reviewer starts read-only after integration.

## Current follow-on contract and ownership

The approved September 16 implementation handoff/build prompt supersede older
review-state and workflow instructions below. The original clarity rules remain
unchanged. Lead owns this document, shared types, active-text helper, existing
engine entry point, configuration, documentation and Git.

- UI worker owns `web/src/App.tsx`, `web/src/styles.css` and the four browser suites
  `workflow.spec.ts`, `presentation.spec.ts`, `evidence-scroll.spec.ts`,
  `tone-review.spec.ts`. No engine/shared-type edits.
- Tone worker owns only `web/src/engine/tone.ts` and `tone.test.ts`.
- A fresh reviewer reviews the integrated candidate without initially editing.

`checkTone(text, intent): ToneCheckResult` is exported by `engine/tone.ts`.
Intent is `direct | collaborative | warm` (UI default: collaborative). It is a
pure bounded wording-cue review with a separate cap of two, the same 12,000 UTF-16
limit/RangeError/blank behavior as clarity and the shared `activeText` masking
helper. Rule IDs: sweeping-blame, dismissive-request, pressure-wording,
judgmental-framing. Both
result shapes contain findings, checkedCharacters and excludedSections.

The shared `ReviewFinding` union preserves title/explanation/prompt and exact
original start/end/quote fields. Every action validates the snapshot and
`draft.slice(start, end) === quote`. `findingIdentity` includes rule, start, end
and quote; no identity depends on display order or title. Engine IDs remain
deterministic. UTF-16 positions include emoji and repeated wording correctly.

One editor owns text and a monotonically increasing text revision. Each lens
owns a nullable ReviewSnapshot: textRevision, intentRevision (null for clarity),
result, reviewedIds and expandedId. UI may store these fields equivalently in
separate state, but must preserve this ownership. Text mutation increments text
revision and invalidates both snapshots/decisions immediately, including loading
an example and clearing. Intent change increments intent revision and invalidates
tone only. Lens switching performs no analysis and preserves valid snapshots,
decisions and editor selection where practical. Explicit checks use current text.
Rechecking identical text/intent retains keep decisions by findingIdentity.

Only one finding is expanded in the active lens. Edit this wording selects and
scrolls the exact range; it neither rewrites nor marks Reviewed. Keep as written
marks Reviewed in the current snapshot; Undo restores pending state with a
predictable focus target. Never claim Fixed/Resolved, 0/0 achievement, exhaustive
coverage or factual verification. Copy uses current text and keeps the existing
manual-copy fallback. Empty tone states explicitly retain coverage limitations.

No new reserved evaluation is part of this slice; only fresh fictional tone
development cases. Historical evaluation records remain unchanged.

## Original bounded tone policy (extended by version 3 above)

Tone only considers addressed statements or explicit requests at a sentence/line
start. Sweeping blame combines always/never with a short list of negative
coordination actions; dismissive requests combine an explicit accusation with a
requested action; pressure wording combines a request with no excuses/or else.
Brevity, please, ordinary deadlines, legitimate escalation, gratitude and missing
exclamation marks alone are never concerns. Priority is blame, dismissal, pressure,
with at most one per family and two shown in total.

The same concern may appear for all three intents. Direct prompts focus on the
specific action; Collaborative prompts invite coordination or a shared next step;
Warm prompts invite more situational/personal framing. None requires gratitude,
apology or invented facts. Intent is the writer's preference, not inferred mood.

Recognized history/signatures retain the existing mask and offsets. Tone adds
conservative abstention for quoted units, questions and supported negative,
conditional/reported wording. These are finite safeguards: unfamiliar wording,
sarcasm, cross-sentence context and unknown quotation formats remain limitations.
Unit tests are development evidence only, not a new evaluation or accuracy claim.

## Preserved clarity engine contract

`web/src/engine/types.ts` is shared and owned by the lead. The engine exports
`checkDraft(text: string): CheckResult` from `web/src/engine/index.ts`.
It accepts unchanged original text, has no side effects, returns at most three
ranked/deduplicated useful findings, and throws a RangeError for input longer than
MAX_DRAFT_LENGTH (12,000 UTF-16 units). Blank input returns no findings.

Offsets are zero-based, start-inclusive/end-exclusive UTF-16 offsets into the
original text; `quote === text.slice(start, end)`. Excluding recognised quoted
history/signatures must not shift them. IDs are deterministic for a given draft.
Each finding is an invitation to review, never a factual-verification claim.
No rule is required to emit a finding on every possible semantic ambiguity.

Five rule families:

- action-owner: explicit ambiguous next-step ownership/action wording.
- vague-timing: nonspecific timing on an action that an explicitly stated next step depends on. The dependency may be local or clearly linked through an adjacent reference; a request alone is insufficient.
- competing-requests: several actionable requests without order or priority.
- agreement-wording: wording that presents an explicit proposal/pending decision as agreed.
- commitment-confirmation: strong delivery, pricing or functionality promises needing confirmation.

Suppress clean explicit requests/owners, legitimate dates, ordered/prioritised
checklists, ordinary conversational timing, and negated/qualified commitments.
An ordinary promise to send meeting notes is not a risky product commitment.
Use conservative evidence and abstain when a useful flag cannot be grounded.

Interface imports checkDraft, checkTone and shared types. Demos are exported as
`DEMO_DRAFTS` from `web/src/demos.ts` and invoke the same engine as arbitrary drafts.
Long input is retained with a clear limit message rather than silently truncated.
Current selection, keep/undo, invalidation and recheck behavior is specified above.
The previous dismissal/recheck semantics are superseded. Original development
fixtures and all historical reserved labels/matching criteria remain unchanged.

Timing clarification, 2026-09-10: the earlier "requested/dependent" wording
was broader than the authoritative product brief. This description and the
contradictory ad-hoc tests are being aligned with that existing brief. The external
finding API, original development fixtures, reserved labels and evaluation gates
are unchanged.
