# Communication Check

**A clearer message. Still your voice.**

A private portfolio MVP for B2B SaaS account managers and customer-success managers
reviewing customer onboarding follow-up emails. Paste a draft or choose one of
three fictional examples, check exact wording, edit, recheck and copy.

Clarity & commitments provides up to three review prompts for unclear ownership,
vague timing, competing requests, agreement wording and strong product commitments.
The September 16 local update adds optional Tone & warmth: up to two wording cues
with a chosen Direct, Collaborative or Warm review preference. Edit this wording
selects the exact text; Keep as written marks Reviewed with Undo. The writer keeps
the decision. The app does not verify facts/agreements, rewrite, score or send email.

## Current evidence

The September 16 follow-on is implemented locally on
`codex/communication-check-tone-review`; it has not been deployed. Fresh validation
passes 307 engine tests (225 clarity + 82 tone), seven setup checks, the production
build/typecheck/source guards and 43 browser tests. See [progress](docs/PROGRESS.md)
for the completed independent review and [local screenshots](docs/screenshots/README.md).

The September 11 hosted version is a functional portfolio prototype. At delivery,
that reviewed implementation passed
225 engine tests, seven setup/integrity checks, build/typecheck and 28 local browser
checks. The [working preview](https://communication-check-preview.onrender.com)
serves the September 11 version. Its 28 hosted checks passed and all six assets
matched its local build at that verification. See the
[case study](docs/CASE_STUDY.md) and [portfolio copy](docs/PORTFOLIO_COPY.md).

Detection remains experimental: the latest reserved fictional set detected 4/12
selected issues, and all ten attempts missed the original target. Keith prioritised
shipping the polished prototype; the deeper parser experiment has been cancelled
for this delivery. No production-reliability or human-validation claim is made.
See [progress](docs/PROGRESS.md), [evaluation](docs/EVALUATION.md) and
[verification](docs/VERIFICATION.md) for the current evidence and its limits.
[PR #1](https://github.com/keithtgrehan/communication-check/pull/1) merged on
September 11. The follow-on branch starts at main `b22bcfd`; deployment, another
merge and public launch are outside this implementation slice.

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
- [Screenshots](docs/screenshots/README.md), [case study](docs/CASE_STUDY.md), [75-second demo script](docs/DEMO_SCRIPT.md), [SE conversation notes](docs/SE_CONVERSATION_NOTES.md), [human validation protocol](docs/HUMAN_VALIDATION.md) and [hosting/rollback](docs/HOSTING.md).

The authoritative root is `/Users/keith/Documents/ChatGPT/communication-check`.
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
