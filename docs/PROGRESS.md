# Communication Check progress

Updated: 2026-09-10
Milestone: end-to-end implementation and independent evaluation
Status: build goal active; repairs and hosted delivery in progress

## Verified

- Canonical checkout: /Users/keith/Documents/ChatGPT/communication-check.
- Private repository: https://github.com/keithtgrehan/communication-check.
- Branch codex/communication-check-mvp; reuse draft PR https://github.com/keithtgrehan/communication-check/pull/1; no merge.
- Static React/Vite editor and deterministic TypeScript engine implemented: five check families, exact UTF-16 evidence, up to three findings, dismissal, editing/recheck, current-text copy, reset and three separate fictional demos.
- Initial engine: 18 development drafts, 68 passing tests; expanded to 120 public regression tests after independent review. Local production build, source/build guards and 10 browser tests passed after fixing the sample-label contrast.
- 19 local browser checks now pass, including long-draft visible selection and expanded-help contrast. Independent review verified the four original repairs. Browser checks cover clipboard success/denial, stale results, limits, keyboard, 320/390/1440px layout, 200% content zoom, network/storage/log canary, reload clearing and offline operation. Chromium automation is not physical-device or human usability testing.
- Initial reserved evaluation FAILED: 9/12 selected findings, 9/10 useful emissions, one flag across four clean controls. All emitted spans valid. Original results retained in docs/EVALUATION.md.
- Fresh reserved v2 FAILED detection: 4/12 selected, 4/4 useful emissions, zero clean-control flags. Both failed results are retained. Consumed tests are now diagnostic regressions with23/24 expected findings,23/23 useful emissions and zero clean flags under unchanged labels; v3 was reserved before further repair.
- Runtime dependencies pinned; initial npm audit returned zero known vulnerabilities. Audited six-file Vibe reference remains outside runtime.
- Vercel's accidental connection to reference/vibe-signal/web was disconnected and verified; other projects/deployments untouched.
- Render's existing Hobby workspace allowance verified: 3/25 services, 0MB/5GB bandwidth and 0/500 pipeline minutes used at inspection. Static hosting has no instance charge; existing overage billing remains possible beyond allowance. No new plan, paid service or billing change authorised.
- Keith moved the preserved lead task to the correct local project; current task cwd is now canonical. Repository commands still specify it explicitly.
- ChatGPT website project instructions were saved and verified. Initial context was added as CHATGPT_CONTEXT.md.txt in Project Sources; this is a dated snapshot, not ongoing sync. The browser extension file permission is now enabled by Keith.

## Boundaries and outstanding work

- Final engine independently reviewed at SHA028e2ef77a20991bc7e700ea6e47f6e8f88da1a367d35799685bfd5f921c09dc; 120 public tests/typecheck pass. Fresh v3 FAILED detection:6/12 expected,6/6 useful emissions,zero clean flags. All spans valid. Coverage repair continues; hosted review preview is being prepared.
- Finish preview, draft PR evidence, screenshots, demo/case-study materials and rollback instructions.
- Native app self-control remains restricted; use supported task tools and browser project UI without bypassing it.
- Milestone messages go to the existing product companion; Sources updates are separate, explicit actions.
- Human usability sessions and AM/CSM pilots are outstanding. Agent-labelled fictional results are not real-world accuracy or customer validation.
- Public launch, main merge, visibility/domain changes, new spending and external outreach remain unapproved.

## Next action

Repair the independently reproduced defects, evaluate the new frozen candidate,
then publish and verify the separate preview within the existing allowance.
