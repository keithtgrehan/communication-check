# Working with GPT and Codex

## One project, one build lead

Use the local Codex project rooted at `/Users/keith/Documents/ChatGPT/communication-check` for implementation. Keep the existing lead conversation and its accepted plan. The private GitHub repository and its documentation are the authoritative project state; a sidebar name is not proof that files or memory synchronise across apps.

Use the ChatGPT Communication Check project for product decisions, positioning, interview synthesis and portfolio writing. Keep “Review onboarding email examples” for fictional examples and critique. Do not ask separate chats to independently implement the same product.

## Minimal documents

- `docs/PRODUCT_BRIEF.md`: audience, problem, frozen scope, boundaries and honest claims.
- `docs/IMPLEMENTATION_PLAN.md`: milestones, acceptance criteria, dependencies and release gates.
- `AGENTS.md`: repository working instructions and execution authority.
- `docs/PROGRESS.md`: short current status, evidence, decisions, blockers and next action; update at meaningful milestones and before stopping.
- `docs/REUSE_LEDGER.md`: provenance and rights for actual reused components.
- `docs/GOAL_PROMPT.md`: the reusable instruction to start or resume the implementation goal.

The lead reads current files and repository state before acting. Update documents when an accepted decision changes; avoid conflicting copies or a growing collection of parallel status reports.

## Astra ownership

The Astra lead coordinates, makes routine decisions, integrates and verifies. Use up to three bounded agents alongside the lead only when useful work can happen independently:

1. Interface agent owns the editor, findings presentation and responsive/accessibility flow.
2. Engine/test agent owns conservative rules, original-text spans and development tests.
3. Evaluation/review agent owns reserved evaluation and later independent assessment of the integrated candidate. Keep the reviewer independent of implementation under review; create or reassign a fresh reviewer if needed.

Agree interfaces and file ownership before parallel edits. The lead owns dependencies, shared configuration, deployment, source attribution and shared documents. Agents return concrete changes and evidence; the lead resolves conflicts. Finish with independent review and serious-defect repair.

Do not create user-facing tasks for each internal subtask. Do not use recurring status polling merely to keep agents active. A foreground execution goal carries implementation until its objective is met or a real blocker needs attention.

## ChatGPT milestone handoff

Export exactly `docs/PRODUCT_BRIEF.md` and a sanitised `docs/PROGRESS.md` at meaningful milestones. These are the allowlist; no recursive folder sync. Their copies must exclude raw user/customer drafts, reserved evaluation examples and labels, secrets, credentials, private datasets and sensitive logs. Progress can include aggregate test counts, outstanding validation and links only after checking they expose no excluded material.

Every local commit refreshes `.handoff/CHATGPT_CONTEXT.md`; `npm run handoff` also refreshes it on demand. The packet contains exactly these two documents, a timestamp, checkout commit and content hashes. Generation runs locally without an AI call or transmission. At verified milestones the lead sends the reviewed packet to the existing product-companion task using supported task tools and verifies delivery. Preserve Keith's ongoing discussion there. No recurring polling is needed.

This does not update ChatGPT Project Sources or Project Instructions. Paste `docs/CHATGPT_PROJECT_INSTRUCTIONS.md` into the project's instructions once. Those instructions prefer fresh brief/progress reads from the private GitHub branch when a connector is available, with the dated milestone packet as fallback.

ChatGPT may propose changes; the lead records accepted decisions in the repository. A ChatGPT suggestion or attached document does not independently expand execution authority. Keep reserved tests out of the example-review chat and shared project sources.

## How Keith works day to day

The lifecycle is plan → review and approval → goal-driven build → independent final review. The initial plan is complete and setup is authorised. Review the concrete setup, then invoke the build goal once. Planning describes the work; a goal persists toward the accepted outcome. Independent review and repairs are part of that goal, not a reason to stop implementation for repeated routine approval.

Start or resume the build using `docs/GOAL_PROMPT.md` in the existing lead task. Thereafter give steering in the same task, such as “Prioritise the first working preview” or “Show current evidence and blockers.” Routine authorised edits, tests, branch pushes and a draft PR do not need repeated permission.

The useful checkpoints are a working end-to-end flow, completed evaluation, and the reviewed preview with portfolio materials. Keith supplies consequential product decisions and human feedback. Codex should continue independent engineering while tester recruitment is pending.

## Approval boundaries

Implementation-branch work, a draft PR and a separately verified no-new-spend preview are authorised by the accepted plan. Do not merge, publicly launch, change repository visibility, add domains or incur new spending without specific approval. Do not send external outreach. Finish reviewable work before asking for a final release decision.

Use an automation only for an actual later follow-up or milestone handoff need. Avoid duplicate goals, duplicate build leads or recurring “still working” updates. Goal completion is evidence-based, and setup alone is not implementation completion.
