# Communication Check — Solutions Engineering conversation notes

Prepared 17 September 2026. Use the [frozen live app](https://communication-check.vercel.app/) and the standalone case study. These are presentation notes, not evidence of a customer implementation or seniority.

## Thirty-second introduction

“Communication Check explores a small customer-onboarding problem: a follow-up can leave ownership unclear or include a promise that needs confirmation. The writer reviews exact quotes and questions, keeps or edits the wording, then rechecks and copies. I directed the product scope and an AI-assisted build; agents implemented and ran documented checks. It is a working portfolio prototype with local rules, limited language coverage and unvalidated customer usefulness.”

The first-person summary reflects the contribution statement Keith confirmed on 17 September 2026.

## What to demonstrate

1. **Evidence and control:** **Edit this wording** selects the exact quote. **Keep as written** records a decision; **Undo** reverses it without rewriting.
2. **State correctness:** edits invalidate both lenses. Rechecks are separate; Copy uses the current draft. Style changes update tone questions while preserving valid findings and decisions.
3. **Architecture:** React holds page-memory state; finite TypeScript rules produce exact quotes and questions. Vite builds static assets hosted on Vercel. There is no checking backend or runtime AI model.

## Questions and grounded answers

**Who is it for, and what improved?** B2B SaaS AMs and CSMs reviewing onboarding follow-ups. The demonstration completes a review and a presenter-supplied revision. Clearer handoffs are a hypothesis; no saved-time, retention, revenue or risk-reduction result was measured.

**What was your contribution?** “I set the product direction, audience, scope and presentation priorities and directed the AI-assisted build. Codex/Astra agents implemented the application and ran the documented engineering checks.” Keith confirmed this wording on 17 September 2026. Add personal coding, testing or research only when you can substantiate it.

**How does it work?** The unchanged source string and original offsets support exact evidence selection. Clarity returns up to three prompts; Tone cues up to two. Limited patterns and suppressions recognize some qualifications, quotes and signatures. They do not understand the whole conversation. Direct/Collaborative/Warm adjusts question wording, not detection sensitivity.

**Why local rules instead of an LLM?** They make this bounded prototype inspectable and avoid remote inference or model downloads. The cost is limited coverage and nuance. Local and cloud models were deferred, not benchmarked and rejected. A useful future comparison would need a specific user problem and separate approval.

**What does “stays in the browser” mean?** Drafts and findings remain in page memory. The host receives static page requests. Explicit Copy writes to the OS clipboard, which may follow the user's clipboard-sync settings. Reload clears state; checks work offline after assets load. This is not an installed offline app or a promise about every browser extension/device.

**What evidence supports privacy?** The 16 September 81-check hosted record includes fictional runtime network, URL, log, storage, reload and offline checks. The six live assets matched that manifest again on 17 September. This package's bounded smoke check did not rerun the complete privacy-canary suite.

**Why do passing tests coexist with weak detection?** Regression tests check known behaviors. All ten original reserved fictional evaluations missed the target; the latest detected 4/12 selected issues. Those small sets are not estimates of real-world accuracy. No flags is not approval of facts, agreements or recipient response.

**What did the CSM review prove?** One senior CSM gave 21 overlapping workbook decisions and 12 comments on fictional example content. That informed bounded sample/question fixes. It was not an observed usability session, pilot or benchmark. The records still show 0/3 usability sessions and 0/5 repeat-use pilots.

**What is the SE relevance?** It gives me a concrete customer problem to explain, a workflow to demonstrate and architectural tradeoffs and objections to discuss honestly. It does not prove enterprise deployment, integration expertise or a job level.

**What is the RevOps relevance?** Thinking about handoff quality, owners and commitment dependencies. It does not demonstrate CRM administration, pipeline analytics, a production revenue system or a HubSpot integration. No vendor endorsement is implied.

**Was everything built from scratch?** No such claim. Agents wrote the product implementation. Six Vibe Signal source files remain inactive references; v0 and Replit/Canvas references informed presentation without importing their generated scaffold or analysis handler. React, React DOM and Scheduler retain their notices. See the reuse ledger for details.

**What next?** Learn whether real AMs/CSMs find the review step useful enough to return to it. Do not claim sessions, pilots or comparative model testing have happened.

## Evidence to keep available, not recite

- **16 September record:** 451 engine + 10 scenario tests, seven setup checks, build/typecheck/source guards, 81 local and 81 hosted Chromium checks.
- **Earlier 17 September assessment:** 461 Vitest tests, no-emit TypeScript and selected integrity rechecks.
- **17 September packaging:** six live hashes, desktop/390px flow, Keep/Undo, exact selection, style change, invalidation, separate rechecks and current-text copy.
- All ten original reserved evaluations failed; V10 4/12. One expert content review; no completed usability sessions or pilots.

These dates and scopes matter. The package is not a fresh full test-suite or production-reliability claim.

## Preparation and status

Use the four-minute script for the full story and the 75-second version for a short introduction. Rehearse the no-flags caveat and the LLM objection. The technical flow has been checked; Keith's contribution is confirmed; his spoken rehearsal remains pending.

Materials are prepared locally. No publishing, deployment, Git commit/push/merge, recording, upload or outreach occurred in this packaging pass.
