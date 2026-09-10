# Verification record

Date: 2026-09-10. The build is still in progress. This record distinguishes
implemented/tested behaviour from pending gates; it is not a release approval.

## Local evidence

- Node 22.23.1, npm 10.9.8, pinned package-lock dependencies.
- Six setup tests pass: allowlisted handoff, working-copy labels, credential/symlink rejection, destination/branch guard, six exact reference blobs, existing-hook preservation.
- Current candidate: 120 engine unit tests pass with the original 18 development drafts unchanged. Engine SHA 028e2ef77a20991bc7e700ea6e47f6e8f88da1a367d35799685bfd5f921c09dc. Full local validate passes six setup tests,120 unit tests, build/typecheck and19 browser tests.
- TypeScript and Vite production build pass. Source/build guards reject known network, storage/logging APIs and donor/fixture contamination. Guards are regressions, not proof of privacy.
- npm audit reports 0 known vulnerabilities at inspection; this is time-specific, not assurance against unknown vulnerabilities.
- 19 Chromium browser tests pass: three real-engine demos, exact evidence/dismiss/recheck, stale clearing, copy current edits, denial/manual copy, reset, blank/oversize, privacy/offline, keyboard/axe/layout 320/390/1440, 200% content zoom, and 9 beginning/middle/end visible-selection cases.
- Visual desktop/mobile inspection uses fictional demos. Final hosted screenshots are pending.

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
Further coverage repairs required fixes to resolved proposals, noun phrases, unrelated adjacent decisions and a truthy RegExp certainty gate. The independent reviewer verified the final grammar/certainty changes with18 targeted cases and120 public tests at the current hash. Further coverage repair and hosting remain pending.

## Reserved evaluation and outstanding gates

Three independent reserved attempts failed the detection gate; all remain in
docs/EVALUATION.md. V3 detected6/12 selected findings with6/6 useful emissions,
zero clean-control flags and all spans exact. Consumed v1/v2 regression results
are23/24 expected and23/23 useful findings with no clean flags, not new heldout
evidence. V3 is now consumed for diagnostic repair; v4 will be frozen first.

Hosted preview, live header/network/storage checks, exact asset correspondence,
final PR evidence and final screenshots are pending. Human usability 0/3 and pilots
0/5 remain unperformed; no customer benefit, real-world accuracy, factual approval,
commercial readiness or public-release approval is claimed.
