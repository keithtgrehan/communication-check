# Communication Check progress

Updated: 2026-10-09
Milestone: LinkedIn fetch repair and commercial portfolio redesign
Status: Candidate implemented; full local verification passed. Separate Vercel preview ready. Fresh independent review approved the candidate; authenticated hosted checks pass. Production remains frozen.

## October 9 candidate

- Keith requested implementation of the October 9 handover, prioritising LinkedIn loading and visual redesign. Work stays on `codex/communication-check-next`; engine rules, evidence spans and historical evaluations are unchanged.
- Actual LinkedIn Post Inspector reported: the current public URL cannot be re-scraped because robots.txt blocks it. Normal and simulated LinkedInBot GETs returned 200 HTML, which alone did not establish LinkedIn access. Initial HTML lacked Open Graph metadata and a preview image.
- Candidate allows LinkedInBot specifically, retaining generic crawler disallow, noindex and all runtime security/privacy protections. Initial HTML now has title, description, canonical and complete OG metadata. A 1200 × 630 PNG uses the real fictional-example interface; favicon matches the design.
- Warm white/teal redesign clarifies the opening task, example action, editor and finding cards. Three fictional partner/discovery/renewal samples and one clear comparison use existing engines. Previous nine examples remain unchanged in source regression coverage. Replacing user-edited text requires explicit confirmation.
- About retains Keith's approved contribution wording. Featured copy and post-release Inspector/Featured instructions are in PORTFOLIO_COPY.md. No LinkedIn profile changes, outreach, recording, new research or commercial-impact claims.
- Local verification: 8 setup/integrity tests, 466 engine/example tests, typecheck/build/source guards and 85 browser checks pass. Includes initial HTML/image/crawler configuration, first visit, all samples, replacement cancel/accept, both lenses, exact selection, Keep/Undo, copy, navigation, keyboard, automated axe, 320–1440px layouts, enlarged text and 200% zoom.
- Runtime canary verifies no draft-bearing network/log/URL/storage writes, offline checks and reload clearing. Mobile emulation and automated accessibility checks are not physical-device testing or certification.
- Before/after desktop/mobile/narrow screenshots inspected in `output/linkedin-redesign-2026-10-09/`; public card is `web/public/social-preview.png`. No existing unrelated output files were modified.
- Identical locked dependencies were restored after cloud placeholders blocked local runners; original dependency directory preserved under ignored `work/node_modules-cloud-20261009/`. No dependency-version change.
- Separate preview: https://communication-check-d5fyjbmk7-keith-grehans-projects.vercel.app/ (dpl_JACdSLnDLRaWvrK7gx6RnrSKdLbU). Only the static build/config uploaded to verified existing Keith Grehan's projects / Hobby; no new paid service, domain or repository integration. Existing Vercel preview authentication remains enabled.
- Fresh independent Astra Extra High review found no actionable defects; five viewport flows, keyboard/enlarged text, three axe states and metadata/image checks passed. Hosted authentication used existing short-lived Vercel credentials: all seven static assets match the local build, security headers and eight source/config exclusions pass. Actual hosted example/edit/Keep/Undo/copy, offline and privacy smoke plus 390px layout pass. Anonymous preview requests redirect to Vercel sign-in; this is not public crawler verification.
- Production canonical/image addresses intentionally target https://communication-check.vercel.app/ for the eventual approved release. The candidate is not yet live there. LinkedIn Post Inspector success, Featured preview/Save and the final Featured link remain pending after release; do not report “LinkedIn fixed”.

## Frozen production and branches

- Public URL: https://communication-check.vercel.app/. Frozen branch `codex/frozen-vercel-2026-09-16` at `1463832`; deployed source `38d744d`, production deployment dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7.
- Work branch `codex/communication-check-next`; Prism alternative preserved on `codex/communication-check-tone-review` at `2527641`. See FROZEN_BASELINE.md. No main merge, frozen-branch update, production replacement, repository visibility change or domain change without explicit approval.
- Repository remains private: https://github.com/keithtgrehan/communication-check. PR #1/#2/#3 were merged, last checked September 17; none reused.

## September 23 CRM demonstration (preserved)

- One fictional HubSpot + local n8n 2.40.5 demo verified real retrieval, checker finding/edit/recheck, exact 297-character clipboard paste and one new reviewed-note write with correct contact association and unchanged source. Credentials remain outside Git.
- Manual copy/paste through unchanged checker; HubSpot/n8n retain fictional payloads. The complete demo is not browser-only or a native integration. Sanitised workflows/instructions in `docs/demo/hubspot-n8n/`; source demonstration under `/Users/keith/Documents/Codex/2026-09-23/communication-check-plan/demo/`.
- Keith authorised the subsequent repository update, committed at 4dc4ee5. Spoken rehearsal/recording remains pending; it is not required for this design milestone.

## Earlier portfolio and delivery evidence

- September 17 package: approved contribution statement, case study, Featured drafts, four-minute/75-second scripts, SE notes and four-page PDF. Source/export parity and visual checks passed; fresh independent Astra review found no actionable issue. No posting or customer validation. Outputs remain in `output/portfolio-package-2026-09-17/`.
- September 16 accepted Vercel delivery: 451 engine + 10 scenario + 81 local and 81 hosted browser checks, build/typecheck, six matching assets, security headers and eight source exclusions. See VERCEL_HOSTED_VERIFICATION.json and HOSTING.md. Earlier 156-result non-copy parity checks and independent reviews are documented in EDITORIAL_REFINEMENT.md, FIRST_VISIT_POLISH.md, REVIEW_DESK_POLISH.md and TONE_CORRECTION.md.
- September 16 introduced information pages, finite tone corrections, independent lens snapshots and review decisions. One senior CSM's 21 workbook decisions/12 comments were expert content feedback, not usability or accuracy validation. No new evaluation round followed portfolio delivery.
- September 11 Render delivery remains documented in HOSTED_VERIFICATION.json and VERIFICATION.md: 225 engine, 28 local/hosted browser checks and six matching assets. Existing Render preview https://communication-check-preview.onrender.com; no hosting changes in this pass.

## Detection limitations and human evidence

Keith prioritised a polished functional portfolio prototype. The original detection target remains failed and is not represented as production reliability, customer benefit or human validation. Semantic-parser research and further reserved rounds remain stopped; no v11 is authorised. Full history: EVALUATION.md.

| Reserved attempt | Expected detected | Useful emissions | Clean-control flags |
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

- V10 ran once on d1230d6 after independent freeze. Original labels/thresholds remain unchanged. Known development benchmark passes and consumed-example passes are regression evidence, not new generalisation evidence. Agent labels are not human validation.
- Human usability: 0/3; pilots: 0/5. Reserved material remains outside normal handoffs/shared sources. No outreach or fabricated feedback.

## Handoff and next action

- Milestone handoff exports only PRODUCT_BRIEF.md and this progress file. Task-message delivery is not Project Sources synchronisation; historical Sources copies remain dated.
- Keith reviews the concrete candidate and approves production replacement if desired. After release, rerun actual Post Inspector and verify the Featured preview/Save flow. No additional product feature is required.
