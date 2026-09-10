# Communication Check progress

Updated: 2026-09-10
Milestone: end-to-end implementation and independent evaluation
Status: build goal active; hosted preview verified, final engine evaluation pending

## Verified

- Canonical checkout: /Users/keith/Documents/ChatGPT/communication-check.
- Private repository: https://github.com/keithtgrehan/communication-check.
- Branch codex/communication-check-mvp; reuse draft PR https://github.com/keithtgrehan/communication-check/pull/1; no merge.
- Static React/Vite editor and deterministic TypeScript engine implemented: five check families, exact UTF-16 evidence, up to three findings, dismissal, editing/recheck, current-text copy, reset and three separate fictional demos.
- Engine: 18 original development drafts and 163 passing public regression tests. Production build and source/build guards pass. Three demos remain separate from evaluation fixtures.
- 19 local browser checks now pass, including long-draft visible selection and expanded-help contrast. Independent review verified the four original repairs. Browser checks cover clipboard success/denial, stale results, limits, keyboard, 320/390/1440px layout, 200% content zoom, network/storage/log canary, reload clearing and offline operation. Chromium automation is not physical-device or human usability testing.
- Initial reserved evaluation FAILED: 9/12 selected findings, 9/10 useful emissions, one flag across four clean controls. All emitted spans valid. Original results retained in docs/EVALUATION.md.
- Fresh reserved v2 FAILED detection: 4/12 selected, 4/4 useful emissions, zero clean-control flags. Both failed results are retained. V1–v3 are now consumed diagnostic regressions: 35/36 expected findings, 35/35 useful emissions and zero flags across 12 clean controls under unchanged labels. These are regression results, not new heldout evidence.
- Runtime dependencies pinned; initial npm audit returned zero known vulnerabilities. Audited six-file Vibe reference remains outside runtime.
- Vercel's accidental connection to reference/vibe-signal/web was disconnected and verified; other projects/deployments untouched.
- Render's existing Hobby workspace allowance verified: 3/25 services, 0MB/5GB bandwidth and 0/500 pipeline minutes used at inspection. Static hosting has no instance charge; existing overage billing remains possible beyond allowance. No new plan, paid service or billing change authorised.
- Keith moved the preserved lead task to the correct local project; current task cwd is now canonical. Repository commands still specify it explicitly.
- ChatGPT website project instructions were saved and verified. Initial context was added as CHATGPT_CONTEXT.md.txt in Project Sources; this is a dated snapshot, not ongoing sync. The browser extension file permission is now enabled by Keith.

## Boundaries and outstanding work

- Fresh v3 FAILED detection: 6/12 expected, 6/6 useful emissions, zero clean flags and valid spans. Its original result is retained. Independent review cleared candidate 457e8d096866a7b955fafaaea3cc323f3e00f2191acd04eb653ad74c88c4d5eb after targeted repairs. Fresh v4 also FAILED: 6/12 expected, 6/6 useful emissions, zero clean flags, valid spans. All four failed attempts remain recorded. V5 will be frozen before v4 diagnostic repair; no engineering completion is claimed.
- Preview: https://communication-check-preview.onrender.com at 4f1f0fc. Six exact asset hashes, six response headers and eight excluded source paths verified; all 19 hosted browser checks pass. Screenshots, demo/case-study, human protocol and rollback docs prepared. Final engine updates and PR evidence remain.
- Native app self-control remains restricted; use supported task tools and browser project UI without bypassing it.
- Milestone messages go to the existing product companion; Sources updates are separate, explicit actions.
- Human usability sessions and AM/CSM pilots are outstanding. Agent-labelled fictional results are not real-world accuracy or customer validation.
- Public launch, main merge, visibility/domain changes, new spending and external outreach remain unapproved.

## Next action

Complete independent review and the sealed evaluation, then update the preview,
verify its exact build and finish delivery evidence within the existing allowance.
