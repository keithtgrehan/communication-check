# Communication Check

**Review your customer follow-up.**

A portfolio prototype for B2B SaaS account managers and customer-success managers
reviewing customer onboarding follow-ups. It helps you take a second look at
unclear next steps, commitments and a limited set of tone cues before sending.

Paste your draft or try a fictional sample. Each finding quotes the exact wording
and asks a practical review question. Edit the text, or keep it with an option to
undo. You decide what to change; nothing is rewritten or sent automatically.

Clarity & commitments provides up to three review prompts for unclear ownership,
vague timing, competing requests, agreement wording and strong product commitments.
The September 16 update adds optional Tone cues: up to two findings for
supported accusation, judgmental, dismissive and pressure wording. A chosen
Direct, Collaborative or Warm preference changes the review question, not which
wording is detected. Switching style updates checked prompts immediately and preserves
review decisions. Choose a fictional scenario, then use **Try a sample review**
to run both checks beside the invitation to paste. The editorial refinement
uses a white draft document and open review column on a warm paper canvas, with
sans-serif headings and serif source quotations. Selection alone never replaces a draft. Edit this wording
selects the exact text; Keep as written marks Reviewed with Undo. The writer keeps
the decision. The app does not verify facts/agreements, rewrite, score or send email.

## Frozen live version

Use **[Communication Check](https://communication-check.vercel.app/)**.
The accepted version is frozen on `codex/frozen-vercel-2026-09-16` at `1463832`.
All subsequent work starts on the forked `codex/communication-check-next` branch;
production changes require explicit approval. The Prism alternative is preserved
separately. See [freeze record](docs/FROZEN_BASELINE.md).

## Current evidence — 23 September 2026

The frozen editorial app is live at [communication-check.vercel.app](https://communication-check.vercel.app/).
Deployed source is `38d744d`; the frozen branch is `codex/frozen-vercel-2026-09-16`
at `1463832`. Current documentation work uses `codex/communication-check-next`, starting at
`b6942a8`; its tracked web source matches the deployed and frozen versions.
The Prism alternative remains on `codex/communication-check-tone-review`.

The **16 September verification record** reports 451 engine tests, 10 scenario
tests, seven setup checks, build/typecheck/source guards and 81 local browser
checks; all 81 hosted Chromium checks passed too. See
[Vercel evidence](docs/VERCEL_HOSTED_VERIFICATION.json) and [progress](docs/PROGRESS.md).
The earlier **17 September assessment** reran 461 Vitest tests, TypeScript no-emit
and selected integrity checks. This **17 September packaging pass** rechecked all
six live asset hashes and the bounded desktop/390px demo workflow. It did not
rebuild the app or rerun the complete hosted/privacy suite.

[The case study](docs/CASE_STUDY.md), [portfolio copy](docs/PORTFOLIO_COPY.md),
[four-minute and 75-second demo scripts](docs/DEMO_SCRIPT.md) and
[selected screenshots](docs/screenshots/README.md) now describe the frozen version.
The standalone PDF and selected exports are prepared locally in
`output/portfolio-package-2026-09-17/`. Keith confirmed the contribution wording on 17 September;
the spoken rehearsal remains pending. Nothing was published or
deployed by the packaging pass.

Detection remains experimental: all ten original reserved fictional evaluations
missed the target, and V10 detected 4/12 selected issues. Known-case passes do not
establish general language accuracy. One expert reviewed fictional workbook
content; completed usability sessions remain 0/3 and repeat-use pilots 0/5.
See [evaluation](docs/EVALUATION.md) for preserved methods and aggregate results.

Read-only GitHub checks on 17 September confirmed the repository is private,
[PR #1](https://github.com/keithtgrehan/communication-check/pull/1) merged September 11,
and [PR #2](https://github.com/keithtgrehan/communication-check/pull/2) and
[PR #3](https://github.com/keithtgrehan/communication-check/pull/3) merged September 16.
GitHub main was `b508df3`, with the same tracked web tree as the frozen app.
No Git mutation was performed for this package.

The [September 11 Render preview](https://communication-check-preview.onrender.com/)
and [its verification](docs/HOSTED_VERIFICATION.json) are historical.
The [design exploration handoff](docs/DESIGN_EXPLORATION_HANDOFF.md) is also a
historical input; the subsequently accepted editorial direction is documented in
[editorial refinement evidence](docs/EDITORIAL_REFINEMENT.md). Neither is a new
implementation instruction. The frozen Vercel link is the portfolio destination.

## HubSpot + local n8n demonstration — 23 September

A real fictional CRM demonstration is verified: n8n loads a HubSpot source note,
the presenter manually reviews/edits/rechecks in the unchanged checker, and a
local authenticated form saves a new note labelled “reviewed draft — not sent”.
HubSpot readback confirmed the correct contact, revised wording and unchanged
source. No email is sent. The bridge into the checker is manual.

[Demo setup, three-minute walkthrough and sanitized workflow exports](docs/demo/hubspot-n8n/README.md)
are included. HubSpot and local n8n history retain fictional content; the complete
CRM workflow is not browser-only. Credentials stay outside Git. This adds no
backend, import/save buttons or deployment to the frozen application.

The next portfolio step is Keith’s rehearsal and recording. Video upload, adding
its link to the frozen site, and public portfolio publication remain separate
steps. User testing is future product validation, not a blocker for this demo.

## About and walkthrough

The top-right navigation opens **About Communication Check** (`/#/about`) and
**Video Demo** (`/#/video-demo`). About explains the audience, purpose, workflow
and limits, with a labelled fictional illustration matching a real checker result.
Video Demo offers a compact forthcoming-video notice and a static three-step
walkthrough; no video or third-party player is loaded yet.

Moving between these pages preserves the draft and review decisions in memory.
Reloading clears them. Both pages link to this README. The repository is currently
private, so visitors need repository access to follow that link. Page navigation
uses URL fragments and needs no hosting rewrite or additional routing dependency.

## Run locally

Use Node 22.23.1 (recorded in `.node-version`) and npm. From this checkout:

```sh
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:4173. For development, use `npm run dev` instead. Development
mode permits Vite's local update connection; privacy acceptance is run against the
production build served by `npm run preview`, with connections blocked by policy.

## Verify

```sh
npx playwright install chromium
npm run validate
npm audit --audit-level=low
```

`validate` runs repository/setup and engine-integrity tests, engine unit tests, TypeScript/build
checks, source/bundle guards and the Chromium browser suite. On a Linux machine
without browser system dependencies use `npx playwright install --with-deps chromium`.
To verify a hosted candidate after building the matching checkout:

```sh
PREVIEW_URL=https://YOUR_VERIFIED_PREVIEW_HOST npm run verify:hosted
PREVIEW_URL=https://YOUR_VERIFIED_PREVIEW_HOST npm run test:browser
```

The browser suite uses only fictional canaries and reports under ignored local
folders. Reserved evaluation material is outside project sources and ordinary
handoffs. It is not required for normal developer tests. Its frozen methodology,
all heldout attempts and aggregate outcomes are recorded separately.

## Privacy and limitations

Drafts and findings stay in page memory. There is no remote model, API, analytics,
feedback collection or draft persistence. Production policy blocks connections;
runtime checks inspect requests, logs, URLs and storage. The host still receives
ordinary static page requests. Copy explicitly writes the current text to the OS
clipboard, which may follow the user's own clipboard-sync settings. Reload clears
the editor. Offline checking works after the assets are loaded; there is no
installed offline application or service worker.

Rules are English wording patterns. They can miss unfamiliar phrasing and unknown
quote/signature formats or flag wording that is appropriate in context. The app
recognises some, not every, quoted-history format. It cannot know the call's facts
or approvals. No flags is not an endorsement. The 12,000-character limit uses
UTF-16 units; emoji can count as two. Oversize text is retained for editing.

Automated Chromium viewport/zoom checks are not physical-device tests or a full
accessibility certification. Fictional agent labels are engineering evidence,
not real-world accuracy. Human sessions and pilots are outstanding.

## Architecture decision: defer model-based review

Communication Check uses local, deterministic checks to keep drafts in the browser
and provide findings tied to exact wording.

Browser-based AI could broaden language coverage, but would introduce model
downloads, device-dependent performance and additional validation work. Cloud
models would require changing the browser-only data boundary.

For this portfolio release, I prioritised completing and demonstrating the existing
workflow. Model-based review remains a future option if user feedback identifies a
specific limitation worth addressing. No candidate model was benchmarked or
rejected on measured performance grounds.

## Project and review materials

- [Product brief](docs/PRODUCT_BRIEF.md) and [implementation plan](docs/IMPLEMENTATION_PLAN.md).
- [Working instructions](AGENTS.md), [GPT/Codex workflow](docs/WORKFLOW.md) and [goal prompt](docs/GOAL_PROMPT.md).
- [Finding contract](docs/FINDING_CONTRACT.md), [reuse ledger](docs/REUSE_LEDGER.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
- [Screenshots](docs/screenshots/README.md), [case study](docs/CASE_STUDY.md), [four-minute and 75-second demo scripts](docs/DEMO_SCRIPT.md), [SE conversation notes](docs/SE_CONVERSATION_NOTES.md), [human validation protocol](docs/HUMAN_VALIDATION.md) and [hosting/rollback](docs/HOSTING.md).

The authoritative root is `/Users/keith/Developer/communication-check`.
`reference/vibe-signal/` contains six audited inactive source blobs; it is not
part of the application. New product source, demos and fixtures were written
independently. No public product licence has been selected.

## Milestone handoffs

`npm run setup` installs repository-local hooks while preserving existing hooks.
Each local commit refreshes `.handoff/CHATGPT_CONTEXT.md` from exactly the brief and
sanitised progress. `npm run handoff` also refreshes it; generation sends nothing.
At verified milestones the lead sends that packet to the existing product-companion
task. The one-time ChatGPT project instructions and initial source were saved;
Project Sources are dated copies, not continuous synchronisation. Prefer current
GitHub brief/progress reads when available. Never upload the whole repository or
reserved examples into shared project context.
