# Communication Check — Solutions Engineering conversation notes

Prepared for Keith Grehan, 11 September 2026. This is a discussion aid, not a claim
of customer validation, a HubSpot integration or independently writing every line.
Use your own words and demonstrate only behaviours you can explain.

## A 30-second introduction

“I explored a small problem in customer onboarding: a follow-up email can leave
ownership or commitments unclear. Communication Check lets a writer inspect a few
prompts tied to exact wording, edit and copy the draft. I directed the product
scope and an AI-assisted build. It runs locally in the browser, with no runtime
AI model. It is a portfolio prototype; language coverage and customer usefulness
are not proven.”

## Three decisions to demonstrate

1. **Exact evidence.** A finding quotes the original draft. Select in draft reveals
   that same text, so the writer can inspect the basis of the prompt.
2. **Writer control.** Editing clears stale findings. Recheck reviews the current
   text; Copy copies that text. There is no rewrite or send action.
3. **Browser-local processing.** React manages the interface; a deterministic
   TypeScript function returns findings. Drafts and findings stay in page memory.

## Questions and grounded answers

**Who is it for?** B2B SaaS account managers and customer-success managers writing
customer onboarding follow-ups. The proposed benefit is clearer next steps; it
has not been measured with customers.

**How does the technical flow work?** The editor passes its unchanged string to
checkDraft. The result contains up to three findings with exact start/end offsets,
quoted text and review prompts. React displays these; the writer chooses what to
change. The engine is not a remote service.

**Why local rules?** They make this prototype inspectable and avoid transmitting
drafts to a model provider. The tradeoff is limited coverage of unfamiliar wording
and no understanding of what actually happened in a customer meeting.

**What supports the privacy statement?** The production app has no remote model,
analytics or draft persistence. Automated browser checks inspect network traffic,
URLs, logs and storage with fictional canaries, and check reload clearing/offline
behaviour. Static page requests still reach the host. Explicit Copy writes to the
OS clipboard, which can follow the user's clipboard-sync settings.

**Why do passing tests coexist with poor detection?** Functional and regression
tests check known behaviours. They do not prove performance on new language.
All ten reserved fictional evaluations missed the original detection target;
the latest detected 4 of 12 selected issues. That small result is not an estimate
of real-world accuracy. The failure history remains in the evaluation report.

**What was your contribution?** “I chose the audience and workflow, set boundaries,
prioritised a focused portfolio prototype, and directed the design refresh.
Codex/Astra agents implemented the code and performed documented engineering
checks.” Add personal testing or review only if you actually did it; distinguish
it from automated and agent review.

**How is this relevant to an SE conversation?** It provides a concrete way to
explain a customer problem, demonstrate a workflow, discuss architecture and
tradeoffs, and handle limitations honestly. It is supporting evidence for those
skills, not proof of seniority or a completed customer implementation.

**Does it integrate with HubSpot?** No. It is a standalone browser-local prototype.
Do not suggest it uses HubSpot APIs or that HubSpot endorses it.

**What would you test next?** Whether target users find the prompts useful enough
to return to the workflow, and whether a different detection approach would be
justified. No sessions or pilots have been completed. This refresh does not start
new research or recruitment.

## Walkthrough preparation

Use Promises to confirm → Try a sample review → Edit this wording → edit the
guarantee → Recheck → Copy. Then run Clear next steps and explain its caveat. Practise with the
existing demo script after the final UI is verified. A recording is optional.

The 11 September refresh passes 225 engine tests, seven setup checks and 28 local
plus 28 hosted browser checks. Fresh independent review found no material issues;
six deployed assets match the reviewed build. These are engineering results,
not evidence of broad language accuracy or customer usefulness.

## Publication boundary

Featured copy and conversation notes are prepared assets. No LinkedIn post,
video upload, customer outreach or recruiter message has been sent by this session.
