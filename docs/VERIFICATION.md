# Verification record

Date: 2026-09-10. The build is still in progress. This record distinguishes
implemented/tested behaviour from pending gates; it is not a release approval.

## Local evidence

- Node 22.23.1, npm 10.9.8, pinned package-lock dependencies.
- Six setup tests pass: allowlisted handoff, working-copy labels, credential/symlink rejection, destination/branch guard, six exact reference blobs, existing-hook preservation.
- Current candidate: 163 engine unit tests pass with the original 18 development drafts unchanged. Engine SHA 457e8d096866a7b955fafaaea3cc323f3e00f2191acd04eb653ad74c88c4d5eb. Full local validate passes six setup tests, 163 unit tests, build/typecheck and 19 browser tests.
- TypeScript and Vite production build pass. Source/build guards reject known network, storage/logging APIs and donor/fixture contamination. Guards are regressions, not proof of privacy.
- npm audit reports 0 known vulnerabilities at inspection; this is time-specific, not assurance against unknown vulnerabilities.
- 19 Chromium browser tests pass: three real-engine demos, exact evidence/dismiss/recheck, stale clearing, copy current edits, denial/manual copy, reset, blank/oversize, privacy/offline, keyboard/axe/layout 320/390/1440, 200% content zoom, and 9 beginning/middle/end visible-selection cases.
- Visual desktop/mobile inspection and hosted screenshots use only fictional demos; capture commits are recorded with the screenshots.

## Runtime privacy method

Use a distinctive fictional canary. Observe every browser request and console/page
error; inspect request URLs, headers and bodies. After initial assets load, type,
check, edit, recheck, copy, reset and reload. Inspect local/session storage, cookies,
IndexedDB, Cache Storage and service-worker registrations; instrument storage write
calls. Verify copy contents, empty editor after reload and successful check/copy
while offline after load. Assert the production CSP includes connect-src none.

The automated local test observed no interaction requests, canary leakage,
application logs/errors or persistent browser state. An independent reviewer
repeated privacy checks with a different fictional canary and observed three
initial asset requests, no subsequent interaction requests and empty inspected
storage. Static host traffic and user-controlled clipboard behaviour remain
outside the no-draft-transmission claim. This does not audit browser extensions,
OS services, provider internals, every browser or every future code change.

## Independent review

A fresh Astra reviewer, separate from implementation and reserved evaluation,
reproduced four P2 defects: conversational timing inherited another clause's
request, explicitly qualified commitments were flagged, selected evidence could
remain offscreen, and expanded help failed text contrast. All four were repaired
and independently rechecked on candidate v2. The reviewer also tested nine fresh
Unicode selection cases, original engine repros/nearby positives, expanded-help
axe and no browser errors/logs. No material code defects remained in that pass.
Further review covered resolved proposals, unrelated adjacent decisions, certainty checks, human-role wording, modified product subjects, explicit guarantees, passive delivery and ordinary cost questions. Focused repairs preserved genuine product/pricing commitments and qualifications. The reviewer cleared the final engine at the hash above after 16 independent pricing cases, earlier 24 subject/delivery cases and 163 public tests plus typecheck. No material unresolved defect was identified in that bounded review. This is independent agent review, not certification or proof that every English paraphrase is handled.

## Reserved evaluation and outstanding gates

Four independent reserved attempts failed the detection gate; all remain in
docs/EVALUATION.md. Latest v4 detected 6/12 selected findings with 6/6 useful emissions,
zero clean-control flags and all spans exact. Consumed v1–v3 regression results
are 35/36 expected and 35/35 useful findings with no clean flags, not new heldout
evidence. V4 was frozen before v3 diagnostics and repairs; it was run once and failed
the detection threshold. V5 will be frozen before further diagnostic repair.

## Hosted evidence — first review preview

https://communication-check-preview.onrender.com was built from
4f1f0fcf96321ee588b7952a70a574f2e5c1e9aa and is live on Render. Six asset hashes
match the local production build byte-for-byte. Six security/privacy/indexing
headers pass on the actual response; eight tested source/config paths return 404.
The full 19-test Chromium suite passes against the hosted URL, including the same
network/storage/log canary and offline checking. The service auto-deploy setting
is off. Raw static integrity evidence is in docs/HOSTED_VERIFICATION.json.

Screenshots use only the built-in fictional demos, captured from this hosted
preview. Viewport sizes are automation, not physical mobile devices.

Coverage is still insufficient against the frozen engine acceptance gates;
code/tests and final evaluation updates remain in progress. Human usability 0/3
and pilots 0/5 remain unperformed. No real-world accuracy, customer benefit,
factual approval, commercial readiness or public-release approval is claimed.
