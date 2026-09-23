# Communication Check — portfolio package

Prepared **17 September 2026** around the accepted [frozen live app](https://communication-check.vercel.app/).

**Status: prepared locally and approved by independent Astra Extra High package review; not published.**
Keith confirmed the first-person contribution statement on 17 September 2026. His spoken rehearsal remains pending. No change to the frozen app, deployment, recording, public upload, Git commit/push/merge or outreach is included.

September 23 repository note: Keith authorized committing this dated package to the private working branch. Its PDF and exported scripts remain the September 17 standalone-app snapshot. Current canonical notes and the [later CRM demo](../../docs/demo/hubspot-n8n/README.md) include newer information.

## Start here

| Artifact | Use |
|---|---|
| [Four-page case study](communication-check-case-study.pdf) | Standalone explanation for a presales/SE conversation; readable without private repository access. |
| [Portfolio copy](portfolio-copy.md) | Title, 62-word Featured/card description, 161-word unpublished LinkedIn draft, captions and confirmed contribution statement. Counts use whitespace-separated words, with link labels included. |
| [Demo script](demo-script.md) | Four-minute walkthrough, 75-second version, exact fictional input/revision and failure fallbacks. |
| [SE conversation notes](se-conversation-notes.md) | Customer problem, contribution, local-rule tradeoffs, privacy, evaluation limits and limited RevOps relevance. |
| [Desktop review](desktop-review.png) | Primary image and demonstration fallback. |
| [Mobile tone review](mobile-tone-review.png) | Supporting image of the tone question at a narrow viewport. |
| [Qualified clean result](clean-result.png) | Supporting live capture after a prewritten revision and recheck. |

The PDF now includes Keith's confirmed contribution wording. The PDF plus the existing live link are the proposed sharing assets. This index and the preparation notes are internal working context, not content to paste as a public post. Publication is a separate decision.

## Version and provenance

- Canonical root: `/Users/keith/Documents/ChatGPT/communication-check`.
- Current branch and unchanged HEAD: `codex/communication-check-next`, `b6942a83d75c25d48195a621a4166349e0be3db8`.
- Frozen branch: `codex/frozen-vercel-2026-09-16` at `146383228c99437ad4958b981d230c3b59d747b8`.
- Deployed source: `38d744db8b20c7398b8eb2d2d62f4833d5cd7dc3`.
- Tracked web tree shared by current, frozen, deployed and observed GitHub main: `b1c1ae8824b2d618e2cb937b8f28613f2e599cce`.
- Read-only GitHub observation on 17 September: repository private; main `b508df34947df0cd6354c378f0692dc0c6af7cb0`; PR #2 merged 16 September at 16:35:19 UTC and PR #3 at 17:50:09 UTC. PR #1 merged 11 September.
- Starting dirty state: pre-existing untracked `output/` only. All five pre-existing output files were hashed and preserved. The older `output/pdf/communication-check-case-study.pdf` is unchanged.
- Prism and other worktrees are preserved alternatives. Existing canonical `web/dist` was not used to serve or build this package.
- Editable sources: the eight allowlisted README/Markdown files named in the approved plan. Three packaged Markdown exports exactly match their respective canonical source files. The PDF is a four-page editorial summary of `docs/CASE_STUDY.md`, not a complete typeset copy of its aggregate table.
- The assessment, sales-engineer handover and implementation-plan reports in the task workspace are unchanged.

## Image provenance

| Packaged image | Source | Capture and use |
|---|---|---|
| desktop-review.png | `docs/screenshots/2026-09-16-editorial/after/clarity-1440x900.png` | Unaltered local editorial capture, 16 September, 1440×900. Default fictional Promises to confirm; quote, question and controls compared with live app. |
| mobile-tone-review.png | `docs/screenshots/2026-09-16-editorial/after/tone-382x844.png` | Unaltered local editorial capture, 16 September, 382×844, scrolled to review. Same fictional sample, Collaborative question. |
| clean-result.png | `docs/screenshots/2026-09-17-portfolio/clean-result.png` | New capture from the frozen Vercel app, 17 September. 560×205 crop of the clarity review panel after the full 297-character presenter-supplied revision. Browser-provided JPEG pixels were re-encoded losslessly to PNG; no resizing or retouching. |

All three were visually inspected individually and in the rendered PDF. They are real UI captures with fictional data. Reused local images are not relabeled as fresh hosted evidence; viewport emulation is not physical-device testing.

## Verification performed for this package

- **Source/host identity:** all six live assets returned HTTP 200 and exactly matched `docs/VERCEL_HOSTED_VERIFICATION.json` at 14:56:37 UTC on 17 September: index.html, assets/index-BThFI24p.css, assets/index-EFAt5TgG.js, favicon.svg, robots.txt and THIRD_PARTY_LICENSES.txt. The historical manifest was not overwritten.
- **Desktop smoke:** original sample produced one finding per lens. Keep/Undo preserved its text. Edit selected precisely the guarantee at offsets 85–150. Warm changed the tone question only. Replacing the text cleared both reviews. Tone recheck left clarity unchecked; subsequent clarity recheck showed its qualified no-flags result. Copy equaled the entire 297-character revision.
- **Narrow-screen smoke:** 390×844 empty/sample/result journey and tone review inspected. Sample moved the review into view; tone controls, full quote, question and review actions were readable. Temporary viewport override was reset.
- **Document checks:** exact 303/297-character samples and evidence slice; 62/161-word copy lengths; source/export byte parity; preserved ten-row evaluation table; local Markdown links and dated old-state references; clean Git whitespace check.
- **PDF:** four pages rendered and individually inspected. Text is extractable; the live hyperlink annotation points to Vercel. No private filesystem paths are embedded in the PDF. Images retain aspect ratio. No accessibility certification is claimed.
- **Scope:** tracked-file hashes compared with the start: changes restricted to README.md, docs/PRODUCT_BRIEF.md, docs/PROGRESS.md, docs/CASE_STUDY.md, docs/PORTFOLIO_COPY.md, docs/DEMO_SCRIPT.md, docs/SE_CONVERSATION_NOTES.md and docs/screenshots/README.md. Only the new clean capture and this dated export folder were added in the canonical repository. Frozen source, tests, scripts, manifests/configuration, evaluation records and prior output hashes remain unchanged.

This was a packaging smoke check. The full 81-test hosted suite, privacy-canary instrumentation, build and reserved evaluations were not rerun.

## Evidence carried forward with its original date

The 16 September record reports 451 engine + 10 scenario tests, seven setup checks, build/typecheck/source guards, 81 local browser checks and 81 hosted Chromium checks, including privacy/offline behavior. The earlier 17 September assessment reran 461 Vitest tests, TypeScript no-emit and selected integrity checks. Neither is mislabeled as a fresh full packaging-suite run.

All ten original reserved fictional evaluations failed the detection target; V10 found 4/12 selected issues. No labels or thresholds were changed. One senior CSM workbook review gave 21 overlapping decisions and 12 comments on fictional content. Completed usability remains 0/3 and pilots 0/5. There is no measured customer or business impact.

## Independent review and remaining human work

Fresh independent Astra Extra High review completed on 17 September: **approve the prepared local package; no actionable findings**. The reviewer inspected all four PDF pages and three images, compared claims/demo labels/attribution/dates with factual sources, confirmed source/export parity and allowed file scope, and checked both script lengths. The first-page-only comprehension check clearly identified the user/problem, delivered workflow, Keith/agent split and bounded prototype within one minute. This is an agent package review, not human market validation or an approval to publish.

After the independent review, Keith confirmed the exact contribution wording on 17 September 2026. The lead synchronized the copy, notes and script, removed pending-contribution labels, and regenerated the four-page PDF. This follow-on records ownership confirmation only; it does not add engineering or customer evidence.

Keith's remaining preparation: perform one uninterrupted spoken run in approximately 3:30–4:30, including the no-flags caveat and “Why not an LLM?” objection.

The existing progress record exceeded its approximate 100-line target before this pass. Its history and complete evaluation table are preserved; broad historical cleanup was intentionally outside packaging scope.

No publication destination, recording, upload, deployment or new app feature is needed to complete local preparation.
