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

A warm neutral background, dark teal accents and editorial typography give the
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
desktop and mobile screenshots, a 75-second walkthrough and a documented rollback
path. Product direction and decisions were coordinated with Codex/Astra agents;
this was an AI-assisted build.

The reviewed implementation passes 225 engine tests, seven setup/integrity checks,
and 19 local browser checks covering editing, clipboard, exact evidence, keyboard,
responsive layout and runtime privacy behaviour. The same 19 checks pass on the hosted preview; six deployed assets match the
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
