# Communication Check progress

Updated: 2026-09-10
Milestone: clause-frame redesign reviewed; eighth evaluation recorded
Status: build goal active — fresh detection acceptance remains unmet

## Verified delivery

- Canonical root: /Users/keith/Documents/ChatGPT/communication-check.
- Private repository: https://github.com/keithtgrehan/communication-check.
- Branch: codex/communication-check-mvp. Existing draft PR: https://github.com/keithtgrehan/communication-check/pull/1. No merge.
- Review preview: https://communication-check-preview.onrender.com at commit 10d4e764c09938b61a04b2a3cd8cd48c7a091441.
- Preview implements the static React/Vite editor and deterministic engine: five check families, up to three exact quotes, dismissal, edit/recheck, current-text copy, reset and three fictional demos.
- That preview passed 199 engine tests, seven setup/integrity tests, production build/typecheck and 19 local plus 19 hosted Chromium checks. Six asset hashes, six response headers and eight excluded source paths were verified. See docs/HOSTED_VERIFICATION.json.
- Browser checks cover Unicode evidence selection, stale clearing, clipboard success/denial, blank/oversize input, keyboard/contrast, 320/390/1440px layouts, 200% content zoom, network/storage/log canaries, reload clearing and offline operation. These are automated Chromium checks, not physical-device or human usability tests.
- The deployed candidate has full runtime manifest d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243. Full validation passes seven setup/integrity tests, 199 public engine tests, build/typecheck and 19 browser checks. Independent review cleared all scope repairs, including 14 final targeted probes; the candidate is committed and verified on the hosted preview.
- Original 18 development drafts are unchanged; independent reviewer regressions were added. Consumed v1–v6 results reached 71/72 expected findings, 71/71 useful emissions and zero flags across 24 clean controls. One historical language-reference abstention remains. These are known-case regressions, not fresh evidence.
- Dependency audit reported zero known vulnerabilities at inspection. Six pinned Vibe reference blobs remain unchanged and excluded from runtime.
- Screenshots, case study, demo script, human-validation protocol and isolated preview rollback instructions are prepared; final evidence must follow the final candidate.

## Evaluation and current work

All eight reserved attempts failed the original detection requirement of at least 10/12 selected findings. The original labels, gates and complete results remain in docs/EVALUATION.md.

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

- V6 was frozen before v5 diagnostics and V7 before v6 diagnostics; both ran once on committed candidates and failed detection. V8 was frozen before v7 diagnostic consumption, then run once at 14:48:31 UTC against reviewed commit 558c66de18dab75931cf5ee3e0ad7a1b20638d06. It detected 8/12, with 8/8 useful emissions and no clean-control flags, errors, cap or span issues. All source/corpus integrity checks passed. V9 was frozen at 14:51:01 UTC before v8 diagnostics were released and remains sealed.
- The independent 100-case development audit found 16/50 intended positive findings, 49/50 clean controls unflagged and 65/100 exact rule sets on the deployed baseline. The repaired clause-frame redesign at full manifest c43d1866b582f5772c28af469d375bfdaf26a790247ce4a870784b8320a84245 reaches 100/100 exact cases, with 50/50 positives and 50/50 clean controls, and retains the private 80/80 matrix. Labels, original inputs and baseline results are unchanged; one request-count label remains judgment-dependent. These are development results, not fresh evidence.
- This local candidate passes seven setup/integrity tests, 211 public engine tests, build/typecheck and 19 browser checks. Consumed v1–v7 reached 83/84 expected findings, 83/83 useful emissions and zero flags across 28 clean controls. One historical abstention remains. Independent review first found nine false flags across seven task/dependency/approval scope defects; all were repaired, together with a timing regression. The reviewer cleared 29 targeted probes plus 211 public tests and typecheck. The subsequent v8 detection failure remains an unmet gate.
- Diagnostic-derived nearby examples remain private regression material. Independent reviewer-authored cases can enter development tests. No reserved corpus or labels are uploaded or published.
- The frozen private 80-draft development matrix improved from 65/80 exact cases to 80/80; consumed v1–v6 reached 71/72 expected and 71/71 useful findings with zero clean flags. Independent review verified all scope fixes and final suppression repairs. These known-case results do not satisfy fresh evaluation.
- Timing is aligned with the original brief: a direct request alone is insufficient; another stated step must depend on the vague timing. The broader secondary contract wording and five ad-hoc tests were corrected, with original fixtures and reserved labels preserved.
- Candidates are identified by hashes of every runtime engine module and one canonical manifest hash, checked before and after evaluation. The local redesign has five modules; the current hosted preview has three. A regression test verifies that imported-module changes alter candidate identity.
- Engineering completion, real-world accuracy and customer validation are not claimed.

## Workflow and boundaries

- The existing lead task is associated with the correct local project; repository operations use the canonical root explicitly.
- ChatGPT project instructions are saved. Project Sources contains CHATGPT_CONTEXT-2026-09-10-1358UTC.md.txt, a dated brief/progress snapshot; its superseded 13:17 copy was removed after the new source became ready. Matching companion-task delivery was acknowledged. This is explicit milestone refresh, not continuous sync.
- Native app self-control remains restricted; use supported task tools and website UI without bypassing that restriction.
- Render uses the inspected existing Hobby allowance. The latest refreshed check showed 4/25 services, 4 MB/5 GB bandwidth and 0/500 pipeline minutes displayed. Automatic deploys are off. No billing, plan, domain or unrelated service changes were made.
- The accidental Vercel Git connection was disconnected and verified; no project or deployment was deleted.
- Human usability sessions: 0/3. Pilots: 0/5. Keith recruits; no outreach or customer feedback is claimed.
- Main merge, public launch, visibility/domain changes, new spending and external outreach remain unapproved.

## Next action

Repair the four consumed-v8 state/voice/timing gaps, retain clean controls, review
and commit the candidate before any single authorised v9 run.
Preserve all eight failures; the goal stays active until the original gates pass.
