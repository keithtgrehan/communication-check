# Communication Check progress

Updated: 2026-09-16
Milestone: local Canvas3/tone/review delivered; independent review complete
Status: 7 setup + 307 engine + 43 browser checks pass locally; hosted preview unchanged

## September 16 follow-on

- Two Astra High workers completed disjoint UI and tone changes. Lead integrated and ran npm run validate: 7 setup + 307 engine (225 clarity/82 tone) + 43 browser checks, production build/typecheck/source guards all pass. Real screenshots cover 1440/1024/390/320px, exact selection, mobile editor/results, enlarged text and 200% zoom. Fresh Astra Extra High final review found no actionable issues: 82 tone + 26 targeted browser checks, additional state/clipboard probes, and desktop/mobile/enlarged visual inspection passed. Review is bounded engineering evidence, not human validation.
- Case-study How it works refinement is complete after validation: diagram/text fallback, 220-word explanation and verified fictional engine example. Source-to-quote behavior, limited context checks, AI-assisted development versus runtime, privacy and known limitations are explicit.

- Keith explicitly started implementation using the latest Desktop implementation handoff/build prompt; these supersede conflicting earlier scope/workflow notes.
- Verified canonical root/remote and clean original checkout at 40d7c0b. Fetched main b22bcfd465dcc0489d21682a446af1321ce7d242; PR #1 merged September 11. Main has the same file tree as the original checkout.
- Created codex/communication-check-tone-review from origin/main; original branch preserved. Initial validate stopped at the obsolete branch-name guard. Unchanged product baseline then passed 7 setup unit checks, 225 engine tests, build/typecheck/guards and 28 browser tests on September 16.
- Updated the branch guard to the specifically authorized follow-on branch; main/wrong-repository/tag/deletion restrictions remain. Shared snapshot/intent/finding contracts and disjoint UI/tone ownership are in docs/FINDING_CONTRACT.md. Extracted existing history/signature masking without changing its implementation.
- Scope: Canvas3 composition, local optional tone review, exact selection, keep/undo and snapshot invalidation. After validation, approximately one hour refining How it works in the existing case study. No model/API, extra app screen, parser research, new evaluation round, deployment, launch, merge or spending.
- Both Markdown briefs and the reference ZIP were added to ChatGPT Project Sources and verified after reload September 16. This is a dated source upload, not continuous synchronization.

## September 11 delivered baseline

- [x] v0 direction reviewed — one proposal and one focused revision, using existing $5 monthly credit with v0 Mini. Only three fictional screenshots and design brief supplied; no purchase or repository connection.
- [x] Presentation integrated — monochrome layout, 16px draft/body, 14px secondary text, 44px controls and 880px stacking; engine and original handlers preserved.
- [x] Local checks and fresh independent review — 7 setup + 225 engine + 28 browser checks pass. Fresh Astra review found no material issues; focused checks at 320/880/881/1440px passed.
- [x] Preview updated and verified — dep-dai10kbm8hqs73dnm68g, live 2026-09-11 14:29:50 UTC at 4931fe2f8968b0447c5e2872e520306aa0bb74b7; all 28 hosted checks pass.
- [x] Portfolio materials ready — three verified hosted screenshots, Featured title/description/link/thumbnail, updated case study with all ten results, demo script and SE notes. Recording deferred.

## September 11 hosted delivery (unchanged)

- Canonical root: /Users/keith/Documents/ChatGPT/communication-check.
- Private repository: https://github.com/keithtgrehan/communication-check. Branch: codex/communication-check-mvp. PR #1: https://github.com/keithtgrehan/communication-check/pull/1; merged September 11; follow-on branch above.
- Working preview: https://communication-check-preview.onrender.com. Render deployment dep-dai10kbm8hqs73dnm68g, live 2026-09-11 at 14:29:50 UTC from checkout 4931fe2f8968b0447c5e2872e520306aa0bb74b7. Later delivery edits are documentation/screenshots only.
- Static React/Vite editor: five check families, up to three exact quotes, dismissal, edit/recheck, current-text copy, reset and three fictional demos. No rewriting, sending, scores or factual/agreement verification.
- Reviewed runtime from d1230d6d066bc4a8eef9aa08d7818c1404d09c04; complete six-module manifest 6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125.
- Seven setup/integrity tests, 225 public engine tests, build/typecheck and 28 local browser checks pass. Independent review cleared five original regressions and 20 focused probes. Original 18 development fixtures are unchanged.
- All 28 hosted Chromium checks pass. Six assets match the local build byte-for-byte; six response headers and eight source/config exclusions pass. See docs/HOSTED_VERIFICATION.json and docs/VERIFICATION.md.
- Browser coverage includes exact evidence, editing/dismissal, clipboard success/denial, keyboard, 320/390/1440px layouts, 200% content zoom, runtime network/storage/log canaries, reload clearing and offline use. Automated checks are not physical-device testing or accessibility certification.
- Portfolio case study, reusable project copy, desktop/mobile/clean screenshots, 75-second demo script, SE conversation notes, README, reuse ledger, third-party notices, human-validation protocol and rollback instructions are ready. The screenshots use fictional demos and were visually inspected. Six pinned inactive Vibe source blobs remain unchanged and excluded from runtime.

## Preserved portfolio/accuracy decision

Keith asked to “put focus on shipping quickly, it just has to look good on portfolio”.
The existing reviewed app is delivered as a functional portfolio prototype. The
original detection requirement remains unmet; it is no longer a gate for this
explicitly revised delivery. Do not represent this as passing the original goal's
full accuracy requirement, production reliability, customer benefit or human validation.

The deeper semantic experiment and further evaluation rounds are stopped. No
prototype implementation or 60-case challenge creation/freeze/execution occurred.
No v11 is authorised. Keep the failure history for future product-readiness work.

## Detection evidence retained

All ten reserved attempts failed the original target of at least 10/12 selected
findings. Labels, matching criteria, thresholds and raw historical results remain
unchanged. Full aggregate history: docs/EVALUATION.md.

| Reserved attempt | Expected findings detected | Useful emissions | Clean-control flags |
| --- | --- | --- | --- |
| V1 | 9/12 | 9/10 | 1 |
| V2 | 4/12 | 4/4 | 0 |
| V3 | 6/12 | 6/6 | 0 |
| V4 | 6/12 | 6/6 | 0 |
| V5 | 7/12 | 7/7 | 0 |
| V6 | 6/12 | 6/6 | 0 |
| V7 | 6/12 | 6/6 | 0 |
| V8 | 8/12 | 8/8 | 0 |
| V9 | 5/12 | 5/5 | 0 |
| V10 | 4/12 | 4/4 | 0 |


- Latest v10 ran once on d1230d6 at 15:48:01 UTC after its prior independent freeze. All source/corpus/span/cap/error checks passed; the contract audit judged all twelve labels and four controls within scope. No relabelling or retry occurred.
- Fixed development benchmarks pass 100/100 and 80/80. Consumed v1–v9 reaches 107/108 expected and 107/107 useful emissions, with zero flags across 36 clean controls. These are known-case results, not fresh generalisation evidence. Agent labels are not human validation.
- Reserved material and private diagnostics remain outside shared sources and handoffs. Human usability: 0/3; pilots: 0/5. No outreach or fabricated feedback.

## Workflow and boundaries

- The lead is associated with the correct local project; use the canonical root explicitly. Native app self-control restrictions remain in place.
- ChatGPT project instructions are saved. The original brief/progress Sources snapshot is dated 2026-09-10 16:28 UTC; the two new briefs and reference ZIP were added September 16. A September 16 baseline brief/progress packet was delivered to the existing companion task, whose acknowledgement turn completed. Task delivery is not Sources synchronization.
- Refreshed 2026-09-11 14:27 UTC Render allowance: Hobby, 4/25 services, 8 MB/5 GB bandwidth, 0/500 pipeline minutes displayed, $0.00 preview/pipeline charges. Auto-deploy is off; rollback target is dep-dahdjffqj5pc73a9mhrg at 8a83afd. No billing, plan, domain or unrelated service changes.
- Repository stays private; PR #1 is merged. This follow-on is local and unmerged. No separate portfolio website, public product launch, paid commitment or external outreach has been published.

## Next action

Keith can review the local app at http://127.0.0.1:4173, screenshots and case study.
This implementation slice is complete. A hosted update, publication or merge is
separate work and was not performed. The historical detection gate remains failed.
