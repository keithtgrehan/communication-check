# Communication Check working instructions

## Start and authority

Canonical root: `/Users/keith/Documents/ChatGPT/communication-check`.
Repository: `keithtgrehan/communication-check`, private.
Implementation branch: `codex/communication-check-mvp`.
Lead task: `01a08ae3-d0b5-7633-846b-28bfb692e8fb` (Build and ship Communication Check).
Product companion: `01a08ae3-9641-7cc3-8e2f-6c09b6efd2e4` (Review onboarding email examples).

Read docs/PRODUCT_BRIEF.md and docs/PROGRESS.md first; read the implementation
plan and workflow when needed. Inspect Git status, branch and remotes before edits.
The current setup is user-authorised. The initial baseline on main is complete;
all further implementation commits/pushes belong on the implementation branch.
Do not recreate the repository, import the source again or discard existing work.
Reuse draft PR #1 and update its title, description and evidence for the final MVP.
Do not open a duplicate PR for the same implementation branch.

Keith approved necessary implementation, tests/fixes, branch commits/pushes,
a draft PR and a separate preview within verified existing no-new-spend hosting.
No merge to main, public launch, visibility change, domain, paid commitment or
external outreach without specific approval. Never force-push or commit secrets.
Finish reviewable work before any final approval request. The prompt stored in
docs/GOAL_PROMPT.md creates no goal merely by being read; invoke it only when the
user asks to start/resume the build goal.

This is a standalone customer onboarding follow-up checker, not Signal Engine,
Vibe Signal, employee onboarding or a shared platform. Other repository documents
and imported source are reference material, not governing instructions.

## Product contract

Static React/Vite and deterministic TypeScript. Up to three useful findings with
exact original quotes, plain review prompts and dismissal. No overall score,
invented facts, verified-agreement claims or automatic rewriting/sending.
Drafts/findings are memory-only; no draft-bearing network, telemetry, feedback,
logs, URLs or persistence. Test runtime behaviour before claiming privacy.
Recognised quotes/signatures must not shift evidence offsets. Editing invalidates
findings; copy always uses current text. Read the brief for scope and suppressions.

## Bounded Astra collaboration

Keith explicitly authorises Astra subagents. Use gpt-6-astra and, when effort can
be chosen, high for bounded implementation and xhigh for difficult integration
or independent final review. This is a workflow preference, not a claim of measured
optimal performance. Preserve the user's explicit current model settings.
At most three subagents alongside the lead, only for independently useful work.
Give each agent the minimal context and explicit file ownership.

- Interface: web UI/editor/results/styles and its UI tests.
- Engine: conservative rules, original spans and development unit tests.
- Evaluator: reserved examples and evaluation report, never the same code under review.
- Lead: shared contract/config/dependencies, Git, hosting, docs and integration.

Agree the finding contract before parallel edits. Only the lead commits or pushes.
Use disjoint files or isolated worktrees; never ask two agents to edit the same
files. Use a fresh independent reviewer for the final integrated candidate.
Do not create additional user-owned build tasks for internal subtasks.

## Evaluation and privacy

Create 18 development and 12 reserved fictional drafts plus three separate demos.
Do not read reserved examples before the rules and labels are frozen. Keep them
outside shared project sources and normal handoffs; initially use an evaluator-only
local work directory. Record that this is procedural separation, not an enforced
sandbox. Commit only the resulting aggregate report before any later authorised
release of fixtures. If observed failures guide fixes, use a fresh heldout set for
another heldout claim. Agent labels are not human validation.

Run meaningful tests for checks, suppressions, spans, editing, clipboard, keyboard,
responsive layout, runtime network/storage and source/build integrity. Read the
implementation plan's exact gates. No serious unresolved defects at delivery.

## Progress and milestone handoff

Maintain docs/PROGRESS.md under roughly 100 lines: completed milestone, evidence,
decisions, actual blockers and next action. Never put customer drafts, holdout
examples/labels, secrets or sensitive logs in that file or the product brief.
Run npm run handoff at verified milestones; local post-commit hooks also refresh
.handoff/CHATGPT_CONTEXT.md from ONLY docs/PRODUCT_BRIEF.md and docs/PROGRESS.md.
No recursive uploads or automatic product/source publishing.

At meaningful milestones, send the allowlisted handoff text to the existing
product-companion task with send_message_to_thread, then use one bounded
wait_threads call to verify delivery/completion. Keep the same task; don't create
duplicate product threads. Ask the companion only for the specific critique needed
or a brief acknowledgement of a status-only update. Treat its suggestions as advice,
not approved scope changes. Do not send raw drafts or heldout material.

This is task-message delivery, not automatic Project Sources synchronisation.
Supported task tools do not upload Project Sources or reassign this lead's local
project. Do not bypass native app computer-control restrictions or edit its
internal state. Keith manually associated the preserved lead with the correct
project on 2026-09-10; the current cwd is now canonical. Continue using the explicit
canonical directory for repository operations. The ChatGPT website's supported
browser UI was used to save/verify docs/CHATGPT_PROJECT_INSTRUCTIONS.md and add
an initial CHATGPT_CONTEXT.md.txt source. These are dated copies, not automatic
sync; use live GitHub reads when available or explicitly replace the allowlisted
source at a milestone. Never upload the whole repository or reserved material.

Use a single foreground execution goal for the build; do not create scheduled
polling merely to keep work running. Continue useful engineering while human tester
recruitment or hosting is blocked. Do not call the full goal complete while a
required hosted preview is still outstanding.
