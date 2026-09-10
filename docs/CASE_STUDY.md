# Communication Check — portfolio case study

## Problem and audience

B2B SaaS account managers and customer-success managers often write follow-up
emails after customer onboarding calls. The intended next step may be obscured by
unclear ownership, loose timing, several competing requests or wording that sounds
more settled than the available context supports. This MVP explores whether a
small review can help before the writer sends the email. Customer demand and
measured benefit remain unvalidated.

## Product decision

Keep the workflow short: paste or try a fictional draft, check, inspect exact
wording, edit, recheck and copy. Show at most three prompts. The writer can dismiss
each one. There is no overall score, automatic rewrite, fact verification or send
action. A strong commitment triggers a confirmation prompt, not a claim that the
writer was unauthorised or wrong.

## Implementation and tradeoffs

React/Vite provides the interface; a deterministic TypeScript engine checks five
families of English wording. Both examples and pasted drafts call the same engine.
Original UTF-16 spans preserve exact quote/selection alignment, including Unicode.
Recognised quoted history and signatures are ignored without changing offsets.
Drafts and findings live in page memory; production resources are local static
assets and a restrictive connection policy complements runtime privacy tests.

Shared clause and token features recognise explicit requests, owners, timing
dependencies and approval references while retaining original evidence offsets.
This is bounded English grammar recognition rather than general language parsing.
Every runtime engine module contributes to a recorded candidate hash.

The rule set is inspectable and needs no remote model or backend. It also
misses unfamiliar paraphrases and some quotation formats, cannot recover meeting
context, and can surface wording that is appropriate in a particular situation.
One finding per family and the three-result cap can hide further concerns. These
limits are explicit in the product and evaluation report.

## Evidence and iteration

Eighteen development drafts and three demos were written separately from reserved
material. An independent evaluator froze labels and exact matching criteria before
running a fixed candidate. The first candidate missed the acceptance gates: 9/12
expected findings and one unnecessary clean-control flag. That result remains in
the report. A fresh reserved set was prepared before repairs; subsequent outcomes
are recorded in docs/EVALUATION.md rather than silently replacing the first run.

An independent reviewer reproduced conversational-timing, qualified-commitment,
offscreen selection and expanded-help contrast defects. Repairs receive specific
regressions and re-review. Browser automation checks real clipboard behaviour,
keyboard use, responsive layouts and runtime network/storage with fictional
canaries. See docs/VERIFICATION.md for actual evidence and limitations.

Ten successive reserved attempts have failed the original detection gate.
Strong results on previously observed examples did not transfer reliably to new
wording. A separate, fixed 100-case development audit exposed ordinary grammatical
gaps across all five families: the deployed baseline detected 16/50 intended
positive findings and left 49/50 clean controls unflagged. Those findings now guide
a shared clause-frame redesign and outcome/claim-scope repair. These repairs still
failed fresh evaluation. A contract audit found the test expectations within the
original scope; an architecture assessment supported one isolated experiment in
composing assignment, approval and financial states before further integration.
Inputs, labels, failure history and acceptance
criteria remain fixed. A later passing small fictional evaluation would not erase
this iteration history or establish real-world accuracy.

## Delivery and next decision

The repository stays private with a draft implementation PR. A separate provider
preview is for review, not a public product launch. The README links the current
interim preview and verification; the engineering goal remains unfinished.
Screenshots and a short demo script support a concrete
review; rollback instructions isolate this preview from other projects.

No human sessions or customer pilots have been run. The next evidence is three
usability sessions and five voluntary AM/CSM pilots, owned by Keith. A later
concept could pass human-approved RCR commitments to a writer and then this checker;
no integration or shared platform is implemented here.
