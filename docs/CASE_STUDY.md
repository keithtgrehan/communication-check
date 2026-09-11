# Communication Check

**Make the next step clear.**

A focused portfolio prototype for reviewing customer onboarding follow-up emails.
[Try the working demo](https://communication-check-preview.onrender.com).

## The problem

A follow-up email can sound clear to its writer while leaving the customer unsure
who acts next, what takes priority, or whether a promise has been confirmed. I
explored a short review step for B2B SaaS account managers and customer-success
managers. This is a product hypothesis; customer demand and business impact have
not been validated.

## The experience

Paste a draft or try one of three fictional examples. Check it, inspect the exact
wording behind each prompt, edit, recheck and copy. The interface limits results
to three prompts so the review stays manageable. Every prompt can be dismissed;
the writer keeps the decision.

A warm white background, charcoal controls and restrained editorial typography give the
product a calm, focused feel. The desktop layout places the draft beside its
review. On smaller screens, the same sequence becomes a single column. Clear
focus states, keyboard controls and precise evidence selection support the core
workflow.

The product asks the writer to confirm a commitment. It never claims to know what
was agreed, assigns no score, and does not rewrite or send the email. An empty
result explains that facts and agreements have not been verified.

## The decisions behind it

The app runs a deterministic TypeScript checker inside a static React interface.
There is no remote model, account or backend. Drafts and findings stay in page
memory, and editing immediately clears stale results. Explicit copy uses the
current draft; reload clears the editor.

This keeps the interaction inspectable and avoids sending drafts to a service.
It also creates a clear tradeoff: the rules can miss unfamiliar wording and cannot
recover the context of a customer call. The three examples use the same engine as
pasted drafts; their results are not staged responses.

## What was delivered

A responsive working preview, three interactive demos, reviewed implementation,
desktop and mobile screenshots, a 75-second walkthrough script and a documented rollback
path. Product direction and decisions were coordinated with Codex/Astra agents;
this was an AI-assisted build.

The reviewed implementation passes 225 engine tests, seven setup/integrity checks,
and 28 local browser checks covering editing, clipboard, exact evidence, keyboard,
responsive layout and runtime privacy behaviour. The same 28 checks pass on the hosted preview; six deployed assets match the
reviewed local build. Automated browser checks are not a full
accessibility certification or human usability study.

## What I learned

Passing tests on known examples did not establish broad language coverage. All
ten reserved fictional evaluations missed the original detection target; the
latest detected 4 of 12 selected issues, with no flags across its four clean
controls. Those results remain visible in the evaluation report.

I chose to ship the polished portfolio prototype and stop the deeper parser
experiment for this delivery. The result demonstrates product scope, interaction
design, browser-local implementation and an honest approach to validation. It is
not presented as a reliable general-purpose writing assistant. Future product
work would start with real user feedback and a deliberate decision about detection
quality before expanding the scope.

## Preserved evaluation history

Every reserved attempt missed the original target of at least 10/12 selected
findings. These small fictional sets are not estimates of real-world accuracy.
No thresholds, labels or historical results were changed for portfolio delivery.

| Attempt | Expected findings detected | Useful emissions | Clean-control flags |
| --- | --- | --- | --- |
| V1 | 9/12 | 9/10 | 1 |
| V2 | 4/12 | 4/4 | 0 |
| V3 | 6/12 | 6/6 | 0 |
| V4 | 6/12 | 6/6 | 0 |
| V5 | 7/12 | 7/7 | 0 |
| V6 | 6/12 | 6/6 | 0 |
| V7 | 6/12 | 6/6 | 0 |
| V8 | 8/12 | 8/8 | 0 |
| V9 | 5/12 | 5/5 | 0 |
| V10 | 4/12 | 4/4 | 0 |

Detailed methods and preserved aggregate records remain in docs/EVALUATION.md.
