# Tone cues: bounded first-review correction

Authorized by Keith on 16 September 2026 after his first hands-on review.
Local branch: `codex/communication-check-tone-review`, starting at `4813014`.
The existing model-deferral decision, clarity engine and historical evaluations
remain intact. This document contains no customer draft or heldout material.

## Problem and decision

The three clarity demos returned no tone findings. The tone engine ran correctly
on supported wording, and exact selection/keep/undo worked, but the presentation
implied broader coverage than its three narrow rule families delivered. A natural
judgmental phrase lay outside those patterns. Functional tests did not establish
usefulness on ordinary writing.

The correction uses local deterministic rules and one additional fictional demo.
It does not add a model, sentiment score, rewriting, automatic analysis or general
context understanding. The lens is called **Tone cues**. Coverage is explained
before checking; intent changes the question, not what text is detected.

## Finite policy

The original three families remain: sweeping addressed accusations, dismissive
requests and extra pressure on requests. Extensions are limited to:

- Evaluative **not a good look**, with supported standalone/deictic and comma
  clause forms. Ordinary descriptions of a look at/view of something are excluded.
- Addressed **you should know better** framing.
- **As I already told you, [explicit request]** framing.
- Explicit requests ending with **no more excuses**.

Only the cue's intrinsic negation can be exempted from the old negation safeguard.
Other supported negation, quotation, conditional and reporting contexts suppress
findings. A prompt invites reconsideration and never establishes fault or infers
how a recipient feels. Maximum two findings; exact original UTF-16 spans.
See `FINDING_CONTRACT.md` for state and ownership requirements.

## Verification and stopping point

Implementation workers own disjoint UI and tone files. The lead integrates;
a fresh reviewer checks the final candidate. Development tests cover supported
forms, ordinary counterexamples, negation, quotation, reporting, boundaries,
repeated text and emoji. Browser checks cover the real demo and ordinary input,
both lenses, editing, current copy, keep/undo, intent, layout and runtime privacy.
Actual results are recorded in `VERIFICATION.md` after execution.

These are known-case development checks, not a fresh accuracy evaluation. No
reserved fixtures or historical labels are changed. Unfamiliar expressions,
sarcasm and implicit social context remain outside the promised coverage.

## Keith's review after delivery

No action is needed while the candidate is being built and checked. Once ready:

1. Load **Tone to reconsider** and run its tone check. Try Edit this wording,
   Keep as written and Undo. Edit should select text without rewriting it.
2. Paste your earlier wording and run Tone cues. Judge whether the quoted text
   and question help you decide what to change; an empty clarity result can be valid.
3. Try one ordinary follow-up that should need no tone intervention. Note any
   distracting flag. Change Direct/Collaborative/Warm to compare the question.

Report what was helpful, missed or distracting. The app has no feedback upload;
any examples shared back here are a separate voluntary action. Deployment and
merging remain separate from this local correction.
