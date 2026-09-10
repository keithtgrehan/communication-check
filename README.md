# Communication Check

**Check your customer follow-up before you send it.**

A private portfolio MVP for B2B SaaS account managers and customer-success managers
reviewing customer onboarding follow-up emails. Paste a draft or choose one of
three fictional examples, check exact wording, edit, recheck and copy.

The app provides up to three review prompts for unclear ownership, vague timing,
competing requests, agreement wording and strong product commitments. You decide
whether to use or dismiss each prompt. It does not verify facts or agreements,
rewrite the draft, assign a score or send email.

## Current evidence

The app is implemented and the local workflow passes browser verification.
Engine coverage repair and fresh reserved evaluation are still in progress; the
first four reserved runs did not meet the detection gate. The [working preview](https://communication-check-preview.onrender.com) is live; all 19 hosted browser checks pass.
See [progress](docs/PROGRESS.md), [evaluation](docs/EVALUATION.md) and
[verification](docs/VERIFICATION.md) for the current evidence and its limits.
The [existing draft PR](https://github.com/keithtgrehan/communication-check/pull/1)
stays on `codex/communication-check-mvp`; no merge or public launch is authorised.

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

`validate` runs six repository/setup tests, engine unit tests, TypeScript/build
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

## Project and review materials

- [Product brief](docs/PRODUCT_BRIEF.md) and [implementation plan](docs/IMPLEMENTATION_PLAN.md).
- [Working instructions](AGENTS.md), [GPT/Codex workflow](docs/WORKFLOW.md) and [goal prompt](docs/GOAL_PROMPT.md).
- [Finding contract](docs/FINDING_CONTRACT.md), [reuse ledger](docs/REUSE_LEDGER.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
- [Screenshots](docs/screenshots/README.md), [case study](docs/CASE_STUDY.md), [75-second demo](docs/DEMO_SCRIPT.md), [human validation protocol](docs/HUMAN_VALIDATION.md) and [hosting/rollback](docs/HOSTING.md).

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
