# Run a teaching round with Codex

Give Codex this instruction in the existing Communication Check project:

> Run one LLM teaching round using experiments/llm-teaching/RUN_WITH_CODEX.md.
> Use the approved wording rubric and local training workflow. Generate and review
> the fictional examples for me, train one candidate, and report the result.

The detailed procedure below is for Codex, not a list of manual labelling tasks
for Keith. The LLM authoring happens through Codex agents; training and prediction
run locally. No separate model API key or hosted inference endpoint is needed.

## Procedure for the coordinating agent

1. Read repository instructions, current product/progress records, this package's
   README and DESIGN, and the workflow command help. Inspect Git state. Reuse the
   existing local environment/model artifacts; preserve prior experiments and runs.
   Establish a unique batch/run ID. Do not overwrite an existing round.
2. Export the teaching kit with the CLI. Use the actual generated JSON schemas and
   rubric, not a guessed schema. Keep the target as author-owned unqualified future
   work-item delivery wording. Do not redefine it as risk, truth or useful feedback.
3. Delegate the teacher task to a bounded agent. Give it the exported teacher prompt,
   approved fictional TRAIN material/rubric and a proposal-file ownership path. Ask
   for at most 40 new fictional records across ten contrasting scenario families:
   at most 20 firm and five in each negative category. Never send customer drafts,
   private heldouts or raw development examples. Do not claim the teacher is blind
   if its prior conversation history includes these materials or evaluation results.
4. Freeze the proposal and generate the review kit. Delegate labelling to a different
   agent using only the generated shuffled opaque-ID/text packet and rubric. Do not
   give it the teacher's answers, rationale, groups or proposal file. The reviewer
   returns its own labels/uncertainty, bound to the packet and batch hashes. Record
   actual provenance honestly; configured model names are not verified telemetry.
5. Run preparation/validation. Inspect accepted and quarantined counts and reasons.
   Whole families with disagreement, ambiguity or overlap stay excluded. Do not
   silently relabel, loosen validation or replenish rows to get a preferred result.
   If no examples survive, report that outcome and stop without pretending training
   occurred. If a parent run is explicitly selected, verify its lineage and retain
   only accepted TRAIN additions; the original development records stay unchanged.
6. Have the independent reviewer inspect the prepared snapshot and have the lead
   review the implementation/integrity checks before training. Approval concerns
   the workflow and data contract, not a guarantee that model quality will improve.
   Do not ask Keith to repeat already-authorised routine implementation decisions.
7. Train exactly one candidate with the frozen recipe. Use the original pinned
   pretrained checkpoint, not a silently modified or warm-started encoder. Do not
   fit on development data or launch a parameter search. Preserve any failed
   attempt; diagnose runtime problems without changing the target or using test data.
8. Generate the development comparison against the saved baseline and any selected
   parent. Report full confusion counts, thresholds/gates, false-positive categories,
   data lineage and actual trained-weight/reload checks. A passing development rule
   is not independent validation or permission to integrate. Never reuse consumed
   private heldouts, select favourable runs after testing, or hide a worse result.
9. Verify applicable tests, saved-model prediction with networking blocked, rejection
   paths, input privacy and unchanged earlier artifacts/application. Complete a fresh
   independent review of the resulting package and update the existing project record.
   Follow the repository's allowlisted milestone handoff procedure.
10. Finish with what the LLM generated, what review accepted/excluded, whether the
    candidate improved on development examples, and the best next step. Link the
    run report. Stop after this one cycle; do not start an endless improvement loop.

## Boundaries

This instruction authorises a teaching round only when Keith asks Codex to run it.
The file itself does not create a goal, schedule jobs, call other threads or grant
release authority. No application edits, automatic promotion, browser export,
model publishing, deployment, customer-data collection or paid service belongs to
this workflow. Future product integration needs its own approval and appropriate
human usefulness review/fresh independent validation.
