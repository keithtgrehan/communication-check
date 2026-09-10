# Reserved fictional evaluation

## Current result

**Engineering evaluation gate remains unmet.** The single reserved v10 run on reviewed commit `d1230d6d066bc4a8eef9aa08d7818c1404d09c04` detected **4/12** preselected useful findings (required at least 10/12). All **4/4** emitted findings matched useful labels, and the four clean controls received **zero** findings. All emitted spans were exact; there were no cap violations or execution errors.

Evaluated at `2026-09-10T15:48:01.691Z` with complete runtime manifest SHA256 `6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125`. Every runtime source hash, manifest and corpus hash was verified unchanged before/after the single run. Passing development, browser, independent-review and consumed-regression checks do not supersede this reserved result. All ten reserved attempts failed the frozen detection requirement and remain recorded below, alongside consumed-regression history. No failed evaluation was discarded or threshold relaxed. These iterative, small, fictional agent-labelled evaluations are engineering probes, not human validation or unbiased real-world accuracy estimates.

## Initial reserved evaluation v1

Evaluated 2026-09-10 at 12:29 UTC. **The initial candidate fails the reserved engineering acceptance gates.** This is a fixed-rule check on fictional, agent-labelled material; it is not human validation or an estimate of real-world accuracy.

## Candidate and reservation

- Evaluated entry point: `web/src/engine/index.ts`, exporting `checkDraft`.
- Candidate SHA256: `828063d33b3e76e462e2c837e2ea7d6d2a510dfcd6d3c6f6ab459bd8410d645f`.
- The file hash was verified immediately before and after execution and was unchanged. The candidate was not yet committed; the file hash identifies this result.
- Corpus and labels frozen at `2026-09-10T12:21:18.398045+00:00`, before engine development began.
- Frozen corpus SHA256: `ab4651ad6d7f8bead1fa51f9ee38191e4dbeccfb5e7794678bf5364aece75bf5`; integrity was checked during evaluation.
- Twelve distinct fictional customer onboarding follow-ups: four clean controls and exactly twelve preselected expected useful findings across the remaining eight drafts, covering all five rule families and the required commitment and suppression categories.
- An independent evaluator created the reserved examples and labels after reading the product brief, implementation plan and finding contract, without inspecting implementation code, development fixtures or demos. Reserved drafts, labels, close paraphrases and detailed results remain in an evaluator-only local directory outside repository sources and ordinary handoffs. This is procedural separation, not an enforced sandbox.

## Frozen matching method

A match requires the preselected rule ID and a nonempty quote that exactly equals its original-text slice, using integer UTF-16 start-inclusive/end-exclusive offsets. The emitted span must fit entirely inside the preselected acceptable evidence region and overlap a preselected anchor by at least one non-whitespace UTF-16 unit. Matching is one-to-one: an expected label cannot credit several findings. Extra, duplicate, wrong-family, out-of-region and invalid-span findings count as unmatched emissions. No after-the-fact semantic allowances were applied.

Agreement is matched useful emissions divided by all emissions across all twelve drafts. Expected detection is matched preselected findings divided by twelve. Clean-control emissions, evidence integrity, the three-finding cap and execution errors are checked separately. The evaluator directly invoked the fixed TypeScript entry point using Node 22.23.1 with type stripping and a local extension resolver; no implementation transformation or change was made.

## Aggregate results

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 9 / 12 (75%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 9 / 10 (90%) | At least 90% | Pass |
| Emissions across four clean controls | 1 | Zero | Fail |
| Exact original evidence spans | 10 / 10 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

There were three missed expected findings and one unmatched emission. The aggregate report deliberately excludes fixture content, per-draft labels, paraphrases and detailed diagnostics. Those remain reserved for a separately authorised diagnostic release.

## Interpretation and next requirement

The candidate does not meet the frozen detection and clean-control requirements. A working interface or passing development tests cannot override this result. The span checks cover emitted findings only; they do not show that missed concerns would have had correct evidence.

This small agent-authored corpus provides bounded engineering evidence. It does not establish factual or agreement verification, customer usefulness, human label agreement, market fit, privacy, browser behaviour or hosted-preview readiness. Those require their separate checks or actual participants.

If evaluation failures guide changes, preserve this original result and use a fresh, independently frozen reserved set for any subsequent heldout claim. If detailed examples are released for repair, promote them to regression tests rather than presenting another run on the same examples as heldout evidence.

## Fresh reserved evaluation v2

Evaluated `2026-09-10T12:32:57.807Z`. **The second candidate also fails the reserved engineering acceptance gates.** This result supplements, and does not replace, the initial failed evaluation above.

The fresh twelve-draft corpus, including four clean controls and twelve preselected useful findings over eight other drafts, was frozen at `2026-09-10T12:30:39.852157+00:00` before the second candidate's repairs. It uses new scenarios rather than adaptations or close paraphrases of the initial corpus. It covers all five rule families and the required commitment and suppression categories. The evaluator knew the initial aggregate result, but did not inspect first-run per-case diagnostics, engine source, development fixtures, demos or reviewer examples. The lead reports that repairs used independently authored reviewer examples, with no reserved diagnostics supplied to implementation.

- Fresh corpus SHA256: `6255e3dc3cf29ff7494741124bf7ed4e9477d571966def4577c01a7f669159e2`.
- Second candidate `web/src/engine/index.ts` SHA256: `d936a6c59cc3de62aaf777e888dff900ebab8855426234f6876b025b30446803`.
- Both corpus integrity and the candidate file hash were verified; the candidate hash was identical before and after the run. This candidate was not yet committed.
- Matching criteria, gates, engine invocation method and runner logic were unchanged. Only the runner's corpus and frozen-hash file selection changed to v2. No runs were discarded and no thresholds were relaxed.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 4 / 12 (33.3%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 4 / 4 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 4 / 4 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

There were eight missed expected findings and no unmatched emissions. Individual drafts, labels, paraphrases and diagnostics remain reserved outside repository sources. The unchanged span criteria validated all emitted evidence; this does not assess evidence for concerns the engine missed.

These two runs used different fictional examples, so their detection counts are not a controlled before/after comparison. The second run demonstrates conservative emitted findings on this small sample but inadequate coverage against its frozen expected findings. It does not satisfy the engineering readiness gate. Any further repairs informed by evaluation require another independently frozen fresh set for a new heldout claim, and the complete history of failed runs must remain visible. Repeated small evaluations must not be represented as an unbiased real-world accuracy estimate.

## Consumed-set regression check after diagnostic repair

After both original evaluations, the lead authorised a bounded diagnostic release of v1/v2 directly to the engine agent for necessary implementation fixes. These sets became **consumed regression material**, with their original labels unchanged. Their drafts, labels and detailed diagnostics stayed in local evaluator/engine working files outside repository sources and ordinary handoffs. The original failed heldout results above remain the historical evaluation results.

Before releasing those diagnostics and before subsequent repairs, the evaluator froze fresh v3 at `2026-09-10T12:34:29.222304+00:00`, SHA256 `9a5208fff06dac8b8f8a398459c24d7904834c586ea0043a2834098effeab19c`. V3 was not inspected by the engine agent and was not run during this regression check. The evaluator continued to avoid implementation, development-fixture, demo and reviewer-example reads.

The consumed-set check ran at 12:37 UTC against candidate SHA256 `97ab4e8e05e44d49fbc76912cfa9e9dbe6efa38fc58b3045526fa993fe63856f`, verified unchanged before and after both invocations. The original matching logic, labels, cap and acceptance thresholds were retained.

| Consumed set | Expected findings matched | Useful emissions | Clean-control emissions | Valid emitted spans |
| --- | --- | --- | --- | --- |
| V1 regression | 12 / 12 | 12 / 12 | 0 across four controls | 12 / 12 |
| V2 regression | 12 / 12 | 12 / 12 | 0 across four controls | 12 / 12 |

Neither consumed run produced unmatched emissions, cap violations or execution errors. These results verify repair of known cases; they are not new heldout results and do not erase the earlier failures. V3 remains reserved for one evaluation of the subsequently frozen candidate.

A subsequent consumed-only regression run at 12:39 UTC checked candidate SHA256 `4cfca8fe9fe29b62a2f22b3031b516a032a3391153f3f5edc081b7dab798f020` after additional independently identified suppression repairs. Its hash was unchanged before and after execution. Both consumed sets again matched 12/12 expected findings and 12/12 useful emissions each, with zero clean-control findings, invalid spans, cap violations or errors. V3 remained unrun. This is another known-case regression result, not fresh heldout evidence.

The final consumed-only check at 12:41 UTC used candidate SHA256 `a434880acfd40b20c3cc1cb61c04ce2bfa5fb35b71b487004154717a551f2367`, following an additional independently identified agreement-context suppression repair. The hash was unchanged before and after execution. Each consumed set again matched 12/12 expected findings and 12/12 useful emissions, with zero clean-control findings, invalid spans, cap violations or errors. V3 remained unrun; this check remains regression evidence only.

At 12:46 UTC, candidate SHA256 `028e2ef77a20991bc7e700ea6e47f6e8f88da1a367d35799685bfd5f921c09dc` was checked against both consumed sets after further independent scope/suppression repairs. The hash was unchanged before and after execution. V1 matched 12/12 expected findings, with 12/12 useful emissions. V2 matched 11/12 expected findings, with 11/11 useful emissions and one missed expectation. Both sets had zero clean-control emissions, invalid spans, cap violations or errors. Each still satisfied the original numerical thresholds, although v2 detection was lower than the prior consumed regression run. Original labels remained unchanged. V3 was not run.

## Fresh reserved evaluation v3

The lead explicitly authorised one sealed v3 run after independent review of the frozen candidate. It ran exactly once at `2026-09-10T12:47:39.825Z`. **The candidate fails the reserved detection gate.**

- Evaluated engine SHA256: `028e2ef77a20991bc7e700ea6e47f6e8f88da1a367d35799685bfd5f921c09dc`.
- V3 corpus frozen at `2026-09-10T12:34:29.222304+00:00`, before consumed v1/v2 diagnostic release and the subsequent repairs.
- V3 corpus SHA256: `9a5208fff06dac8b8f8a398459c24d7904834c586ea0043a2834098effeab19c`.
- Both engine and corpus hashes were verified before and after execution and were unchanged.
- Twelve fresh fictional customer follow-ups: four clean controls and twelve selected expected findings across eight other drafts, within the three-finding cap and covering all five families. The evaluator checked labels against the original product brief and suppressions before freezing them. No labels were changed after the run.
- The evaluator knew prior aggregate failures, then froze v3 before inspecting consumed per-case diagnostics for repair delivery. V3 used new customer scenarios, not adaptations of the consumed drafts. No implementation, development fixtures, demos, reviewer examples or private user drafts were read by the evaluator. V3 details remained unavailable to the implementation agent and lead during repairs.
- Runner logic, UTF-16 evidence matching, one-to-one label matching and numerical gates were unchanged. Only corpus/hash-file selection changed to v3. No discarded runs, semantic exceptions or threshold changes were used.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 6 / 12 (50%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 6 / 6 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 6 / 6 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Six expected findings were missed; there were no unmatched emissions. The v3 drafts, labels, paraphrases and detailed diagnostics remain reserved outside repository sources and ordinary handoffs. This aggregate result does not identify which concerns were missed.

The current engine emitted useful findings on this small sample but did not meet the frozen coverage requirement. Known-case repair success and independent code review do not establish adequate detection on new drafts. The three reserved corpora differ, so their results are not a controlled comparative experiment. All original failures remain relevant limitations; repeated small agent-authored evaluations do not support a real-world accuracy claim. Engineering readiness must not be claimed against the original acceptance contract while this gate remains unmet.

After the v3 result, the lead authorised diagnostic repair use of its six misses. V3 therefore became consumed regression material; its frozen labels and original failed result remain unchanged. Before inspecting or releasing those diagnostics, the evaluator froze a fresh v4 corpus at `2026-09-10T12:49:40.722591+00:00`, SHA256 `4fa0b385065c1c858502fada04c102ce34bb1fc5b38a62c642f414617f19a40c`. V4 retains the same twelve-draft/four-control/twelve-expectation structure, five-family scope, matching criteria and gates, with per-label scope rationales recorded before freezing. The evaluator read no implementation or development fixtures. V3 diagnostic wording was delivered directly to the lead for bounded repair; no fixture text was added to shared sources or this report. V4 remains sealed and unrun pending repairs, consumed-set verification and a fixed-candidate instruction.

## Consumed v1–v3 regression check

At 12:53 UTC, the evaluator ran all three consumed sets against engine SHA256 `b37ecacbd8c61ca09f74114fb323ec962a0595b542aaed9a8c17ebb7bdf2a346`, verified unchanged before and after execution. All original corpus hashes, labels and matching criteria were preserved.

| Consumed set | Expected findings matched | Useful emissions | Clean-control emissions | Valid emitted spans |
| --- | --- | --- | --- | --- |
| V1 | 12 / 12 | 12 / 12 | 0 across four controls | 12 / 12 |
| V2 | 11 / 12 | 11 / 11 | 0 across four controls | 11 / 11 |
| V3 | 12 / 12 | 12 / 12 | 0 across four controls | 12 / 12 |

The one v2 missed expectation remained unchanged from the prior consumed run. There were no unmatched emissions, cap violations or execution errors across the 36 consumed drafts. Each set met the original numerical thresholds as a regression check. These results verify known-case repairs and do not replace any original reserved failure. V4 remained sealed and unrun.

A further consumed-only check at 12:55 UTC used candidate SHA256 `8cc1bac45e4844098cc2a3527968be19831246e17ffcefc0a2c966a974bb0789`, after a status-only false-positive suppression repair. The candidate hash was unchanged before and after execution. Expected matches remained v1 12/12, v2 11/12 and v3 12/12; all 35 emissions matched useful labels. There were zero clean-control findings, invalid spans, cap violations or draft execution errors. A mistyped local runner path failed before loading any corpus and was corrected; it produced no evaluation result. Original labels were unchanged, and v4 remained unrun.

The 12:59 UTC consumed-only run checked candidate SHA256 `430fe5e68e3d12158a8b80fdf5bf80412937385bbc1d9c979c7b44d54164029b`, after further independently identified false-positive repairs. The hash was verified unchanged before and after all three runs. Expected matches remained 12/12, 11/12 and 12/12 for v1–v3 respectively, with 35/35 useful emissions and zero clean-control emissions, invalid spans, cap violations or errors. Original labels and criteria remained unchanged; v4 was not run.

At 13:03 UTC, candidate SHA256 `7e5085552ac44c2f5738ef3709f17c0395ed920ca6cbaa2b594d5f6b0bb026a1` was checked against consumed v1–v3. The hash remained unchanged. Expected matches were 12/12, 10/12 and 11/12 respectively; all 33 emitted findings matched useful labels, with zero clean-control emissions, invalid spans, cap violations or errors. Although each set met the numerical thresholds, two previously detected expectations were newly missed. The evaluator reported those regressions directly to the engine agent without changing any labels. V4 remained unrun.

At 13:05 UTC, candidate SHA256 `c21f9c655a93cf56d7549d3d541b74483018e05d65b7bab696ae34c03f7b787f` restored both newly lost consumed expectations. Its hash was unchanged before and after the v1–v3 run. Expected matches were again 12/12, 11/12 and 12/12 respectively, with 35/35 useful emissions and zero clean-control findings, invalid spans, cap violations or errors. All original labels remained unchanged. V4 remained unrun.

The 13:06 UTC consumed-only check used candidate SHA256 `7f63a58c6081620d74490a421b936c5cdf5d14314260da47e06e91ccce1d53f4`, after a further routine-work suppression repair. Its hash was unchanged before and after all three runs. Expected matches remained v1 12/12, v2 11/12 and v3 12/12; all 35 emissions matched useful labels, with zero clean-control findings, invalid spans, cap violations or errors. Original labels were unchanged; v4 remained unrun.

At 13:10 UTC, consumed v1–v3 were checked against candidate SHA256 `457e8d096866a7b955fafaaea3cc323f3e00f2191acd04eb653ad74c88c4d5eb`, following an independently identified pricing-topic suppression repair. The hash was unchanged before and after all three runs. Expected matches remained 12/12, 11/12 and 12/12 respectively, with 35/35 useful emissions and zero clean-control emissions, invalid spans, cap violations or errors. Original labels and criteria were unchanged; v4 remained unrun.

## Fresh reserved evaluation v4

After independent review of the frozen candidate, the lead explicitly authorised exactly one sealed v4 evaluation. It ran at `2026-09-10T13:11:17.688Z`. **The candidate fails the reserved detection gate.** No repeat was performed.

- Evaluated engine SHA256: `457e8d096866a7b955fafaaea3cc323f3e00f2191acd04eb653ad74c88c4d5eb`.
- Corpus frozen at `2026-09-10T12:49:40.722591+00:00`, before v3 diagnostics were inspected or released and before the subsequent repairs.
- V4 corpus SHA256: `4fa0b385065c1c858502fada04c102ce34bb1fc5b38a62c642f414617f19a40c`.
- Both candidate and corpus hashes were verified unchanged before and after the single run.
- Twelve fresh fictional customer onboarding drafts: four clean controls and twelve preselected useful findings over eight other drafts, covering all five families within the three-finding cap. Scope rationales, regions and anchors were frozen per label before evaluation.
- The evaluator knew the earlier aggregate failures but created v4 before reading v3 diagnostic details. The evaluator did not read implementation, development fixtures or demos. Implementation agents and the lead did not receive v4 drafts, labels, paraphrases or diagnostics during repairs.
- Original matching logic, one-to-one evidence criteria, labels, span validation and all numerical gates were unchanged. The runner changed only its selected corpus and frozen-hash filenames. No semantic exceptions or discarded evaluation runs were used.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 6 / 12 (50%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 6 / 6 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 6 / 6 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Six expected findings were missed and no unmatched emissions occurred. The evaluator reported only aggregate counts and did not inspect or release v4 per-case diagnostics. Drafts and labels remain outside repository sources and normal handoffs. Every earlier reserved failure and consumed-regression result remains recorded above.

The repeated gap between consumed-case results and fresh reserved coverage is a material engineering limitation. On this set the emitted findings were useful under the frozen labels, but half the selected concerns were missed. These counts do not support a claim that the original detection acceptance gate has been met. The four corpora are different, the labels are agent-authored, and iterative development was informed by consumed examples; this history must accompany any description of evaluation results. It is not an unbiased estimate of real-world accuracy or evidence of human usefulness.

After v4 failed, the lead authorised consumed diagnostic use for repair. Before inspecting or releasing v4 diagnostics, the evaluator froze v5 at `2026-09-10T13:13:53.421426+00:00`, SHA256 `5ae0afa9944f9266ef571e047f0ee96a85f5e8f5533f8f713f5415931dcd1e36`. It retains twelve drafts, four controls, twelve expected findings, all five families, original matching/gates and pre-recorded scope rationales. A pre-evaluation drafting self-review replaced one thematic overlap before this final freeze; no engine invocation or evaluation result was discarded. All v1–v4 labels and results remain unchanged.

The evaluator then inspected the authorised v4 diagnostics and verified that all six misses were absent rule outputs, not rejected span matches or cap displacement. Bounded diagnostic wording and rationales went directly to the lead and engine agent for local repair; no raw fixtures or labels were added to repository sources or ordinary handoffs. V4 is now consumed regression material, never a new heldout set. V5 remains sealed and unrun until an explicit reviewed-candidate instruction. No implementation, development fixture, demo or reviewer source was read by the evaluator.

## Consumed v1–v4 regression check

At 13:20 UTC, candidate SHA256 `12a347c1d7c755feae7a26524c7de286a7fb39e1c345d86b179d683bc12a7612` was checked against all four consumed corpora after the authorised grammar/concept repairs. The engine hash was unchanged before and after all four runs; original corpus hashes, labels, evidence criteria and thresholds were preserved.

| Consumed set | Expected findings matched | Useful emissions | Clean-control emissions | Valid emitted spans |
| --- | --- | --- | --- | --- |
| V1 | 12 / 12 | 12 / 12 | 0 across four controls | 12 / 12 |
| V2 | 11 / 12 | 11 / 11 | 0 across four controls | 11 / 11 |
| V3 | 12 / 12 | 12 / 12 | 0 across four controls | 12 / 12 |
| V4 | 12 / 12 | 12 / 12 | 0 across four controls | 12 / 12 |

All six original v4 misses were recovered under unchanged labels. Across 48 consumed drafts, all 47 emissions matched useful labels and had exact evidence spans; there were no clean-control findings, cap violations or execution errors. The known v2 miss remained. Each consumed set met the original numerical thresholds, as regression evidence only. All four original reserved failures remain above. V5 remained sealed and unrun.

## Fresh reserved evaluation v5

The lead authorised exactly one sealed v5 evaluation after independent review and consumed v1–v4 verification of the frozen candidate. It ran at `2026-09-10T13:22:44.010Z`. **The candidate fails the reserved detection gate.** No repeat was performed.

- Evaluated engine SHA256: `12a347c1d7c755feae7a26524c7de286a7fb39e1c345d86b179d683bc12a7612`.
- V5 corpus frozen at `2026-09-10T13:13:53.421426+00:00`, before v4 diagnostics were inspected or released and before subsequent repairs.
- V5 corpus SHA256: `5ae0afa9944f9266ef571e047f0ee96a85f5e8f5533f8f713f5415931dcd1e36`.
- Candidate and corpus hashes were verified unchanged before and after the single run.
- Twelve fictional customer onboarding drafts: four clean controls and twelve expected findings across eight other drafts, covering all five families within the three-finding cap. Scope rationales, evidence regions, anchors and labels were frozen together before evaluation.
- The evaluator knew previous aggregate failures but created v5 before inspecting v4 diagnostic details, and read no implementation, development fixtures, demos or reviewer source. The pre-evaluation drafting correction is recorded above; it was never run against an engine. No evaluation results were discarded.
- Implementation agents and the lead received no v5 drafts, labels, close paraphrases or per-case diagnostics during repairs. Original matching criteria, gates and labels were retained without semantic allowances. Runner logic changed only its selected corpus/hash-file names.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 7 / 12 (58.3%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 7 / 7 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 7 / 7 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Five expected findings were missed; no unmatched emissions occurred. The evaluator reported only aggregates and did not inspect or release v5 per-case diagnostics. Raw drafts and labels remain outside repository sources and ordinary handoffs. All four earlier failed reserved attempts and every consumed-regression result remain preserved.

The five reserved attempts demonstrate a continuing coverage limitation against the original engineering contract despite strong known-case regression performance. The latest emitted findings met their frozen usefulness labels, but detection remains below the acceptance threshold. Iterative repairs, different small corpora and agent-authored labels prevent these numbers from being interpreted as an unbiased real-world accuracy estimate. The original evaluation gate is still unmet, and engineering readiness must not be claimed on the strength of other passing checks.

After the fifth failure, the lead authorised v5 diagnostic consumption. Before inspecting or releasing those diagnostics, the evaluator froze fresh v6 at `2026-09-10T13:25:27.445753+00:00`, SHA256 `bfc8c9a7beed78a47c9e0968ff0d0df2a3e1274ab5a5ce3699ed27beb93e5115`. It retains twelve drafts, four clean controls, twelve expectations, all five families, pre-recorded scope rationales and unchanged criteria/gates. No implementation, development fixture, demo or reviewer source was read.

The evaluator then verified that all five v5 misses were absent rule-family outputs, rather than evidence-match rejection or cap displacement. Bounded diagnostics, adjacent context and frozen rationales were sent directly to the lead and engine for local repair; no raw fixtures or labels were added to shared sources. Across consumed sets, recurring gaps concern ordinary owner grammar, dependent timing and proposal/agreement status or explicit adjacent references; earlier runs also exposed variation in product commitment wording. This is a coarse diagnostic observation, not an accuracy estimate. All five original failures and labels remain unchanged. V5 is now consumed regression material; v6 remains sealed and unrun until the lead authorises a reviewed candidate.

## Runtime integrity method for subsequent candidates

Following the engine split into multiple runtime modules, subsequent freezes use an explicit root-approved runtime manifest rather than an entry-file hash alone. The manifest is `{schemaVersion: 1, files, sha256}`. Files are sorted lexicographically by repository-relative path, each entry is `{path, sha256}`, and the manifest hash is SHA256 of the UTF-8 bytes of `JSON.stringify(files) + '\n'`. The approved list must cover the complete engine runtime import closure, including `index.ts`, `grammar.ts` and `types.ts`; test and fixture sources are excluded.

The evaluator prepared a wrapper that verifies every approved individual file hash, the sorted manifest hash and manifest document bytes before and after execution. It also verifies the frozen corpus hash before and after, preserves the original matching runner and gates, and refuses accidental reuse of an existing run tag. The lead supplies the complete approved runtime file list; the evaluator hashes implementation bytes without reading source to infer dependencies. Future aggregate records identify both the entry hash and full runtime manifest. The earlier records above accurately report their historical entry-file-only verification and must not be represented as full multi-file manifest checks. Preparation was syntax-checked only; no corpus was run and v6 remained sealed.

The lead also clarified that vague-timing scope requires an explicitly stated dependent next step, as already specified in the original product brief. A broader secondary contract phrase was corrected to match that brief. No original development or reserved/consumed labels, denominators, frozen corpora or thresholds changed. Any later substantive label/scope disagreement must be reported separately rather than silently relabelled.

## Consumed v1–v5 check with complete runtime manifest

At 13:42 UTC, the evaluator checked all five consumed sets using approved runtime manifest SHA256 `dcd245b46005d061b8506648f2bb02a39e4712c8e2f56d691b4671302dc239a5`. The individual runtime file hashes, canonical manifest digest, manifest document and frozen corpus hashes were all verified unchanged before and after each run.

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/grammar.ts` | `32c7665cd688705b4451118d75450c747c2ec8df4da152fb0d0ba1b1082b4acf` |
| `web/src/engine/index.ts` | `4ea4a64b2f34e9e994a878217525373e24571fa55ffff43d4477268381a57fdc` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

| Consumed set | Expected findings matched | Useful emissions | Clean-control emissions |
| --- | --- | --- | --- |
| V1 | 11 / 12 | 11 / 11 | 0 across four controls |
| V2 | 11 / 12 | 11 / 11 | 0 across four controls |
| V3 | 12 / 12 | 12 / 12 | 0 across four controls |
| V4 | 12 / 12 | 12 / 12 | 0 across four controls |
| V5 | 12 / 12 | 12 / 12 | 0 across four controls |

Across 60 consumed drafts, all 58 emissions matched useful labels and had exact original spans. No cap violations or errors occurred. All v5 misses were recovered, but one previously detected v1 timing expectation was newly missed; its original text includes an explicit dependent step, so this is not a direct-request-only scope disagreement. The evaluator delivered that diagnostic privately to the engine agent. The known v2 miss remained. Original labels, denominators and thresholds were unchanged. All consumed sets met numerical thresholds as regression evidence only; all five reserved failures remain intact. V6 remained sealed and unrun.

At 13:44 UTC, the evaluator reran consumed v1–v5 using replacement runtime manifest SHA256 `bf2081d59891dc001196eea8b5bc067589b7f23b1fdcc18bca93566ba08609e2`. Only `grammar.ts` changed, to SHA256 `f7a76a51cfd39521bd98dab1d50507d7ea38daba2ed85e38c499692546d922e3`; `index.ts` and `types.ts` retained the individual hashes listed above. All runtime files, the full canonical manifest, manifest document and each corpus were unchanged before/after evaluation.

Expected matches were v1 12/12, v2 11/12, v3 12/12, v4 12/12 and v5 12/12, with 59/59 useful emissions and zero clean-control findings, invalid spans, cap violations or errors. The new v1 timing regression was recovered; the prior v2 miss remained. Original labels and criteria were unchanged. These remain consumed regression results, and all five original reserved failures are preserved. V6 remained sealed and unrun.

At 13:49 UTC, consumed v1–v5 were checked against runtime manifest SHA256 `e152aaee36ce9ac7596b695959ae85eba1e9f93284c892a0d3638812c8d31772`. `grammar.ts` was SHA256 `af4bab20b26f7a3f755515b5519dc7ab647f6d9d15acd6b95f39dbe092bb3f64`; `index.ts` and `types.ts` retained their earlier manifest hashes. All runtime files, manifest/document and corpora were verified unchanged before/after each run. Expected matches remained 12/12, 11/12, 12/12, 12/12 and 12/12 respectively, with 59/59 useful emissions and zero clean-control findings, invalid spans, cap violations or errors. Labels and gates were unchanged, all original failures remain, and v6 was not run.

## Fresh reserved evaluation v6

The lead explicitly authorised exactly one sealed v6 run on reviewed commit `3cbe8467d9d25e0ef587334ce8f8b8112c38149d`. It ran at `2026-09-10T13:52:26.337Z`. **The candidate fails the reserved detection gate.** The runner enforced a unique run tag; no repeat occurred.

The corpus was frozen at `2026-09-10T13:25:27.445753+00:00`, before v5 diagnostics were inspected or released and before the subsequent grammar refactor. Corpus SHA256 is `bfc8c9a7beed78a47c9e0968ff0d0df2a3e1274ab5a5ce3699ed27beb93e5115`. It retains twelve fictional customer onboarding drafts, four clean controls and twelve expected findings across the other eight drafts, covering all five families. Labels, scope rationales, acceptable evidence regions and anchors were frozen before evaluation, with unchanged original matching criteria and gates.

The root-approved complete runtime manifest was supplied from `.handoff/ENGINE_CANDIDATE.json`, with SHA256 `e152aaee36ce9ac7596b695959ae85eba1e9f93284c892a0d3638812c8d31772`. The lead verified the committed and working runtime manifests matched before authorising execution. The evaluator independently verified all individual working-source hashes, the canonical manifest digest, manifest document bytes and corpus hash before and after the single invocation:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/grammar.ts` | `af4bab20b26f7a3f755515b5519dc7ab647f6d9d15acd6b95f39dbe092bb3f64` |
| `web/src/engine/index.ts` | `4ea4a64b2f34e9e994a878217525373e24571fa55ffff43d4477268381a57fdc` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

Every integrity check passed. The evaluator hashed source bytes without inspecting implementation, development fixtures, demos or reviewer source. V6 was not provided to implementation agents or the lead during repairs. The evaluator knew prior aggregate failures and consumed v1–v4 diagnostics, but froze v6 before inspecting v5 diagnostics. Procedural separation was maintained; it was not an enforced sandbox.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 6 / 12 (50%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 6 / 6 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 6 / 6 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Six expectations were missed; no unmatched emissions occurred. Only aggregate counts were reported. The evaluator did not inspect or release v6 per-case diagnostics. Corpus, labels and detailed outputs remain outside repository sources and ordinary handoffs. All five preceding reserved failures and consumed-regression results remain preserved.

The six reserved attempts continue to show inadequate detection coverage under the unchanged product acceptance contract. The latest emitted findings were useful according to their frozen agent labels, but half the selected concerns were missed. Different corpora, repeated iteration and consumed-example repairs prevent these figures from being read as an unbiased accuracy estimate. Passing other engineering checks does not satisfy this separate gate; human usefulness, factual verification and market fit remain unestablished.

After v6 failed, the lead authorised its diagnostic consumption. Before reading or releasing any v6 diagnostic detail, the evaluator froze v7 at `2026-09-10T13:54:50.167214+00:00`, SHA256 `0d03e225b66da5965a132ab0b1a2675b434e4e874535b93f4bcfdcd3fd9bdb48`. The same twelve-draft/four-control/twelve-expectation/five-family structure, original criteria and gates were retained, with scope rationales frozen per label. No candidate run occurred during reservation, and no implementation, development or reviewer source was inspected.

All six v6 misses were then verified as absent family outputs, not span-match rejection or cap displacement. Exact consumed evidence, minimal adjacent context and frozen rationales were delivered directly to the lead and engine, outside shared sources and ordinary handoffs. The substantive diagnostic categories include negative-passive responsibility status, dependent timing vocabulary, same-entity affirmation/authorisation relations, and strong product promises expressed through varying nouns or predicates. No original label or result changed. V6 is now consumed regression material; v7 remains sealed and unrun pending explicit reviewed-manifest authorisation. All six historical failures remain preserved, and repeated small evaluations remain unsuitable as unbiased accuracy estimates.

## Consumed v1–v6 regression check

At 14:03 UTC, the evaluator ran consumed v1–v6 against full runtime manifest SHA256 `18e6122bea78a81fc73df7319edc878cfbcb5e3a2a124edd38b08e9d774da56e`. Every individual source hash, manifest/document and corpus hash was verified unchanged before and after each run. Runtime hashes were:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/grammar.ts` | `0b2d8cea8df94c6d395628608a689a70689ed06b2302d8259ba703690e4dd477` |
| `web/src/engine/index.ts` | `532bc245c569c1ccc450a8df74986fefb1d2a6d983d4572fa68744e4773e343b` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

Expected matches were v1 12/12, v2 11/12, v3 12/12, v4 12/12, v5 12/12 and v6 12/12. Across 72 consumed drafts, all 71 emissions matched useful labels and had valid original spans; there were zero findings across 24 clean controls, cap violations or execution errors. All six original v6 misses were recovered, with the prior v2 miss unchanged. Original labels and criteria remained fixed. These are consumed regression results only; all six reserved failures remain preserved, and v7 remained sealed and unrun.

At 14:06 UTC, consumed v1–v6 were checked against runtime manifest SHA256 `533e324f800ae798b97ac5b8834841a45781f9ca32bf87b26519eb858712424e`, following independently identified precision repairs. Individual hashes were `grammar.ts` = `d0e936266eb868bb58c40b3e2a98c643d0158fb3d04b482d385d0ef95944120d`, `index.ts` = `bb813cf4780a9aac90b4c6a27d8196acf87c6975521ad98df852b1fd471f4817`, and unchanged `types.ts` = `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b`. Every runtime source, manifest/document and corpus hash was unchanged before and after each run. Expected matches remained 12/12, 11/12, 12/12, 12/12, 12/12 and 12/12, with 71/71 useful emissions and zero clean-control findings, invalid spans, cap violations or errors. No labels or gates changed; v7 remained unrun and all six original failures remain preserved.

At 14:09 UTC, consumed v1–v6 were checked against runtime manifest SHA256 `d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243`. Individual runtime hashes were `grammar.ts` = `44dcf0c493c7b09638c17b10fc7df4ff2d4248336495ad757082de239ca61a0f`, `index.ts` = `4043ca0c8ad9b2cca8b64aa637017d55c8fc1ab9651de4c256197938068542fd`, and unchanged `types.ts` = `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b`. All source, manifest/document and corpus integrity checks passed before/after each run. Expected matches remained 71/72 (v2 11/12; each other set 12/12), with 71/71 useful emissions and zero clean-control findings, invalid spans, cap violations or errors. Original labels, thresholds and all six reserved failures were preserved; v7 was not run.

## Fresh reserved evaluation v7

The lead explicitly authorised exactly one sealed v7 run on independently reviewed commit `10d4e764c09938b61a04b2a3cd8cd48c7a091441`. It ran at `2026-09-10T14:10:29.784Z` with a unique runner tag. **The candidate fails the reserved detection gate.** No repeat occurred.

The v7 corpus was frozen at `2026-09-10T13:54:50.167214+00:00`, before any v6 diagnostics were inspected or released and before subsequent repairs. Corpus SHA256 is `0d03e225b66da5965a132ab0b1a2675b434e4e874535b93f4bcfdcd3fd9bdb48`. Twelve fictional customer onboarding drafts retain four clean controls and twelve selected expected findings across eight other drafts, covering all five families within the three-finding cap. Original gates, one-to-one matching, scope rationales, labels, evidence regions and anchors were frozen before evaluation and unchanged thereafter.

The complete approved runtime manifest from `.handoff/ENGINE_CANDIDATE.json` had SHA256 `d9b899b1f05c76f08ab47f536d3095ca1c681c89e480613851421d9db145e243`. The lead verified the committed/working runtime match before authorising execution. The evaluator independently verified every listed working-source hash, the full manifest, manifest document and corpus hash before and after the run:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/grammar.ts` | `44dcf0c493c7b09638c17b10fc7df4ff2d4248336495ad757082de239ca61a0f` |
| `web/src/engine/index.ts` | `4043ca0c8ad9b2cca8b64aa637017d55c8fc1ab9651de4c256197938068542fd` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

Every integrity check passed. The evaluator read no implementation, development fixtures, demos or reviewer source. The lead and engine received no v7 fixtures, labels or diagnostic details during repairs. Prior aggregate failures and consumed v1–v5 diagnoses were known to the evaluator; v7 was frozen before v6 diagnostics were read. Separation is procedural, not an enforced sandbox.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 6 / 12 (50%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 6 / 6 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 6 / 6 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Six expected findings were missed; no unmatched emissions occurred. The evaluator reported aggregates only and did not inspect or release v7 per-case diagnostics. Corpus, labels and details remain outside repository sources and normal handoffs. All six preceding failed reserved evaluations and every consumed-regression result remain preserved.

The same coverage gate remains unmet after seven fresh attempts. Strong development-matrix, code-review and consumed-example results do not establish adequate performance on the reserved examples. Universal accuracy or human-usefulness claims would be unsupported: the sets are small, fictional, agent-labelled and used within repeated iterative development. The history must be disclosed together; none of the earlier failed attempts should be omitted from an account of the result. Other passing engineering checks do not satisfy this separate detection requirement.

After v7 failed, the lead paused further fresh evaluations pending a broader independent development coverage audit. Before any v7 diagnostics were inspected or released, the evaluator froze v8 at `2026-09-10T14:14:15.749274+00:00`, SHA256 `222f0adcdb68c89450ad4de83187b63ef778c0297bc5d499896577de9c8a200a`. It retains twelve drafts, four clean controls, twelve expectations and all five families, with original matching/gates and pre-frozen rationales. A pre-evaluation self-review replaced one thematic overlap before final freeze; no engine invocation or result was discarded. No implementation, development or reviewer source was inspected.

The authorised consumed-v7 diagnostic review found six absent family outputs, rather than rejected spans or cap displacement. Exact evidence, minimal adjacent context and frozen rationales went directly to the lead and engine outside shared sources and normal handoffs. Coarse coverage categories concern active-negative assignment and indefinite group responsibility, agreement aspect and unresolved approval status, existential financial promises, and universal product capability wording. No original labels or results changed. All seven failed reserved attempts remain visible. V7 is now consumed regression material; v8 remains sealed and unrun while the broader audit proceeds. Any eventual passing small-set result cannot erase this history or establish unbiased accuracy or human usefulness.

## Consumed v1–v7 regression check

At 14:38 UTC, consumed v1–v7 were checked with full runtime manifest SHA256 `434abdcb026e797b9fde4f11f4dde48c87e29522545919a1bf6c19dd14c16421`. The approved closure now includes five runtime files:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/agreement.ts` | `64bc7e3051a575911dc20b83c936081ea53374c8fc15481267e96a7dc407f069` |
| `web/src/engine/commitment.ts` | `c34a492d1c06aa59c25ca659d65cad191b847a57f436614bd8382409de7569dd` |
| `web/src/engine/grammar.ts` | `a170eebc93089f13447f0572f86f792689eb73706dc25935f2101c2127996001` |
| `web/src/engine/index.ts` | `6b3c2fea5ef291adf59a588d8a5c0266345af53901f86a10bc1a250115620f74` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

Every individual runtime hash, full manifest/document and corpus hash was verified unchanged before and after each run. Expected matches were v1 12/12, v2 11/12, v3 12/12, v4 12/12, v5 11/12, v6 12/12 and v7 12/12. All 82 emissions matched useful labels with valid spans; there were zero findings across 28 clean controls, cap violations or execution errors. All v7 misses were recovered, but a new v5 timing regression with an explicit dependent step was identified and sent privately to the engine agent. The known v2 miss remained. Original labels and gates stayed unchanged. Each consumed set met numerical thresholds as regression evidence only; all seven reserved failures remain preserved. V8 remained sealed and unrun.

At 14:46 UTC, consumed v1–v7 were checked once per corpus on full manifest SHA256 `c43d1866b582f5772c28af469d375bfdaf26a790247ce4a870784b8320a84245`, with the unchanged complete five-module import closure confirmed by the lead. Changed individual hashes were `agreement.ts` = `25c7238250299f6bed98a61d73b95d4bd026ea2e52e361b11c75859c9c286200`, `grammar.ts` = `bc0a60814d2a3181084d5d403c6e9d6330fd27f7da2eadd220cb37df2787e2b4`, and `index.ts` = `f986ee9f49812a97ae8ee1e49669b5d733ce657585bcb3da68d34e920353cfb5`; `commitment.ts` and `types.ts` retained the preceding listed hashes. Every runtime source, manifest/document and corpus hash was unchanged before/after execution. Expected matches were 12/12, 11/12, 12/12, 12/12, 12/12, 12/12 and 12/12, with 83/83 useful emissions and zero clean-control findings, invalid spans, cap violations or errors. The v5 timing regression was recovered. Original labels, criteria and all seven reserved failures remain unchanged; v8 remained sealed and unrun.

## Fresh reserved evaluation v8

The lead explicitly authorised exactly one fresh v8 evaluation on reviewed, committed candidate `558c66de18dab75931cf5ee3e0ad7a1b20638d06`. It ran at `2026-09-10T14:48:31.394Z` using a unique runner tag. **The candidate fails the reserved detection gate.** No repeat occurred and no subsequent corpus was created.

V8 was frozen at `2026-09-10T14:14:15.749274+00:00`, before v7 diagnostic details were inspected or released and before the subsequent development coverage audit and repairs. Corpus SHA256 is `222f0adcdb68c89450ad4de83187b63ef778c0297bc5d499896577de9c8a200a`. It retains twelve fictional customer onboarding drafts, four clean controls and twelve preselected useful findings across the other eight drafts, covering all five families within the three-finding cap. Original labels, pre-recorded scope rationales, regions, anchors, matching criteria and gates remained unchanged. The pre-evaluation drafting correction is recorded above; it was never run against the candidate and discarded no result.

The root-approved complete runtime manifest from `.handoff/ENGINE_CANDIDATE.json` had SHA256 `c43d1866b582f5772c28af469d375bfdaf26a790247ce4a870784b8320a84245`. The lead verified that working and committed runtime manifests matched before execution. The evaluator independently verified all five individual runtime hashes, the full manifest, manifest document and corpus hash before and after the run:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/agreement.ts` | `25c7238250299f6bed98a61d73b95d4bd026ea2e52e361b11c75859c9c286200` |
| `web/src/engine/commitment.ts` | `c34a492d1c06aa59c25ca659d65cad191b847a57f436614bd8382409de7569dd` |
| `web/src/engine/grammar.ts` | `bc0a60814d2a3181084d5d403c6e9d6330fd27f7da2eadd220cb37df2787e2b4` |
| `web/src/engine/index.ts` | `f986ee9f49812a97ae8ee1e49669b5d733ce657585bcb3da68d34e920353cfb5` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

Every integrity check passed. The evaluator read no implementation, development fixture, demo or reviewer source. V8 drafts, labels, paraphrases and diagnostics were not supplied to the lead or engine during repairs. The evaluator knew prior aggregate failures and consumed v1–v6 diagnostics, but froze v8 before reading v7 diagnostics. Procedural separation was maintained and is not an enforced sandbox.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 8 / 12 (66.7%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 8 / 8 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 8 / 8 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Four expected findings were missed; no unmatched emissions occurred. The evaluator reported aggregate results only and did not inspect or release v8 per-case diagnostics. Corpus and labels remain outside repository sources and normal handoffs. All seven preceding reserved failures and consumed-regression history are preserved. No original label or acceptance threshold changed.

This eighth fresh attempt still falls below the frozen detection threshold. Its higher raw count than the immediately preceding set does not establish a controlled improvement because the corpora differ. Iterative repair, repeated small sets and agent-authored labels prevent an unbiased real-world accuracy interpretation. Any later result must retain this entire history and its limits. Passing other checks does not satisfy the unmet coverage gate, and these evaluations do not establish factual verification, human usefulness or market fit.

After v8 failed, the lead authorised bounded diagnostic consumption. Before any v8 diagnostic was inspected or released, the evaluator froze v9 at `2026-09-10T14:51:01.072352+00:00`, SHA256 `d6541cfdb9515675dc3e7a1a4ab873c7d7804f735c7b299ee1db2a4e1e364d89`. It retains twelve drafts, four clean controls, twelve expectations and all five families, with unchanged original matching/gates and pre-frozen scope rationales. No candidate ran during reservation and no implementation, development or reviewer source was read.

The authorised v8 review found four absent family outputs, not span-match rejection or cap displacement. Exact evidence, frozen rationales and minimal adjacent context were delivered directly to the lead and engine outside shared sources and normal handoffs. Coarse categories concern passive owner vacancy, separable sign-off wording, zero-incremental-cost inclusion, and vague temporal qualification on an explicit prerequisite. No labels, denominators or historical results changed. All eight failures remain preserved. V8 is now consumed regression material; v9 remains sealed and unrun until explicit authorisation for a reviewed committed candidate. No further broad audit campaign or fresh evaluation was initiated by the evaluator.

## Consumed v1–v8 regression check

At 14:55 UTC, consumed v1–v8 ran once each under full runtime manifest SHA256 `ef17ba80358dee9ddcfbdab0acaa9e86df563f209730eb55b235637b523f71d6`, with the unchanged complete five-file closure confirmed by the lead. Changed runtime hashes were `agreement.ts` = `18dd5c1cff81f27d173bd380770a7f5580cb3ef595c79ac2dc62b83c5b8d2f26`, `commitment.ts` = `083297562a92cf9a9695a7c0e5af4c420305540a226ac0c5ba208abd56701b1e`, and `grammar.ts` = `77bc4b2f071a5c239b90ccc13c30e2356c6941b7f6497285a98a3138e720d20d`; `index.ts` and `types.ts` retained the preceding listed hashes. All runtime source, manifest/document and corpus hashes were verified unchanged before/after each run.

Expected matches totalled 95/96: v2 remained 11/12, while each of v1 and v3–v8 matched 12/12. All 95 emissions matched useful labels and had exact spans. There were zero findings across 32 clean controls, cap violations or execution errors across the 96 consumed drafts. All four original v8 misses were recovered. Original labels, denominators and thresholds were unchanged. These are consumed regression results only; all eight original reserved failures remain preserved. V9 remained sealed and unrun.

## Fresh reserved evaluation v9

The lead explicitly authorised exactly one fresh v9 run on reviewed, committed candidate `487fec81307d9ea8d214d7480a164abd89e9aa95`. It ran at `2026-09-10T14:57:35.493Z` with a unique runner tag. **The candidate fails the reserved detection gate.** No repeat occurred and no subsequent corpus was created.

V9 was frozen at `2026-09-10T14:51:01.072352+00:00`, before v8 diagnostic details were inspected or released and before the subsequent bounded repairs. Corpus SHA256 is `d6541cfdb9515675dc3e7a1a4ab873c7d7804f735c7b299ee1db2a4e1e364d89`. The original twelve-draft/four-clean/twelve-expectation/five-family structure and three-finding cap were preserved. Labels, scope rationales, evidence regions, anchors, one-to-one matching and all numerical gates were frozen before evaluation and unchanged thereafter.

The complete runtime manifest from `.handoff/ENGINE_CANDIDATE.json` had SHA256 `ef17ba80358dee9ddcfbdab0acaa9e86df563f209730eb55b235637b523f71d6`. The lead verified working and committed manifests matched before authorisation. The evaluator independently verified all five source hashes, full manifest, manifest document and corpus hash before and after the run:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/agreement.ts` | `18dd5c1cff81f27d173bd380770a7f5580cb3ef595c79ac2dc62b83c5b8d2f26` |
| `web/src/engine/commitment.ts` | `083297562a92cf9a9695a7c0e5af4c420305540a226ac0c5ba208abd56701b1e` |
| `web/src/engine/grammar.ts` | `77bc4b2f071a5c239b90ccc13c30e2356c6941b7f6497285a98a3138e720d20d` |
| `web/src/engine/index.ts` | `f986ee9f49812a97ae8ee1e49669b5d733ce657585bcb3da68d34e920353cfb5` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

Every integrity check passed. The evaluator read no implementation, development fixture, demo or reviewer source. V9 drafts, labels and diagnostic details were withheld from the lead and engine during repairs. Prior aggregate failures and consumed v1–v7 diagnoses were known to the evaluator, but v9 was frozen before v8 diagnostics were read. This separation is procedural and is not an enforced sandbox.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 5 / 12 (41.7%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 5 / 5 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 5 / 5 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Seven expected findings were missed; no unmatched emissions occurred. The evaluator reported aggregates only and did not inspect or release v9 per-case diagnostics. Corpus, labels and details remain outside repository sources and normal handoffs. All eight preceding reserved failures and consumed-regression history remain preserved; no label, denominator or threshold changed.

The ninth fresh attempt still fails the original coverage requirement. Counts across different small corpora do not form a controlled improvement estimate. Repeated iteration informed by consumed examples, fictional examples and agent-authored labels make these engineering probes unsuitable as unbiased real-world accuracy estimates. Every result and its history must remain visible. Passing other checks does not satisfy this separate detection gate or establish human usefulness, factual verification or market fit.

After v9 failed, the lead paused further fresh evaluations for an architectural assessment of browser-local deterministic parsing. Before inspecting or releasing v9 diagnostics, the evaluator froze v10 at `2026-09-10T15:01:08.487121+00:00`, SHA256 `0078003fcd897c39d97b051dea795ba5f0f308fcd6cb598b469e395fb808e10b`. Original corpus size, four clean controls, twelve expectations, all five families, scope rationales and matching/gates were retained. No candidate execution occurred and no implementation, development or reviewer source was read.

Authorised v9 diagnostics were then verified as seven absent family outputs, not evidence-match rejection or cap displacement. Minimal exact evidence, local context and frozen rationales were delivered privately to the lead and engine, outside shared sources and ordinary handoffs. Aggregate cause categories concern temporal idioms, financial polarity semantics, indefinite owner phrase composition, nominalised delivery outcomes, same-reference approval/authorisation meaning, and universal product capability wording. No original labels or results changed; all nine reserved failures remain preserved. V9 is now consumed regression material. V10 remains sealed and unrun pending explicit root authorisation after a justified implementation and independent review, not an automatic continuation of wording repairs.

## Consumed v1–v9 regression check

At 15:18 UTC, consumed v1–v9 ran once each on full six-file runtime manifest SHA256 `3bedb1fbffd890207014a6389bf596dddb551795896bcb4e983a2ca5da77ae37`. The approved closure added `outcomes.ts`. Individual runtime hashes were:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/agreement.ts` | `b12ac712cb00171160f34f17c25f6e74cee85923e693d30fbb9fb65c9edd2506` |
| `web/src/engine/commitment.ts` | `10277137dcbae8d6d8505f0bd63fba0fb2e27f45e319af1ae79c68945a6dbad9` |
| `web/src/engine/grammar.ts` | `a581eb142471ba7ad98b87159e608d7d4e6e6d8cbae644f680450cd8e8f0e23c` |
| `web/src/engine/index.ts` | `f986ee9f49812a97ae8ee1e49669b5d733ce657585bcb3da68d34e920353cfb5` |
| `web/src/engine/outcomes.ts` | `95d8e116443f8bd8c4245985404b9491aae57f67936450e4a2ff7daf8ff589df` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

All six runtime source hashes, full manifest/document and every corpus hash were verified unchanged before and after execution. Expected matches totalled 107/108: v2 remained 11/12 and every other set matched 12/12. All 107 emitted findings matched useful labels with exact spans; there were zero findings across 36 clean controls, cap violations or execution errors across 108 consumed drafts. All seven original v9 misses were recovered. No original labels, matching criteria or gates changed. These are consumed regression results only; all nine reserved failures remain preserved. V10 remained sealed and unrun.

At 15:46 UTC, consumed v1–v9 ran once each on the root-approved complete six-file manifest SHA256 `6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125` from `.handoff/ENGINE_CANDIDATE.json`. Relative to the preceding six-file table, `grammar.ts` changed to SHA256 `c74c1ab0aa85b55e97d5c628e9badd0b164011abe1ec5dd39135775af6d78398` and `outcomes.ts` changed to `3e3e25902468fbbca63fcc44f9a8f40b32f21e4705f0697b0ffd93083b0bc462`; `agreement.ts`, `commitment.ts`, `index.ts` and `types.ts` retained their listed hashes. All individual runtime files, full manifest/document and corpus hashes were unchanged before and after each execution. Expected matches remained 107/108 (v2 11/12, all other sets 12/12), with 107/107 useful emissions and zero clean-control findings, invalid spans, cap violations or errors. Original labels, matching and gates stayed unchanged. All nine original reserved failures remain visible; v10 remained sealed and unrun.

## Fresh reserved evaluation v10

The lead explicitly authorised exactly one fresh v10 run on reviewed committed candidate `d1230d6d066bc4a8eef9aa08d7818c1404d09c04`. It ran at `2026-09-10T15:48:01.691Z` with a unique runner tag. **The candidate fails the reserved detection gate.** No retry occurred, no per-case diagnostic was inspected or released, and no subsequent corpus was created.

V10 was frozen at `2026-09-10T15:01:08.487121+00:00`, before v9 diagnostic details were inspected or released and before the subsequent architectural work. Corpus SHA256 is `0078003fcd897c39d97b051dea795ba5f0f308fcd6cb598b469e395fb808e10b`. Original size, four clean controls, twelve expected findings across eight other drafts, all five families and the three-finding cap were retained. Labels, scope rationales, evidence regions, anchors, matching and numerical gates were frozen and unchanged.

The complete runtime manifest from `.handoff/ENGINE_CANDIDATE.json` had SHA256 `6ad12d972791a07b8113294ad85a55b226d1eb9bce4b5690b20452c3e2ff0125`. The lead verified working and committed runtime manifests matched before authorisation. The evaluator independently verified every listed working-source hash, full manifest, manifest document and corpus hash before and after the single invocation:

| Runtime file | SHA256 |
| --- | --- |
| `web/src/engine/agreement.ts` | `b12ac712cb00171160f34f17c25f6e74cee85923e693d30fbb9fb65c9edd2506` |
| `web/src/engine/commitment.ts` | `10277137dcbae8d6d8505f0bd63fba0fb2e27f45e319af1ae79c68945a6dbad9` |
| `web/src/engine/grammar.ts` | `c74c1ab0aa85b55e97d5c628e9badd0b164011abe1ec5dd39135775af6d78398` |
| `web/src/engine/index.ts` | `f986ee9f49812a97ae8ee1e49669b5d733ce657585bcb3da68d34e920353cfb5` |
| `web/src/engine/outcomes.ts` | `3e3e25902468fbbca63fcc44f9a8f40b32f21e4705f0697b0ffd93083b0bc462` |
| `web/src/engine/types.ts` | `31fa1927cdf2a65caa5d4ad0ee7baf952604b126e8ab6b014cdcf304fae7307b` |

Every integrity check passed. The evaluator read no implementation, development fixture, reviewer source or private development audit. V10 examples and labels were not supplied to the lead or implementation agents during repairs. The evaluator knew earlier aggregate failures and consumed v1–v8 diagnostics, but froze v10 before v9 diagnostics were inspected. Separation was procedural, not an enforced sandbox.

| Measure | Observed | Gate | Result |
| --- | --- | --- | --- |
| Preselected useful findings detected | 4 / 12 (33.3%) | At least 10 / 12 | Fail |
| Emitted findings matching frozen useful labels | 4 / 4 (100%) | At least 90% | Pass |
| Emissions across four clean controls | 0 | Zero | Pass |
| Exact original evidence spans | 4 / 4 | All valid | Pass |
| Drafts exceeding three findings | 0 / 12 | Zero | Pass |
| Draft execution/result errors | 0 / 12 | Zero | Pass |

Eight expected findings were missed; no unmatched emissions occurred. Only aggregates were reported. Raw corpus, labels and diagnostic details remain outside repository sources and normal handoffs. All nine preceding failed reserved evaluations and every consumed-regression result remain preserved; no labels, denominators or thresholds were changed.

This tenth fresh attempt remains below the original detection requirement. The repeated gap between consumed-example results and reserved coverage is an unresolved engineering limitation. Different small sets, agent-authored labels and iterative development informed by consumed examples do not provide unbiased real-world accuracy estimates. The entire failure history must accompany any later claim about evaluation. Other passing checks do not satisfy the detection gate or establish human usefulness, factual verification or market fit.

## Post-v10 contract-fit audit and next experiment

After preserving the single failed result, the lead authorised diagnostic consumption
for an independent contract-fit audit. The auditor verified the private packet and
recomputed the unchanged matching against recorded outputs only, without another
engine invocation. All twelve original labels and four clean controls were judged
defensible within the frozen product scope. All eight misses lacked their family
output; affected drafts emitted at most one finding. Matching regions, anchors and
the three-finding cap did not explain the misses. No label, denominator, result or
threshold was changed. The auditor knew the implementation and had authored some
development cases; this is contract judgment after diagnostic access, not a blind
test or human validation. Raw material remains outside shared sources.

No v11 corpus or fresh run is authorised. A separate architecture assessment supports
one isolated deterministic semantic-composition experiment, with a precise private
contract and one independent 60-case development challenge before integration.
The challenge and its all-case/clean/span/pair criteria are described in the
implementation plan. No stage result is yet claimed. Passing that bounded slice
would not satisfy or replace the original five-family reserved acceptance gate.

After the v10 failure was preserved, the lead authorised diagnostic consumption and an independent contract-fit audit, with source changes, further engine runs and new corpora paused. The evaluator prepared a private audit packet outside repository sources containing exact frozen v10 text, all labels/rationales/regions/anchors, original matching/gates, original result details, runtime hashes and commit provenance. The original corpus hash was verified unchanged; the packet has its own integrity manifest. No label, result or denominator was altered.

The diagnostic review verified that all eight misses are absent corresponding family outputs, not rejected exact-span matches or display-cap displacement. Minimal exact evidence and original frozen rationales were delivered privately to the lead only for the audit. The independent auditor is to assess contract fit and record substantive disagreements separately, without silently relabelling or changing historical counts. No engine execution, wording repair, new corpus or fresh evaluation was performed. All ten original failures remain preserved; v10 is consumed for diagnosis only.
