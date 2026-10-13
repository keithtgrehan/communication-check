# Frozen live baseline

Keith confirmed on 2026-09-16 that https://communication-check.vercel.app/ is the
version to keep. This baseline remained live until Keith explicitly approved the
October 13 monochrome release (`ffba4d1`, deployment
`dpl_FKXFku3G4FyNkykStfjFtFXELKiQ`). The baseline below is preserved for rollback;
its branch and deployment have not been changed.

- Frozen Git branch: `codex/frozen-vercel-2026-09-16`.
- Baseline commit: `146383228c99437ad4958b981d230c3b59d747b8` (includes deployment records).
- Deployed app source: `38d744db8b20c7398b8eb2d2d62f4833d5cd7dc3`; web trees are identical.
- Deployment: `dpl_FcNybgbtMpiRx8A6gQVrsUUF6HK7`.
- Six live asset hashes rechecked against `VERCEL_HOSTED_VERIFICATION.json` at freeze.
- Previous validation: 81 hosted browser checks, security headers and eight source exclusions passed.
- Future work: `codex/communication-check-next`, forked from the baseline.
- Prism alternative preserved on `codex/communication-check-tone-review` at `2527641`.

Do not move the frozen branch, merge to main or replace production without explicit
approval. The local push guard allows only initial creation of the exact frozen
reference and pushes to the next-work branch; it rejects later frozen updates.
This is a repository-local safeguard, not GitHub server-enforced branch protection.
No new detection evaluation or production-reliability claim is implied.
