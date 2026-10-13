# Communication Check working instructions

## Approved production update — 2026-10-13

Keith explicitly approved the reviewed monochrome/all-13-example candidate for
the main site. Release source `ffba4d1` on `codex/communication-check-next` is live
at https://communication-check.vercel.app/, deployment
`dpl_FKXFku3G4FyNkykStfjFtFXELKiQ`. This supersedes the September production freeze
for this release only. Keep the frozen baseline and Prism branches intact;
the former production deployment remains the rollback target. No main merge,
new spending or further release is authorised by this completed approval.

## Frozen production decision — 2026-09-16

Keith chose https://communication-check.vercel.app/ and froze that version.
The frozen branch is `codex/frozen-vercel-2026-09-16` at `1463832`;
its application source is the deployed `38d744d` (identical web tree).
All subsequent changes belong on `codex/communication-check-next` or an explicitly
approved branch forked from the frozen baseline. Do not change the frozen branch,
main, production alias or deployment without a new explicit instruction.
The Prism experiment remains preserved on `codex/communication-check-tone-review`
at `2527641`; do not promote it or discard it. This decision supersedes older
implementation-branch and deployment directions below.

## Start and authority

Canonical root: `/Users/keith/Developer/communication-check`.
Keith approved migration here on 2026-10-13. The former Documents path is only
a compatibility symlink for existing chats; use this local-only root for future
work. The fully verified original is recoverable in Trash. Linked worktrees were
repaired and retain their prior HEADs and local changes.
Repository: `keithtgrehan/communication-check`, private.
Implementation branch: `codex/communication-check-next` (forked from the frozen live baseline).
Lead task: `01a08ae3-d0b5-7633-846b-28bfb692e8fb` (Build and ship Communication Check).
Product companion: `01a08ae3-9641-7cc3-8e2f-6c09b6efd2e4` (Review onboarding email examples).

Read docs/PRODUCT_BRIEF.md and docs/PROGRESS.md first; read the implementation
plan and workflow when needed. Inspect Git status, branch and remotes before edits.
The current setup is user-authorised. The initial baseline on main is complete;
all further implementation commits/pushes belong on the implementation branch.
Do not recreate the repository, import the source again or discard existing work.
PR #1 was merged September 11; do not reopen or reuse it. The September 16
follow-on starts from main b22bcfd on a new branch, preserving the original branch.

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

**September 16 third-review polish:** Keith approved execution of the Mockup Canvas
visual/review-flow plan. Follow finding contract v4. Style changes remap existing
tone prompts instantly, preserving findings and decisions, without running a new
check. Text mutations still invalidate both lenses. Neutral/charcoal editorial
panels and compact review queue supersede earlier plum styling. Scope is local
presentation/state polish, meaningful tests, fresh independent review and updated
screenshots/case-study PDF; detection rules and privacy requirements remain.


**September 16 first-review correction:** Keith approved the bounded plan to
rename the lens Tone cues, explain its coverage upfront, add one real-engine
fictional tone example, and extend only the finite patterns in finding contract
version 3. This supersedes the earlier three-family-only tone scope. Use disjoint
interface/engine agents and fresh independent review; update case study/PDF.
Clarity remains unchanged. No model, general language research, reserved round,
deployment or merge is part of this correction.

**September 16 approved update:** Keith explicitly started the updated Desktop
implementation handoff/build prompt. Build the Canvas3 composition in the existing
app, with optional local tone review, chosen Direct/Collaborative/Warm intent,
exact evidence selection, keep/undo and per-lens result snapshots. Read
`docs/FINDING_CONTRACT.md` for current ownership and behavior. These instructions
supersede earlier conflicting design/state instructions, not privacy/claim limits.
This slice is local only: no deployment, merge, public launch, spending or outreach.
After implementation/validation, spend approximately one hour refining How it
works in the existing case study. No extra app screen, model or NLP research.
Use two disjoint Astra High implementation workers and a fresh Astra Extra High
reviewer after integration; do not begin new reserved evaluation rounds.

Keith's latest delivery direction (2026-09-10) is to ship quickly for portfolio
presentation. Deliver the existing reviewed app as a polished functional prototype;
stop the deeper semantic experiment and new evaluation rounds. The original
detection gate remains failed, with all ten results preserved, and is no longer
a blocker for this user-revised portfolio delivery. Never report that it passed
or claim production-level reliability. Keep functional, visual, privacy, reviewed
preview and portfolio-material checks. Do not restart parser/evaluation research
without a new request. Public launch, main merge and spending boundaries remain.

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
implementation plan's current delivery override and exact gates. Detection
limitations are explicitly retained for the portfolio prototype; resolve serious
functional, privacy or interface defects before delivery.

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
