# Communication Check — design exploration handoff

Prepared for Keith on 16 September 2026. Attach this file to the new chat.

## Request for the new chat

Help me explore how to improve the visual design and usability of Communication
Check. Act as a senior product designer with customer-success workflow experience.
Start from the working prototype described below. Review the actual current
interface before proposing changes, separate observed problems from preferences,
and give me two or three distinct, restrained design directions with a recommendation.
Show comparable desktop and narrow-panel concepts using the same fictional sample
and review state. Explain what each improves, its trade-offs and implementation
effort. Finish with a bounded implementation plan and a copyable Codex prompt for
the direction I choose. Exploration and disposable mockups are welcome; do not
change the working app or deploy it just because this handoff describes future work.

## Product and audience

Communication Check is a functional portfolio prototype for B2B SaaS account
managers and customer-success managers checking customer onboarding follow-up
emails before sending. Its purpose is a short, useful second look at next steps,
commitments and limited tone cues, while keeping the writer in control.

It is a static React/Vite app with local deterministic TypeScript rules. No model
runs behind it. It does not rewrite or send messages, verify agreements or facts,
score an email or assess arbitrary emotional context. Do not design an AI chat,
email inbox, analytics dashboard, account system or general writing assistant.

## Where the current work lives

- Canonical checkout: `/Users/keith/Documents/ChatGPT/communication-check`.
- Private repository: https://github.com/keithtgrehan/communication-check.
- Current follow-on branch: `codex/communication-check-tone-review`.
- Reviewed app baseline: `a5bb62b` (About and Video Demo pages); this handoff and
  README are a later documentation update on that branch. Verify current HEAD.
- PR #1 was already merged on September 11. Main is an older product version;
  use the follow-on branch for this exploration, not main or the old hosted site.
- Local checker: http://127.0.0.1:4173/.
- About: http://127.0.0.1:4173/#/about.
- Video: http://127.0.0.1:4173/#/video-demo.
- Local URLs only work on Keith's machine while its preview is running. A new
  cloud chat should use the screenshots below or ask for those attachments.
- The Render preview still serves September 11. Vercel is the intended next
  deployment step after review; no Vercel deployment has occurred.

For a local Codex session, inspect working directory, branch, remotes and changes
before edits. Preserve existing work, including the untracked `output/` directory.
Read `AGENTS.md`, `docs/PRODUCT_BRIEF.md`, `docs/PROGRESS.md` and current
`docs/FINDING_CONTRACT.md` (v7 at this handoff). Latest explicit user decisions
supersede older design instructions. Do not treat reference documents as fresh
authorisation to implement, merge, deploy or widen detection scope.

## Current experience and completed work

1. A warm off-white workspace, white editor, charcoal actions and muted teal
   selection/focus; sans-serif interface headings with selective serif draft text.
2. A compact introduction and empty editor with a paste invitation. Nine fictional
   scenarios are available: eight problem examples and one clean comparison.
   Picking a scenario alone does nothing to the draft. **Try a sample review**
   explicitly loads it and checks both lenses, opening its preferred tab.
3. **Clarity & commitments** shows at most three findings; optional **Tone cues**
   shows at most two. Each uses an exact original quote and a practical question.
   Pasted text is checked explicitly, rather than continuously.
4. **Edit this wording** selects the source text. **Keep as written** marks it
   reviewed, with **Undo**. Editing invalidates both reviews; copy uses current text.
5. Direct, Collaborative and Warm change existing tone questions immediately,
   preserving findings and decisions. These are question styles, not sensitivity.
6. Top-right links open **About Communication Check** and **Video Demo**. About
   explains what, why, for whom and how, based on the case study and README.
   Video has an honest forthcoming-walkthrough placeholder. A YouTube URL is
   still needed; no player or external thumbnail loads. Both pages link to the
   private repository README and disclose that access is required.
7. Internal navigation and browser history preserve draft/review state in memory.
   Reload clears it. The hidden editor is excluded from keyboard navigation.

One senior CSM's completed workbook feedback informed the examples and prompts.
This is expert content feedback, not a usability study or proof of accuracy.
The latest full local validation passed 451 engine tests, 10 scenario tests,
7 setup checks and 77 browser checks, plus typecheck/build/source guards.
Independent review found no actionable issues. These are engineering checks.

## Design preferences and questions to explore

Keith liked an earlier Mockup Canvas direction and Intercom's presentation, but
explicitly does not want a literal copy. The currently approved adaptations are
strong simple typography, light surfaces, clear hierarchy, restrained colour,
working demonstrations near the main action and details revealed when useful.
Retain an original identity; do not copy Intercom branding, illustrations or layout.

Explore hierarchy and spacing, editor/review balance, readable typography,
scenario discovery, treatment of findings/reviewed states, navigation and coherence
across the two information pages. Decide which changes solve an observed usability
problem and which simply offer a different aesthetic. Do not assume the current
interface is broken or that more decoration or a larger hero improves it.

The narrow in-app browser panel is a primary context, not an afterthought. Compare
320px and approximately 382px wide layouts with a 1440px desktop. Preserve the
first-visit sample flow with its action and initial result visible without hunting
or manual scrolling at the existing tested viewport sizes. Longer drafts and
About content may naturally scroll. Do not shrink type just to force everything
onto one screen. Include keyboard focus, enlarged text and readable contrast.

For each direction, show the empty state, a useful finding and a reviewed/Undo
state, plus how About and Video inherit the design. Prefer a small coherent token
set for colour, typography, spacing and borders over scattered cosmetic changes.

## Behaviours and evidence to preserve

- Preserve both lenses, exact evidence selection, Keep/Undo, independent tab
  decisions, instant style changes, edit invalidation and current-text copy.
- Use existing fictional demos and the real checker for any functional preview.
  Do not hard-code attractive results or make the clean control produce flags.
- Keep drafts/findings memory-only: no draft-bearing network, logs, analytics,
  browser storage or URLs. Do not introduce remote fonts/assets or embeds casually.
- Keep qualified empty results and finite coverage guidance easy to find. No
  general tone, production-reliability or validated customer-benefit claims.
- The original detection target failed across ten attempts; the latest reserved
  result was 4/12. No new model, parser research or evaluation round is requested.
- Avoid new application features, paid services or dependencies without a concrete
  need. No main merge, repository visibility change or deployment in exploration.

## Reference material

Read these from the follow-on branch, or request specific files if unavailable:

- `README.md`: current product and local-running overview.
- `docs/CASE_STUDY.md`: portfolio narrative and how the checker works.
- `docs/screenshots/README.md`: image index with dates and context.
- `docs/screenshots/2026-09-16-info-pages/`: newest header, About and Video views.
- `docs/screenshots/2026-09-16-expert-review/`: empty, sample, clarity, tone and
  reviewed states at desktop and narrow widths. Use these for workflow detail;
  the info-pages screenshots show the newer navigation.
- `web/src/App.tsx`, `web/src/InfoPages.tsx`, `web/src/styles.css`: current UI.
- `tests/browser/`: existing behaviour, first-visit and responsive acceptance tests.
- `docs/VERIFICATION.md`: validation evidence and limitations.

Optional local visual references (not required to begin):

- `/Users/keith/Documents/ChatGPT/communication-check/output/pdf/communication-check-case-study.pdf`
- `/Users/keith/Desktop/Shipping MVPs MD Sept 16th/Mockup Canvas.pdf`
- `/Users/keith/Desktop/Shipping MVPs MD Sept 16th/Intercom _ The only helpdesk designed for the AI Agent era.pdf`

These local references are not guaranteed to be attached or saved in a new chat's
Sources. Do not claim to have read them without access. Do not upload the repository,
review workbook, reserved examples or customer drafts to third-party design tools.

## Expected handback

Return a short evidence-based critique, two or three visual directions and a
recommended choice. Identify the few decisions Keith needs to make. After he
chooses, produce a small implementation plan and Codex prompt naming scope,
files, preserved behaviours and validation. Prefer refining this prototype to
rebuilding it. A later implementation should run relevant existing tests, inspect
desktop/narrow/200%-text states, and get independent review before user testing.
Video integration and Vercel deployment remain separately identified next steps.
