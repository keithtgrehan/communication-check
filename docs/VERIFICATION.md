# Verification record

Date: 2026-09-10. Keith revised delivery to a polished portfolio prototype.
The latest delivery record at the end supersedes earlier in-progress status.
Historical test and evaluation evidence is retained; this is not public-release approval.

## Local evidence

- Node 22.23.1, npm 10.9.8, pinned package-lock dependencies.
- Seven setup/integrity tests pass: full runtime-module identity, allowlisted handoff, working-copy labels, credential/symlink rejection, destination/branch guard, six exact reference blobs, existing-hook preservation.
- Current hosted candidate: full runtime manifest d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243. Full local validation passes seven setup/integrity tests, 199 public engine tests, build/typecheck and 19 browser tests. The original 18 development drafts are unchanged. Twelve independent reviewer cases are included unchanged; diagnostic-derived controls remain private. This candidate is deployed and verified at commit 10d4e764c09938b61a04b2a3cd8cd48c7a091441.
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
unresolved defect in this bounded review. The candidate was committed as 10d4e764c09938b61a04b2a3cd8cd48c7a091441; its single
authorised v7 run again detected only 6/12 and failed the detection gate. Passing the private matrix and consumed
corpora does not establish fresh generalisation.

## Independent development coverage audit

A separate reviewer froze 100 new fictional cases before running candidate
d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243.
Case SHA256: 47bddb94a7ea6a08e9f5b67e4042efd482cbdf4ae0b69d546ce58fff2e903b7d.
There are ten positive and ten paired clean cases per family. The reviewer had
prior source-review knowledge but read no reserved/consumed corpus, raw diagnostic,
implementer matrix, development fixture, demo or v8 material for this audit.

| Family | Selected positive findings detected | Clean cases unflagged |
| --- | --- | --- |
| Ownership | 2/10 | 10/10 |
| Timing | 2/10 | 10/10 |
| Competing requests | 6/10 | 9/10 |
| Agreement | 1/10 | 10/10 |
| Commitments | 5/10 | 10/10 |
| Total | 16/50 | 49/50 |

Exact rule-set matches: 65/100. There were 17 emissions, no invalid spans and no
execution errors. Source and case hashes were unchanged before/after. One request
counting label is explicitly judgment-dependent; it and the raw baseline remain
unchanged, with any disagreement recorded separately. Cases are now available for
development under ignored work/reviewer-coverage, never shared milestone sources.
These are diagnostic development counts, not a fresh reserved result or an
estimate of real-world accuracy. They demonstrate that the implementer's earlier
80/80 matrix result did not cover important ordinary grammatical variation.

The subsequent clause-frame redesign at full runtime manifest
434abdcb026e797b9fde4f11f4dde48c87e29522545919a1bf6c19dd14c16421
matches all 100 fixed cases: 50/50 selected positive detections, 50/50 clean
controls unflagged, 50 emissions and no invalid spans. Every family has ten
positive detections and ten clean controls. Original inputs, labels and baseline
results are unchanged. R04-P is counted by the general action-frame logic;
its previously documented label ambiguity remains. The private matrix remains
80/80. These improvements are known-case development evidence only.

Root validation on this five-module candidate passes seven setup/integrity tests,
199 public engine tests, build/typecheck and all 19 local Chromium checks.
Consumed v1–v7 detected 82/84 expected findings with 82/82 useful emissions and
zero clean-control flags across 28 controls; all corpus/source checks passed.
One historical v2 abstention and a new v5 timing regression remain. Independent
review ran 32 probes and reproduced nine false flags across seven P2 causes:
descriptive adjectives/relative clauses/exploratory wording treated as tasks,
conversational timing/unrelated event objects treated as dependencies, and
ordinary receipt/unrelated proposals treated as pending agreement. All nine were
clean on the previous deployed candidate; intended positive and commitment
controls passed and all spans were valid. This candidate is not cleared. Repairs
are in progress; the deployed preview is still 10d4e76.
Four separate 12,000-character runtime sanity probes completed without errors or
invalid spans, with observed local times of roughly 2–225 ms. This single-machine
sanity check is not a general performance benchmark or device guarantee.

The repaired candidate c43d1866b582f5772c28af469d375bfdaf26a790247ce4a870784b8320a84245
retains 100/100 independent development cases and 80/80 private matrix cases.
Consumed v1–v7 now reaches 83/84 expected findings, 83/83 useful emissions and no
flags across 28 clean controls; the timing regression is repaired and only the
historical v2 abstention remains. The original corpus/label hashes are unchanged.
Root full validation passes seven setup/integrity tests, 211 public engine tests,
build/typecheck and 19 local Chromium tests. The independent reviewer cleared all
nine original false flags and 29 bounded probes, including positive preservation,
same/different references, routine receipt, ordering, commitment roles and
Unicode/CRLF/quoted-mask spans. It independently passed 211 tests and typecheck,
with no material unresolved finding in this bounded review. It was committed as
558c66de18dab75931cf5ee3e0ad7a1b20638d06 before its authorised single v8 run;
that run detected 8/12 and failed the gate. The same four maximum-
length sanity probes completed in roughly 1.5–26 ms on this local run.

The subsequent bounded state/voice/timing repair is frozen at full manifest
ef17ba80358dee9ddcfbdab0acaa9e86df563f209730eb55b235637b523f71d6.
It retains the unchanged fixed 100/100 audit and 80/80 private matrix. Consumed
v1–v8 reaches 95/96 expected findings and 95/95 useful emissions, with no flags
across 32 clean controls and all source/corpus/span/cap checks passing. The four
v8 misses are recovered; only the historical v2 abstention remains. Root full
validation passes seven setup/integrity tests, 211 public engine tests,
build/typecheck and 19 local browser checks. The independent reviewer cleared
25 focused probes, including adjacent negatives and Unicode/CRLF/quoted-mask
spans, and independently passed 211 public tests and typecheck. No material
finding remains in that bounded delta review. It was committed as
487fec81307d9ea8d214d7480a164abd89e9aa95 before its authorised single v9 run,
which failed at 5/12 expected findings. The consumed/development results remain
known-case evidence. Further reserved runs are paused for architectural assessment.

## Parsing architecture assessment after v9

Live npm metadata identified compromise 14.17.0 under MIT, with efrt 2.7.0,
grad-school 0.0.5 and suffix-thumb 5.0.3. The lead installed those only in ignored
work/parser-spike with lifecycle scripts disabled. The isolated dependency audit
reported zero known vulnerabilities. App dependencies, lockfile and runtime source
were unchanged. A source search found none of the inspected network/storage API
names; this is not a browser privacy verification.

The library's [official concepts](https://github.com/spencermountain/compromise/blob/master/docs/concepts.md)
describe local rule-based word tagging and explicitly state that it supplies no
dependency/parse tree. Its [MIT licence](https://github.com/spencermountain/compromise/blob/master/LICENSE)
requires retention of its notice if distributed. A read-only scratch check on
seven released misses and nine existing controls preserved all 192 term offsets,
including Unicode/CRLF. It supplied some useful word forms but misanalysed several
relevant predicate/subject constructions. Temporal indefiniteness, financial
benefit polarity, nominal delivery and event-reference semantics remained custom
work. One local 12,000-character parse/extraction took approximately 552 ms; sample
differences prevent comparison with earlier engine timings.

Decision: do not add this parser to production. Instead, represent commitment
outcomes separately from grammatical polarity and qualification, parse unspecified
owner phrases around their indefinite head, and centralize temporal/event-reference
categories. This retains the original architecture and requirements. Implementation
and independent review must demonstrate the benefit before another reserved run;
the sealed v10 set remains untouched. The raw scratch record contains consumed
examples and remains outside shared sources and handoffs.

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

Ten independent reserved attempts failed the detection gate; all remain in
docs/EVALUATION.md. Latest v10 detected 4/12 selected findings with 4/4 useful
emissions, zero clean-control flags and all spans exact. Current consumed v1–v9
regression results are 107/108 expected and 107/107 useful findings with no flags across
36 clean controls, not new heldout evidence. V9 was frozen before v8 diagnostic
consumption and ran once at 14:57:35.493 UTC against commit
487fec81307d9ea8d214d7480a164abd89e9aa95. All runtime/manifest/corpus integrity
checks passed. All labels, denominators, matching criteria and gates remain unchanged.

The six-module semantic repair at manifest
3bedb1fbffd890207014a6389bf596dddb551795896bcb4e983a2ca5da77ae37 passed
seven setup/integrity checks, 211 public engine tests, build/typecheck and 19 local
browser checks. Fixed development benchmarks remain 100/100 and 80/80. The
consumed v1–v9 result above belongs to this candidate, with full runtime and corpus
integrity verified. Independent review ran 26 focused probes and found five new
false flags: denied/requested promises treated as assertions, human consulting
classified as technical capability, and concrete or hyphenated timing phrases
treated as vague timing. All five were clean at the previous committed candidate.
This candidate is not cleared; targeted repairs and independent recheck are required
before the still-sealed v10 evaluation.

The reviewed correction at manifest
6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125 resolves
all five false flags. Fourteen reviewer-derived regression/paired-positive tests
were added without changing existing expectations. Root validation passes seven
setup/integrity checks, 225 public tests, build/typecheck and 19 browser checks.
An independent recheck passes all five original repros and 20 focused probes,
including positive preservation, claimant scope, service heads, event/deadline
boundaries and Unicode/CRLF/quoted spans; the reviewer independently passed 225
tests and typecheck. No material finding remains in that bounded review. Consumed
v1–v9 remains 107/108 expected and 107/107 useful, with zero findings across 36 clean
controls and every source/manifest/corpus integrity check passing. Fixed development
benchmarks remain 100/100 and 80/80. These results do not establish fresh detection
acceptance. V10 subsequently ran once at 15:48:01.691 UTC on reviewed commit
d1230d6d066bc4a8eef9aa08d7818c1404d09c04 and failed at 4/12 expected findings,
4/4 useful emissions and zero clean flags, invalid spans, cap violations or errors.
Every source/manifest/corpus integrity check passed. All ten failures and original
labels/gates remain preserved. Further fresh runs and wording repairs are paused
for a contract-fit and architecture audit; this reviewable candidate has not replaced
the interim hosted version below.

The subsequent contract-fit audit checked the frozen v10 packet and recomputed
matching against its recorded outputs without another engine execution. All twelve
labels and four controls were judged within scope; all eight misses were absent
family outputs rather than matching/cap failures. Packet integrity passed and no
labels or historical counts changed. The auditor knew the implementation and had
authored development cases, so this was independent contract judgment after diagnostic
access rather than a blind evaluation or human validation.

A separate read-only architecture assessment found that the frame objects still
wrap surface recognizers, with inconsistent participant and operator scope. Root
authorised one isolated deterministic proposition-normalizer experiment before any
further production integration. Its private contract, one-shot 60-case composition
challenge, effort ceiling and stop conditions are specified in the implementation
plan. The stage challenge has not yet been created or run. It cannot replace the
original five-family acceptance gate. The production runtime remains unchanged.

## Historical hosted evidence — previous review preview

https://communication-check-preview.onrender.com was built from
10d4e764c09938b61a04b2a3cd8cd48c7a091441 and is live on Render. Six asset hashes
match the local production build byte-for-byte. Six security/privacy/indexing
headers pass on the actual response; eight tested source/config paths return 404.
The full 19-test Chromium suite passes against the hosted URL, including the same
network/storage/log canary and offline checking. The service auto-deploy setting
is off. Static integrity evidence, including all three runtime module hashes and the canonical manifest, is in docs/HOSTED_VERIFICATION.json.

Screenshots use only the built-in fictional demos, captured from this hosted
preview. Viewport sizes are automation, not physical mobile devices.

Coverage is still insufficient against the frozen engine acceptance gates;
code/tests and final evaluation updates remain in progress. Human usability 0/3
and pilots 0/5 remain unperformed. No real-world accuracy, customer benefit,
factual approval, commercial readiness or public-release approval is claimed.


## Final portfolio delivery — 2026-09-10

Keith explicitly prioritised shipping quickly for his portfolio. This supersedes
prior in-progress delivery statements; it does not change any historical detection
result or claim the original gate passed. The semantic experiment was cancelled
before prototype implementation or challenge creation/freeze/execution.

- Deployed checkout: 8a83afd46133abf07d7c0087fd09b222112b09d0, containing the reviewed runtime from d1230d6d066bc4a8eef9aa08d7818c1404d09c04.
- Complete six-module runtime manifest: 6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125. Working and committed manifests match; later delivery changes are documentation/screenshots only.
- Local evidence remains seven setup/integrity tests, 225 public engine tests, build/typecheck and 19 Chromium checks. Independent review cleared five original repros and 20 probes with no material unresolved finding in that bounded review.
- Render deployment dep-dahdjffqj5pc73a9mhrg became live at 16:24:43 UTC. Six exact asset hashes, six response headers and eight excluded-path 404s pass. Timestamp and hashes: docs/HOSTED_VERIFICATION.json.
- All 19 hosted Chromium browser checks pass (11.4 seconds), including runtime network/storage/log canaries, offline behaviour, exact selection, clipboard, keyboard, 320/390/1440px layouts and 200% content zoom.
- Fresh desktop/mobile/clean screenshots use the built-in fictional demos on this deployment. Desktop and mobile images were visually inspected with no layout issue identified.
- The app is delivered as a functional portfolio prototype. All ten original detection failures remain, latest 4/12. The known language-coverage limitation is disclosed; no general reliability, human usefulness or production-readiness claim is made. Human sessions remain 0/3 and pilots 0/5.
- Separate preview only; repository private, PR #1 draft and unmerged. No public product launch, domain, billing or unrelated service changes.
