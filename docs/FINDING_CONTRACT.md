# Finding contract — version 1

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

Interface imports checkDraft and types. Demos are exported as `DEMO_DRAFTS` from
`web/src/demos.ts` and must invoke the same engine. Every edit clears old results
and dismissal state. Recheck replaces results; copy uses current text. Long input
is retained for editing with a clear limit message; do not silently truncate it.
Findings can be dismissed and original evidence selected in the editor.

Reserved evaluation labels/matching criteria are frozen before implementation.
The independent evaluator works outside repository/shared sources and returns only
aggregate results until evaluation is complete. The engine agent owns 18 fictional
development fixtures; the interface agent owns the three distinct visible demos.

Timing clarification, 2026-09-10: the earlier "requested/dependent" wording
was broader than the authoritative product brief. This description and the
contradictory ad-hoc tests are being aligned with that existing brief. The external
finding API, original development fixtures, reserved labels and evaluation gates
are unchanged.
