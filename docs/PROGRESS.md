# Communication Check progress

Updated: 2026-09-10
Milestone: tenth evaluation failed; contract and architecture audit
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

All ten reserved attempts failed the original detection requirement of at least 10/12 selected findings. The original labels, gates and complete results remain in docs/EVALUATION.md.

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

- V8 was frozen before v7 diagnostic consumption, then run once on reviewed commit 558c66de18dab75931cf5ee3e0ad7a1b20638d06 and failed at 8/12. V9 was frozen before v8 diagnostics, then run once at 14:57:35 UTC on reviewed commit 487fec81307d9ea8d214d7480a164abd89e9aa95 and failed at 5/12. All source/corpus checks passed. V10 was frozen at 15:01:08 UTC before v9 diagnostics were released; it remains sealed and unrun.
- The independent 100-case development audit found 16/50 intended positive findings, 49/50 clean controls unflagged and 65/100 exact rule sets on the deployed baseline. The focused repair at full manifest ef17ba80358dee9ddcfbdab0acaa9e86df563f209730eb55b235637b523f71d6 retains 100/100 exact cases, with 50/50 positives and 50/50 clean controls, and the private 80/80 matrix. Labels, original inputs and baseline results are unchanged; one request-count label remains judgment-dependent. These are development results, not fresh evidence.
- This local candidate passes seven setup/integrity tests, 211 public engine tests, build/typecheck and 19 browser checks. Consumed v1–v8 reached 95/96 expected findings, 95/95 useful emissions and zero flags across 32 clean controls. One historical abstention remains. Earlier scope regressions were repaired and independently reviewed. The latest four state/voice/timing fixes passed 25 independent focused probes plus 211 public tests and typecheck, with no material finding in that bounded review. The subsequent v9 detection failure remains an unmet gate.
- The parser assessment is complete: an isolated word-tagging library trial did not resolve the semantic gaps and is not being added to the app. Root authorised structured commitment outcome/polarity, unspecified-owner and temporal/event-reference repairs. Further reserved runs wait for implementation and independent review. The no-LLM, no-draft-transmission and original acceptance requirements remain unchanged.
- The resulting six-module candidate (manifest 3bedb1fbffd890207014a6389bf596dddb551795896bcb4e983a2ca5da77ae37) passed seven setup checks, 211 public tests, build/typecheck and 19 browser checks. Consumed v1–v9 reached 107/108 expected and 107/107 useful findings, with zero flags across 36 clean controls. These are known-case results. Independent review found five new false flags across assertion scope, human-service classification and timing boundaries; this candidate is not cleared. Focused corrections are underway; v10 remains sealed.
- Those five defects are repaired at manifest 6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125. Root validation passes seven setup checks, 225 public tests, build/typecheck and 19 browser checks. The independent reviewer cleared all five original defects and 20 focused probes, preserving genuine positive cases and exact spans. Consumed v1–v9 remains 107/108 expected, 107/107 useful and zero clean flags with full source/corpus integrity. Fixed development benchmarks remain 100/100 and 80/80. This clears the bounded code review, not the fresh detection gate.
- V10 ran once at 15:48:01 UTC on reviewed commit d1230d6d066bc4a8eef9aa08d7818c1404d09c04 and failed at 4/12 expected, 4/4 useful, zero clean flags/errors with full runtime/corpus integrity. Further patch-and-evaluation rounds are paused for a contract-fit and architecture audit. No new corpus or fresh run is authorised; the failed result will not be relabelled or discarded.
- Diagnostic-derived nearby examples remain private regression material. Independent reviewer-authored cases can enter development tests. No reserved corpus or labels are uploaded or published.
- The frozen private 80-draft development matrix improved from 65/80 exact cases to 80/80; consumed v1–v6 reached 71/72 expected and 71/71 useful findings with zero clean flags. Independent review verified all scope fixes and final suppression repairs. These known-case results do not satisfy fresh evaluation.
- Timing is aligned with the original brief: a direct request alone is insufficient; another stated step must depend on the vague timing. The broader secondary contract wording and five ad-hoc tests were corrected, with original fixtures and reserved labels preserved.
- Candidates are identified by hashes of every runtime engine module and one canonical manifest hash, checked before and after evaluation. The local redesign has six modules; the current hosted preview has three. A regression test verifies that imported-module changes alter candidate identity.
- Engineering completion, real-world accuracy and customer validation are not claimed.

## Workflow and boundaries

- The existing lead task is associated with the correct local project; repository operations use the canonical root explicitly.
- ChatGPT project instructions are saved. The dated 15:13 UTC brief/progress file was uploaded through the supported browser chooser and verified ready before its superseded 13:58 copy was removed. Companion-task updates are also delivered at milestones. This is explicit refresh, not continuous sync; details are in docs/WORKFLOW.md.
- Native app self-control remains restricted; use supported task tools and website UI without bypassing that restriction.
- Render uses the inspected existing Hobby allowance. The latest refreshed check showed 4/25 services, 6 MB/5 GB bandwidth and 0/500 pipeline minutes displayed, with $0.00 preview service and pipeline charges. Automatic deploys are off. No billing, plan, domain or unrelated service changes were made.
- The accidental Vercel Git connection was disconnected and verified; no project or deployment was deleted.
- Human usability sessions: 0/3. Pilots: 0/5. Keith recruits; no outreach or customer feedback is claimed.
- Main merge, public launch, visibility/domain changes, new spending and external outreach remain unapproved.

## Next action

Audit whether the failed examples match the frozen product contract and identify a justified architecture decision.
Preserve all ten failures and the original labels, matching rules and gates.
