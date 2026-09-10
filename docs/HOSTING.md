# Separate preview and rollback

Status: preview preparation; no successful hosted deployment claimed yet.

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

Use one separate static site, private source repository, provider URL, no custom
domain, no service plan upgrade and automatic deploys off. No backend or database.
Only web/dist is published: bundled app/assets, favicon, robots and dependency
licences. Repository docs, references, source maps, tests and reserved files are
excluded. Provider URL accessibility is for review; no public launch is authorised.

## Intended configuration

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

Preview service/deployment IDs, URL and verified commit will be recorded after
successful creation and verification. Local fallback: npm run build then npm run
preview, opening http://127.0.0.1:4173.
