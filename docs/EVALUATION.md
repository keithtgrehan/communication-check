# Reserved fictional evaluation

## Current result

**Engineering evaluation gate remains unmet.** The single reserved v3 run on the reviewed candidate detected **6/12** preselected useful findings (required at least 10/12). All **6/6** emitted findings matched useful labels, and the four clean controls received **zero** findings. All emitted evidence spans were exact; there were no cap violations or execution errors.

Current evaluated engine SHA256: `028e2ef77a20991bc7e700ea6e47f6e8f88da1a367d35799685bfd5f921c09dc`. Evaluated at `2026-09-10T12:47:39.825Z`. Passing development and consumed-regression checks do not supersede this fresh reserved result. All three reserved attempts and subsequent consumed-regression runs are recorded below; no failed evaluation was discarded. These are fictional, agent-labelled engineering examples, not human validation or real-world accuracy estimates.

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
