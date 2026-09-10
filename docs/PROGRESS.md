# Communication Check progress

Updated: 2026-09-10
Milestone: structural engine refactor independently reviewed; sealed evaluation next
Status: build goal active — fresh detection acceptance remains unmet

## Verified delivery

- Canonical root: /Users/keith/Documents/ChatGPT/communication-check.
- Private repository: https://github.com/keithtgrehan/communication-check.
- Branch: codex/communication-check-mvp. Existing draft PR: https://github.com/keithtgrehan/communication-check/pull/1. No merge.
- Review preview: https://communication-check-preview.onrender.com at commit 6e1793255bd18dd69e68f86e1e6b8167cb0506e5.
- Preview implements the static React/Vite editor and deterministic engine: five check families, up to three exact quotes, dismissal, edit/recheck, current-text copy, reset and three fictional demos.
- That preview passed 163 engine tests, six setup tests, production build/typecheck and 19 local plus 19 hosted Chromium checks. Six asset hashes, six response headers and eight excluded source paths were verified. See docs/HOSTED_VERIFICATION.json.
- Browser checks cover Unicode evidence selection, stale clearing, clipboard success/denial, blank/oversize input, keyboard/contrast, 320/390/1440px layouts, 200% content zoom, network/storage/log canaries, reload clearing and offline operation. These are automated Chromium checks, not physical-device or human usability tests.
- The refactored local candidate has full runtime manifest e152aaee36ce9ac7596b695959ae85eba1e9f93284c892a0d3638812c8d31772. Full validation passes seven setup/integrity tests, 187 public engine tests, build/typecheck and 19 browser checks. Independent review cleared both scope repairs with 18 targeted cases; it is not yet deployed.
- Original 18 development drafts are unchanged; 12 independent reviewer cases were added. Consumed v1–v5 regression results reached 59/60 expected findings, 59/59 useful emissions and zero flags across 20 clean controls. One historical language-reference abstention remains. These are known-case regressions, not fresh evidence.
- Dependency audit reported zero known vulnerabilities at inspection. Six pinned Vibe reference blobs remain unchanged and excluded from runtime.
- Screenshots, case study, demo script, human-validation protocol and isolated preview rollback instructions are prepared; final evidence must follow the final candidate.

## Evaluation and current work

All five reserved attempts failed the original detection requirement of at least 10/12 selected findings. The original labels, gates and complete results remain in docs/EVALUATION.md.

| Reserved attempt | Expected findings detected | Useful emissions | Clean-control flags |
| --- | --- | --- | --- |
| V1 | 9/12 | 9/10 | 1 |
| V2 | 4/12 | 4/4 | 0 |
| V3 | 6/12 | 6/6 | 0 |
| V4 | 6/12 | 6/6 | 0 |
| V5 | 7/12 | 7/7 | 0 |

- V6 was frozen before v5 diagnostics and remains sealed outside shared project sources.
- Repeated misses concern grammatical forms and explicit references. The repair introduces shared, span-preserving action/context features within the deterministic engine; no new dependencies, remote model, UI scope or acceptance changes.
- Diagnostic-derived nearby examples remain private regression material. Independent reviewer-authored cases can enter development tests. No reserved corpus or labels are uploaded or published.
- Timing is aligned with the original brief: a direct request alone is insufficient; another stated step must depend on the vague timing. The broader secondary contract wording and five ad-hoc tests were corrected, with original fixtures and reserved labels preserved.
- The candidate is identified by hashes of all three runtime engine modules and one canonical manifest hash, checked before and after evaluation. A regression test verifies that imported-module changes alter candidate identity.
- Engineering completion, real-world accuracy and customer validation are not claimed.

## Workflow and boundaries

- The existing lead task is associated with the correct local project; repository operations use the canonical root explicitly.
- ChatGPT project instructions are saved. Project Sources contains CHATGPT_CONTEXT-2026-09-10-1317UTC.md.txt, a dated brief/progress snapshot; its superseded setup copy was removed after the new source became ready. Matching companion-task delivery was acknowledged. This is explicit milestone refresh, not continuous sync.
- Native app self-control remains restricted; use supported task tools and website UI without bypassing that restriction.
- Render uses the inspected existing Hobby allowance. A follow-up check showed 4/25 services, 0 MB/5 GB bandwidth and 0/500 pipeline minutes displayed. Automatic deploys are off. No billing, plan, domain or unrelated service changes were made.
- The accidental Vercel Git connection was disconnected and verified; no project or deployment was deleted.
- Human usability sessions: 0/3. Pilots: 0/5. Keith recruits; no outreach or customer feedback is claimed.
- Main merge, public launch, visibility/domain changes, new spending and external outreach remain unapproved.

## Next action

Commit the independently cleared candidate,
then run the sealed evaluation once. Update and verify the hosted candidate and
finish delivery evidence only when the original engineering gates are met.
