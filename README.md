# Communication Check

**A focused review of customer follow-ups before they are sent.**

After a discovery call, partner handoff or renewal discussion, a follow-up needs to
make the next step clear: who owns it, when it happens and what still needs approval.
Communication Check turns selected wording into practical questions for the writer
to consider. It is a working portfolio prototype for B2B SaaS sales, account and
partner-facing teams, directed by Keith Grehan.

**[Open the live demo](https://communication-check.vercel.app/)** — no sign-in required.

## Try it in two minutes

1. Leave **Partner handoff** selected and click **Try an example**. Both checks run
   on a fictional message using the same rules as a pasted draft.
2. Read the finding for “Someone should send the meeting invite.” The question,
   “Who needs to do what next?”, connects the wording to a familiar co-selling issue.
3. Select **Edit this wording** to highlight the exact passage. Assign an owner
   yourself, then **Recheck draft**. Alternatively, **Keep as written** records your
   decision without changing the message; **Undo** reverses it.
4. Try **Renewal discussion** and switch between **Clarity & commitments** and
   **Tone cues**. Finish with **Copy draft** to copy your current wording.

The catalogue has 13 fictional examples, including discovery, partner handoffs,
renewals, onboarding dependencies and clear follow-ups. Selecting an example alone
leaves your draft untouched; loading one asks before replacing your own wording.

## What works

| Capability | What the reviewer can see |
| --- | --- |
| Clarity & commitments | Up to three findings for supported patterns involving unclear actions or owners, vague timing, competing requests, agreement wording and strong product commitments. |
| Optional Tone cues | Up to two findings for a limited set of blaming, dismissive, judgmental or pressuring phrases. |
| Exact evidence | Each finding quotes the original wording and offers a focused review question; editing selects that passage in the draft. |
| Writer decisions | Keep/Undo tracks reviewed wording. The writer makes every edit; the app never rewrites or sends a message. |
| Question styles | Direct, Collaborative and Warm change the tone-review questions immediately, preserving findings and decisions. They do not change detection sensitivity. |
| Current-text review | Each lens retains its own results. Editing clears both reviews so old findings cannot appear to describe new wording. Copy always uses the current draft. |
| Browser workspace | A responsive monochrome interface, keyboard controls and navigation that retains the draft during the session. |
| Local checking | Drafts and findings stay in page memory. Reloading clears them; checks work offline once the app's assets have loaded. |

## Keith's contribution

> I set the product direction, audience, scope and presentation priorities and
> directed the AI-assisted build. Codex/Astra agents implemented the application
> and ran the documented engineering checks.

Keith drew on his experience in SaaS sales and partner coaching to define the
problem and shape a demonstrable workflow. The project offers concrete discussion
points for senior commercial roles: clarifying ownership across vendor, partner
and customer teams; separating a proposal from an agreement; and checking the
conditions behind a product promise.

The contribution is product direction and delivery through AI-assisted development.
**The running checker uses deterministic TypeScript rules, not an AI model.**
The [confirmed contribution statement](docs/PORTFOLIO_COPY.md#confirmed-contribution-statement)
records the attribution used throughout the portfolio.

## Why this scope

| Decision | Reason |
| --- | --- |
| Focus on the follow-up | A small, recognisable commercial task makes the product easy to explain and demonstrate from start to finish. |
| Ask questions tied to exact quotes | The writer can inspect the evidence and supply the meeting context the tool does not have. |
| Keep findings short and bounded | A few review decisions keep the workflow manageable; there is no overall score implying a complete assessment. |
| Keep editing and sending with the writer | Ownership, approvals and commitments remain human decisions. |
| Use local rules and session memory | The standalone checker needs no account, checking service or draft database. Behaviour is inspectable, with deliberately limited language coverage. |
| Defer model-based review | Completing the focused workflow took priority. A local model would add downloads and device-dependent behaviour; a cloud model would change the data boundary. Neither was comparatively benchmarked. |
| Demonstrate the CRM handoff separately | A small HubSpot/n8n example shows retrieval and writeback while preserving the checker's simple, standalone design. |

## HubSpot + n8n demonstration

A separate demonstration uses a fictional contact and a real CRM workflow:

**HubSpot source note → n8n retrieval → manual review in Communication Check →
n8n save form → new HubSpot note.**

The presenter copies the draft into the checker, edits and rechecks it, then copies
the revision into a local authenticated form. The result is a separate note labelled
“reviewed draft — not sent”. The recorded verification confirmed the revised text,
correct contact association and unchanged source note. No email is sent.

n8n connects to HubSpot; Communication Check has no direct CRM connection. HubSpot
and local n8n retain the fictional demo content, so this complete workflow has a
different data boundary from the standalone checker. The
[setup, walkthrough and sanitised exports](docs/demo/hubspot-n8n/README.md) explain
that boundary. The live **Video Demo** page describes the flow; a recording is not
yet available.

## Evidence and scope

The [13 October release record](docs/PROGRESS.md) documents 466 engine/example tests,
eight setup checks, build/type checks and 94 local Chromium browser checks for the
monochrome release, followed by focused public workflow checks. The subsequent
information-page update has its own recorded verification. These records cover
implemented behaviour; they do not establish general language accuracy or measured
customer impact.

The checker is a second look at selected wording, with the writer supplying context
and making the decision. Its rule coverage is deliberately limited. See the
[finding contract](docs/FINDING_CONTRACT.md), [evaluation record](docs/EVALUATION.md)
and [release evidence](docs/PROGRESS.md) for methods and scope.

The standalone app uses page memory with no remote model, draft database or
analytics. Hosting still receives ordinary page requests; copying uses the OS
clipboard and its settings. The separate CRM demonstration retains fictional data
in HubSpot and local n8n.

## Run locally

Use Node **22.23.1** (see `.node-version`) and npm:

```sh
npm ci
npm run dev
```

For the production build and preview:

```sh
npm run build
npm run preview
```

Open [the local preview](http://127.0.0.1:4173). Production privacy checks use this
preview; development mode also uses Vite's local update connection.

```sh
npx playwright install chromium
npm run validate
```

`validate` runs setup/integrity checks, engine tests, TypeScript/build checks,
source/bundle guards and the Chromium browser suite. Tests use fictional data.

## Further reading

- [Product brief](docs/PRODUCT_BRIEF.md) — audience, product contract and scope.
- [Current progress](docs/PROGRESS.md) — latest release and verification evidence.
- [September case study](docs/CASE_STUDY.md) — original workflow and architecture decisions; its screenshots predate the current workspace.
- [CRM demo](docs/demo/hubspot-n8n/README.md) — the separate HubSpot/n8n walkthrough.
- [Reuse ledger](docs/REUSE_LEDGER.md) and [third-party notices](THIRD_PARTY_NOTICES.md) — attribution and dependency notices.

The live demo is the primary portfolio destination; this public repository provides
the supporting code, product decisions and review evidence.
