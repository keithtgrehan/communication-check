# Verification record

Date: 2026-09-10. The build is still in progress. This record distinguishes
implemented/tested behaviour from pending gates; it is not a release approval.

## Local evidence

- Node 22.23.1, npm 10.9.8, pinned package-lock dependencies.
- Seven setup/integrity tests pass: full runtime-module identity, allowlisted handoff, working-copy labels, credential/symlink rejection, destination/branch guard, six exact reference blobs, existing-hook preservation.
- Current local candidate: full runtime manifest d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243. Full local validation passes seven setup/integrity tests, 199 public engine tests, build/typecheck and 19 browser tests. The original 18 development drafts are unchanged. Twelve independent reviewer cases are included unchanged; diagnostic-derived controls remain private. This candidate is not yet deployed.
- TypeScript and Vite production build pass. Source/build guards reject known network, storage/logging APIs and donor/fixture contamination. Guards are regressions, not proof of privacy.
- npm audit reports 0 known vulnerabilities at inspection; this is time-specific, not assurance against unknown vulnerabilities.
- 19 Chromium browser tests pass: three real-engine demos, exact evidence/dismiss/recheck, stale clearing, copy current edits, denial/manual copy, reset, blank/oversize, privacy/offline, keyboard/axe/layout 320/390/1440, 200% content zoom, and 9 beginning/middle/end visible-selection cases.
- Visual desktop/mobile inspection and hosted screenshots use only fictional demos; capture commits are recorded with the screenshots.

## Private development coverage matrix

Before the next repair, 80 private fictional development drafts were frozen:
eight positive/clean pairs for each of five families. Corpus SHA256:
7d80a8f01305bc8c29d8d64e3ba0706f770c08f89fcf481fbe80f22e0e36de58.
These include diagnostic-derived variations and are development material, never
heldout evidence. Labels remained unchanged through the comparison.

Baseline e152aaee passed 65/80 exact cases: 26/40 intended positives and 39/40
clean controls. Candidate 18e6122bea78a81fc73df7319edc878cfbcb5e3a2a124edd38b08e9d774da56e
passed 80/80, with 40/40 in each group, plus 187 public tests, seven setup/integrity
tests, build/typecheck and 19 local browser checks. Consumed v1–v6 reached 71/72
expected findings, 71/71 useful emissions and zero flags across 24 clean controls.
One historical language-reference abstention remained.

Independent review then identified three new P2 false-positive causes involving
denied/unneeded assignment, agreement about an approval process, and routine
custom documents. Candidate 533e324f800ae798b97ac5b8834841a45781f9ca32bf87b26519eb858712424e
implements the repairs and retains 80/80 matrix cases, 71/72 consumed expected
findings with 71/71 useful emissions and no clean flags. Full validation passes
197 public tests, seven setup/integrity tests, build/typecheck and 19 browser
checks. Independent recheck confirmed the original fixes but found two
cross-proposition suppression regressions. Those were repaired in final candidate
d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243.
It retains 80/80 matrix cases and 71/72 consumed expectations, all 71 emissions
useful, zero clean-control flags and all source/corpus integrity checks passing.
Full local validation passes 199 public tests, seven setup/integrity tests,
build/typecheck and 19 browser checks. The independent reviewer cleared all 14
final targeted probes plus 199 public tests and typecheck, with no material
unresolved defect in this bounded review. V7 remains sealed until the committed
candidate is explicitly authorised. Passing the private matrix and consumed
corpora does not establish fresh generalisation.

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
Further review covered resolved proposals, unrelated adjacent decisions, certainty checks, human-role wording, modified product subjects, explicit guarantees, passive delivery and ordinary cost questions. Focused repairs preserved genuine product/pricing commitments and qualifications. The reviewer cleared the earlier engine at entry hash 457e8d096866a7b955fafaaea3cc323f3e00f2191acd04eb653ad74c88c4d5eb after 16 independent pricing cases, earlier 24 subject/delivery cases and 163 public tests plus typecheck. A later bounded review cleared candidate 12a347c1d7c755feae7a26524c7de286a7fb39e1c345d86b179d683bc12a7612, which then failed the fifth reserved detection gate. That prior structural candidate completed independent review. Agent review is not certification or proof that every English paraphrase is handled.

The structural review reproduced two P2 scope defects: a determiner or shared
action verb could link unrelated adjacent tasks, and a reported exploratory
question could be mistaken for an owner requirement. Both were repaired and
independently cleared on full manifest e152aaee36ce9ac7596b695959ae85eba1e9f93284c892a0d3638812c8d31772.
All 18 targeted review cases passed, including adjacent true positives, unrelated
references, exploratory requirements and Unicode/CRLF/quoted masking spans. The
reviewer independently passed 187 public tests and typecheck, with no material
unresolved defect in this bounded review. The subsequent sealed v6 evaluation failed detection, as recorded below.

## Reserved evaluation and outstanding gates

Six independent reserved attempts failed the detection gate; all remain in
docs/EVALUATION.md. Latest v6 detected 6/12 selected findings with 6/6 useful emissions,
zero clean-control flags and all spans exact. Current consumed v1–v5 regression
results are 59/60 expected and 59/59 useful findings with no flags across 20 clean
controls, not new heldout evidence. V6 was frozen before v5 diagnostic consumption
and was run once against commit 3cbe8467d9d25e0ef587334ce8f8b8112c38149d. All labels, denominators, matching criteria and gates remain unchanged.

## Hosted evidence — current review preview

https://communication-check-preview.onrender.com was built from
6e1793255bd18dd69e68f86e1e6b8167cb0506e5 and is live on Render. Six asset hashes
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
