# Separate preview and rollback

Status: October 13 monochrome/all-13-example release is live on the existing Vercel URL. The September deployment is preserved for rollback; older Render preview remains unchanged. Engine research is stopped.

## Video Demo content release — 13 October 2026

- Explicit user production authorisation; source `049bbcd` on the continuation branch.
- Live: https://communication-check.vercel.app/, READY deployment `dpl_5K7chhzUrhfsBF9RRoihoGM8HVTp`.
- Immutable URL: https://communication-check-9m943f2m1-keith-grehans-projects.vercel.app.
- Same project/team verified, active Hobby. Only eight static assets and output config (466,732 bytes) uploaded; no remote build, plan change, new service or access-policy change.
- Staged with `--prebuilt --prod --skip-domain`; all eight assets matched through authenticated `vercel curl`, then promoted. Staged OIDC browser access returned 403; no staged browser pass claimed.
- Public verification: eight exact asset hashes, security headers, eight source/config 404s; all 11 information-page browser tests; exact new copy, axe and normal/doubled-text layout at 1440/390/320px; desktop/mobile screenshots inspected. Evidence in `output/hubspot-demo-copy-2026-10-13/`.
- Immediate prior-production rollback target is now `dpl_FKXFku3G4FyNkykStfjFtFXELKiQ` (October monochrome release). The older September deployment and frozen/Prism branches remain preserved. Historical procedures below describe prior releases; use the immediate prior target for this release if rollback is needed.

## Approved production release — 13 October 2026

Keith explicitly approved: “approving change to main site get it live”. This
satisfied the candidate-specific release gate below; no further confirmation was
required. Source `ffba4d1`, branch `codex/communication-check-next`.

- Public URL: https://communication-check.vercel.app/
- Deployment: `dpl_FKXFku3G4FyNkykStfjFtFXELKiQ`, READY, production.
- Immutable URL: https://communication-check-kzmh5fnls-keith-grehans-projects.vercel.app
- Same project `prj_NW3ec5feWa0ljV2AYyNb12psxi1K` / Keith Grehan's projects,
  verified active Hobby. Reviewed package byte-identical to the preview; staged
  with `--prebuilt --prod --skip-domain`, authenticated staged HTML matched, then
  promoted. Public alias independently verified at this deployment.
- All eight public assets match the reviewed build; security headers, image MIME
  and eight source/config 404s pass. Evidence: `output/monochrome-2026-10-13/production-assets.json`.
- Anonymous public Chromium smoke passed all 13 examples, both lenses, exact
  selection, Keep/Undo, style retention, edit invalidation, current clipboard,
  offline use, runtime canary privacy, empty storage/reload clearing and mobile
  navigation. Desktop/mobile screenshots inspected. Evidence:
  `output/monochrome-2026-10-13/production-flow.json` and production screenshots.
- This focused production check is separate from the previous preview suite:
  71 preview checks passed, 23 were blocked by Vercel's checkpoint. All 94 local
  tests passed. No protection-policy change or claim of a full hosted-suite pass.
- Rollback target remains the previous production deployment
  `dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7`. Use the rollback procedure below and recheck
  frozen asset hashes and workflow. Do not create an intervening production
  deployment or move the preserved Git refs. No Git main merge, new plan, paid
  feature, remote build, domain change or source upload occurred.
- LinkedIn Post Inspector and Featured preview verification remain unperformed
  after this release; successful HTML/metadata checks do not establish that result.

## Monochrome preview — 13 October 2026

Keith authorised the separate preview after reviewing the local milestone.
Preview: https://communication-check-6vs6k4cvr-keith-grehans-projects.vercel.app/
(`dpl_7Xe8WwvHcVLYjx2mqidQQ4HD4MCq`, READY). Existing project/account unchanged.
The reviewed uncommitted working tree on `codex/communication-check-next` was
rebuilt and matched all eight previously reviewed asset hashes byte-for-byte.
`output/monochrome-2026-10-13/deployment.json` records checkout HEAD separately
from the actual uncommitted source hashes; HEAD alone is not this candidate.

Only eight static assets and Build Output v3 config (465,377 bytes) were uploaded
from `work/vercel-preview-2026-10-13`; local linkage, source, Git metadata and
credentials were excluded by the inspected dry-run manifest. Explicit Preview
target, no production flags or alias moves. Prebuilt static output used no remote
build. The CLI verified active Hobby; billing usage returned “Costs not found”
(404), so numerical remaining allowance is not claimed. No paid feature, billing,
plan, Git integration or protection changes. Hobby static limits do not authorise
a paid upgrade if reached: see [Hobby limits](https://vercel.com/docs/plans/hobby).

Eight exact hosted hashes, HTTP security headers, image MIME and eight excluded
source/config 404 checks passed. Hosted desktop/mobile screenshots inspected.
The authenticated hosted suite passed 71 checks, then Vercel Security Checkpoint
Code 21 blocked new browser navigation. The bulk run was stopped; one slower
single-worker retry after a pause hit the same checkpoint and stopped at its first
failure. The remaining 23 hosted cases are not verified, including the full hosted
runtime privacy canary. All 94 local cases passed before deployment. Authentication uses
existing short-lived project OIDC in memory, scoped to the preview origin, with
traces/video disabled. Anonymous access redirects to Vercel SSO. These authenticated
metadata checks do not prove anonymous crawler/LinkedIn access.

Production alias was verified before and after deployment at frozen
`dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7`. No Git commit/push, merge or frozen/Prism ref
change occurred during that preview step. Keith subsequently approved the exact
candidate; release commit and production result are recorded above.

## Proposed monochrome release — 13 October 2026

**Release plan executed after explicit approval.** Preview, production staging and
promotion are recorded above. Rollback was not needed. The original plan below
is retained with the preview checkpoint limitation documented in the release record.

1. **Prepare a separate preview after Keith authorises it.** Recheck the existing
   `communication-check` project (`prj_NW3ec5feWa0ljV2AYyNb12psxi1K`) in
   `keith-grehans-projects` (`team_YKDt6rh9Hs4SZSTB3uzQaXmG`), current allowance and
   authentication. Record the reviewed continuation-branch commit and asset hashes.
   Build locally; use the existing Build Output v3 packaging approach from
   `scripts/prepare-vercel-preview.mjs`, with a fresh dated staging directory so
   October 11 evidence is preserved. Copy only `web/dist` and
   `docs/VERCEL_OUTPUT_CONFIG.json`, plus local project linkage; inspect the upload
   manifest for source, credentials, tests and Git exclusions. Run
   `vercel deploy --prebuilt --scope keith-grehans-projects` from that isolated
   package, without `--prod` or `--public`. Retain preview authentication. Record
   its immutable URL/deployment ID and verify the production alias still points
   to the frozen deployment.
2. **Accept that exact preview.** Compare all hosted assets to the reviewed build;
   check security headers, `connect-src 'none'`, noindex and excluded-path 404s.
   Exercise all 13 options and original labels/order, preferred-lens/dual checks,
   inert selection, replacement cancel/accept, exact evidence, Keep/Undo, tone
   styles, editing invalidation, copy/fallback and navigation. Run desktop/mobile,
   keyboard/focus/contrast, offline and runtime network/storage/log/URL checks.
   Use existing `verify:hosted` and browser suites with authenticated preview
   access; never persist bypass credentials in reports. Keith reviews the rendered
   monochrome candidate. Stop if allowance, project identity or validation fails.
3. **Obtain explicit production approval, naming the candidate.** Satisfied by
   Keith’s October 13 approval above. The proposed wording was:
   “I approve replacing https://communication-check.vercel.app/ with the reviewed
   monochrome candidate at [preview URL], commit [SHA], including staging it for
   production and moving the production alias after verification. Use only the
   existing project within its current allowance. If release checks fail, restore
   frozen deployment dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7.” This does not authorise a
   main merge, new paid service, domain, visibility change or outreach.
4. **Release only after that approval.** Deploy the identical accepted static
   package with `vercel deploy --prebuilt --prod --skip-domain --scope
   keith-grehans-projects`. Verify the staged production deployment's hashes and
   smoke/privacy checks, then `vercel promote <verified-production-deployment-id>
   --scope keith-grehans-projects`. Recheck the public alias, assets, headers and
   functional/privacy flows. Production staging avoids assuming that promoting a
   Preview deployment preserves its build: Vercel documents that preview promotion
   creates a new production deployment. LinkedIn Post Inspector remains a separate
   post-release verification; metadata alone is not a successful crawler check.
5. **Rollback if release checks fail.** Verify the prior production deployment is
   the frozen `dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7` (immutable URL
   `https://communication-check-be15ud6ic-keith-grehans-projects.vercel.app`), then
   run `vercel rollback dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7 --scope
   keith-grehans-projects`. Recheck the alias and six frozen asset hashes against
   `VERCEL_HOSTED_VERIFICATION.json`, plus the original smoke/privacy flow. Hobby
   allows rollback only to the previous production deployment, so verify
   eligibility before release and avoid intervening production releases. If the
   target is unavailable/ineligible, stop: do not upgrade or silently redeploy an
   alternative. The preserved branch `codex/frozen-vercel-2026-09-16` at `1463832`
   (app source `38d744d`) remains the recovery source for a separately approved
   rebuild. Keep the frozen and Prism branches intact.

CLI behavior checked against official Vercel documentation on October 13:
[deploy/prebuilt/staging](https://vercel.com/docs/cli/deploy),
[promote](https://vercel.com/docs/cli/promote),
[rollback and Hobby limit](https://vercel.com/docs/cli/rollback).

## Separate Margin desk preview — 2026-10-11

Keith authorized a separate preview of the selected Margin desk design. Preview:
https://communication-check-ohmijlpkn-keith-grehans-projects.vercel.app/
(`dpl_Ba1opf78DTfJx1MPNLiGhTw2xpzC`). Project/account remain Communication Check,
`prj_NW3ec5feWa0ljV2AYyNb12psxi1K`, Keith Grehan's projects, active Hobby.
Only eight static assets and Build Output v3 config were uploaded from the isolated
`work/vercel-preview-2026-10-11` package. Source, credentials and Git metadata were
excluded. No production flag, alias, hosting policy, plan or integration change.

Eight exact hosted hashes, security headers, eight excluded paths and WebP MIME
passed. Authenticated hosted editing, exact selection, Keep/Undo, clipboard,
offline review, privacy canary, empty storage/reload and mobile/photo smoke passed.
Evidence: `output/margin-desk-2026-10-11/hosted-assets.json` and `hosted-flow.json`.
Existing short-lived project credentials were used only in process and for the
preview origin; no token was saved in these reports. Anonymous access redirects
to Vercel login. The public alias was checked before and after and remains frozen
at `dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7`. This preview is not a production release or
public LinkedIn crawler verification. Local verification: 91 browser checks,
466 engine/example tests, eight setup checks and fresh independent review passed.

## Vercel deployment — 2026-09-16

Keith approved deployment and explicitly selected **Keith Grehan’s projects**
(`keith-grehans-projects`, Hobby), rather than the different plugin account.

- Current site: https://communication-check.vercel.app
- Source: `38d744d`, branch `codex/communication-check-tone-review`.
- Project: `communication-check`, `prj_NW3ec5feWa0ljV2AYyNb12psxi1K`.
- Deployment: `dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7`.
- Immutable URL: https://communication-check-be15ud6ic-keith-grehans-projects.vercel.app
- Prebuilt static deployment: six reviewed `web/dist` files plus Build Output API
  v3 configuration. The upload dry run excluded local credentials and metadata.
- All 81 hosted browser checks pass, including workflow, information pages and runtime privacy.
- Six hosted assets match the local build byte-for-byte; security headers and
  eight source/config 404 checks pass. Evidence: `VERCEL_HOSTED_VERIFICATION.json`.
- Private GitHub repository unchanged; no Git integration, push, merge, paid
  upgrade, custom domain, analytics, backend or changes to unrelated projects.
- Search indexing remains disabled. The portfolio prototype’s detection limits remain.

For a future release, build in the canonical repository and copy only `web/dist/`
contents into an isolated staging directory’s `.vercel/output/static/`. Copy
`docs/VERCEL_OUTPUT_CONFIG.json` to `.vercel/output/config.json`. Explicitly link
that staging directory to this project/account, inspect `vercel deploy --prebuilt
--prod --dry --json`, then deploy with `--prebuilt --prod` after release approval.
Never upload repository source or replace the older Render evidence. Verify the
public alias with `PREVIEW_URL=https://communication-check.vercel.app npm run
verify:hosted` and `npm run test:browser` with the same environment variable.
Hash routes need no wildcard rewrite; missing source/config paths must remain 404.
For rollback, promote a previously verified deployment from this project. This is
its first deployment; the older Render URL remains a separate fallback.

## Verified hosting basis — 2026-09-10

Render's existing My Workspace (`tea-d8fiurq8qa3s73924ijg`) is Hobby. The authenticated
billing page showed 3/25 services, 0 MB/5 GB outbound bandwidth and 0/500 pipeline minutes
used. Starter build compute includes 500 minutes; the existing workspace build
spend limit was $10. We did not change that limit, billing details or other services.

[Static hosting](https://render.com/docs/static-sites) has no instance charge but
counts against included bandwidth and build minutes. The [existing terms](https://render.com/terms)
contemplate commercial use; no noncommercial-only restriction was identified for
this static preview. The no-new-spend basis is use within the inspected remaining
allowance, not a promise of unlimited free hosting. Usage beyond included limits
can be billed. Check current workspace usage before further deploys or wider sharing.

A follow-up authenticated check at 13:03 UTC showed 4/25 services, 0 MB/5 GB
bandwidth, 0/500 pipeline minutes displayed and $0.00 pipeline charges. The
existing unrelated service charges were unchanged; no billing settings were edited.

A further authenticated check at 13:46 UTC showed the same Hobby plan and 4/25
services, 2 MB/5 GB bandwidth, 0/500 pipeline minutes displayed and $0.00 pipeline
charges. The separate static preview remains within the inspected allowance.

A refreshed authenticated check at 14:46 UTC showed Hobby, 4/25 services,
4 MB/5 GB bandwidth, 0/500 pipeline minutes displayed and $0.00 pipeline charges.
No plan, billing, spend-limit or domain setting was changed.

A refreshed authenticated check at 15:47 UTC showed Hobby, 4/25 services,
6 MB/5 GB bandwidth, 0/500 pipeline minutes displayed and $0.00 pipeline charges.
The expanded service breakdown showed communication-check-preview at $0.00;
the $2.25 workspace service charge belonged to an existing unrelated service.
The preview configuration still had automatic deploys and PR previews disabled.
No billing, plan, domain or unrelated service settings were changed.

Use one separate static site, private source repository, provider URL, no custom
domain, no service plan upgrade and automatic deploys off. No backend or database.
Only web/dist is published: bundled app/assets, favicon, robots and dependency
licences. Repository docs, references, source maps, tests and reserved files are
excluded. Provider URL accessibility is for review; no public launch is authorised.

## Verified configuration

- Repository: https://github.com/keithtgrehan/communication-check
- Branch: codex/communication-check-mvp; root repository directory.
- Build: npm ci --include=dev && npm run test && npm run build
- Publish path: web/dist
- Environment: SKIP_INSTALL_DEPS=true; Node version from .node-version.
- Auto-deploy: off; deploy only a reviewed candidate after checking allowance.
- No SPA wildcard rewrite: the single-page app needs only the root path.

Configure response headers at /* using the [static-site header settings](https://render.com/docs/static-site-headers):

| Header | Value |
| --- | --- |
| Content-Security-Policy | default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none' |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Referrer-Policy | no-referrer |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| X-Robots-Tag | noindex, nofollow |

HTML also includes the applicable CSP/noindex/referrer policy. Actual HTTP headers
and deployed asset hashes must be verified before hosted privacy claims.

## Accidental Vercel connection resolved

The separate Vercel project `web` (`prj_oaeVk026uQWzRxYOBSAxxcH2s8cz`) pointed at
reference/vibe-signal/web in this repository, causing the failing setup PR deploy.
Its GitHub link was disconnected through the authenticated CLI and verified null.
No Vercel project, deployment or domain was deleted, and no Vibe/RCR service changed.
Old failed checks remain historical; new branch pushes should no longer trigger
that accidental build. Vercel Hobby was not chosen for the commercial-intent preview.

## Rollback procedure

Before any future preview deploy, record its commit and Render deployment ID.
If a regression is found, open this preview's Render Events page, select the
previous verified successful deployment and use its rollback action. Confirm the
restored commit/asset hashes and rerun the hosted smoke/privacy checks. Keep
auto-deploy off so a branch push does not immediately replace the rollback.

For the first deployment, there is no earlier preview to restore. Disable or delete
only this separate preview through its own settings if taking it offline is
requested; first verify the exact service ID and name recorded below. Do not delete
the source repo, change other services, force-push or merge to main. An alternative
code rollback is a normal reviewed revert commit on the implementation branch,
followed by an explicitly selected deploy within allowance.

## First verified deployment

- Preview: https://communication-check-preview.onrender.com
- Service: srv-dahaejeq1p3s73ba4btg (communication-check-preview).
- Dashboard: https://dashboard.render.com/static/srv-dahaejeq1p3s73ba4btg.
- Deployment: dep-dahaejmq1p3s73ba4d90; live on 2026-09-10 at 12:49:29 UTC.
- Source commit: 4f1f0fcf96321ee588b7952a70a574f2e5c1e9aa.
- Actual type static_site, autoDeploy no/off, PR previews off, root empty,
  publishPath web/dist and intended build command verified through Render.
- Six headers saved and verified on actual responses. All six local build assets
  match hosted SHA256 hashes; eight source/config paths return 404. See
  docs/HOSTED_VERIFICATION.json. All 19 hosted Chromium browser checks pass.
- Provider URL is publicly reachable and noindex; this is a review preview, not
  an authenticated private site or an authorised public product launch.

Local fallback: `npm run build` then `npm run preview`, opening http://127.0.0.1:4173.

## Second verified deployment

- Source commit: 6e1793255bd18dd69e68f86e1e6b8167cb0506e5.
- Deployment: dep-dahapitbedkc739s6990; live 2026-09-10 at 13:13:00 UTC.
- All six asset hashes, six response headers and eight excluded source/config paths pass; all 19 hosted Chromium checks pass.
- The previous verified preview is dep-dahaejmq1p3s73ba4d90 at 4f1f0fc; this is the rollback target if needed. Its detection gate also remained unmet.
- Engine detection acceptance remains unfinished despite the verified interface and runtime behaviour.

## Previous verified interim deployment

- Source commit: 10d4e764c09938b61a04b2a3cd8cd48c7a091441.
- Full runtime engine manifest: d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243.
- Deployment: dep-dahblp5bedkc739vpj90; live 2026-09-10 at 14:13:06 UTC.
- Six hosted assets match local build hashes; six response headers and eight excluded source/config paths pass. All 19 hosted Chromium checks pass.
- Allowance rechecked at 14:10 UTC: Hobby, 4/25 services, 2 MB/5 GB bandwidth, 0/500 pipeline minutes displayed and $0.00 pipeline charges. No plan, billing or domain changes.
- The previous verified preview is dep-dahapitbedkc739s6990 at 6e17932; this is the current rollback target. Its detection gate also remained unmet.
- This is an interim review preview: all seven fresh evaluations have failed the detection requirement, so engineering completion remains unclaimed.

## Previous portfolio preview — 10 September

- URL: https://communication-check-preview.onrender.com
- Source checkout: 8a83afd46133abf07d7c0087fd09b222112b09d0; reviewed runtime from d1230d6d066bc4a8eef9aa08d7818c1404d09c04.
- Runtime manifest: 6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125.
- Deployment dep-dahdjffqj5pc73a9mhrg, live 2026-09-10 16:24:43 UTC. Service srv-dahaejeq1p3s73ba4btg remains static, auto-deploy off and PR previews off.
- Six exact asset hashes, six response headers, eight excluded-path 404s and all 19 hosted Chromium checks pass. The current JSON record replaces the previous deployment's record.
- Refreshed billing inspection at 16:24 UTC: Hobby, 4/25 services, 6 MB/5 GB bandwidth, 0/500 pipeline minutes displayed, $0.00 preview-service and pipeline charges. Existing billing settings were unchanged. The provider allowance is bounded, not a guarantee of unlimited free hosting.
- Rollback target: previous verified dep-dahblp5bedkc739vpj90 at 10d4e764c09938b61a04b2a3cd8cd48c7a091441. Select it in this service's Events page, then reverify its assets and hosted flow. Both versions have documented detection limits.
- Keith revised delivery to a polished portfolio prototype. All ten failed detection evaluations remain preserved; this deployment does not imply the original accuracy gate passed. The provider URL is reachable and noindex, not authenticated or approval for a public product launch.

## 11 September refresh preparation

Authenticated billing check at 14:27 UTC: Hobby, 4/25 services, 8 MB/5 GB
bandwidth, 0/500 pipeline minutes displayed and $0.00 preview/pipeline charges.
The $2.47 workspace service charge belongs to the existing unrelated RCR service.
No plan, billing, spend-limit, domain or other service settings were changed.
The existing static preview remains on the intended repository/branch with
auto-deploy and PR previews off. Rollback for the forthcoming visual refresh is
verified deployment dep-dahdjffqj5pc73a9mhrg at
8a83afd46133abf07d7c0087fd09b222112b09d0.

## Current monochrome portfolio preview — 11 September

- Source checkout: 4931fe2f8968b0447c5e2872e520306aa0bb74b7. Engine manifest unchanged at 6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125.
- Deployment: dep-dai10kbm8hqs73dnm68g, live 2026-09-11 14:29:50 UTC, on the same static service/provider URL.
- Six exact asset hashes, six response headers and eight excluded source/config paths pass. All 28 hosted Chromium checks pass (35.9 seconds).
- Rollback: dep-dahdjffqj5pc73a9mhrg at 8a83afd46133abf07d7c0087fd09b222112b09d0. Use this service's Events rollback action and reverify assets and hosted checks.
- Automatic deploys and PR previews remain off; no hosting configuration, plan, billing, domain or unrelated service changes. Allowance inspected above before deployment.
- Private source and separate noindex preview; no main merge or public launch. All ten detection failures remain preserved.
