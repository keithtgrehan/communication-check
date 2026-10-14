# Shared wording-classification rubric v1

Unit: one English passage, at most 2,000 UTF-16 code units. Binary classification
of the supplied passage, not evidence-span extraction or email-level correctness.

Positive (`label=1`, `firm_delivery`): the author directly asserts that they or
their team will deliver a concrete work item in the future, with no stated
condition or uncertainty. Explicit promises, guarantees, definite future delivery,
scheduled future-progressive delivery and assured recipient receipt count.
Ordinary document-sharing promises count even where the product suppresses them.

Negative (`label=0`): `qualified_delivery` for conditional, tentative, estimated,
aspirational or planned-but-unassured delivery; `request` for asking the recipient
to act; `reported` for quoted, attributed or recalled assertions instead of a new
author assertion; `other` for negated, hypothetical, completed-past or descriptive
content. A quoted promise inside a report does not inherit a positive label.

Precedence: determine author/attribution and temporal scope, then negation and
conditions, then whether concrete delivery is asserted. An explicit assurance
counts even where wording contains 'can promise'; bare capability does not.
An intention or expectation alone is qualified; an explicit final 'we will do so'
assurance can resolve earlier schedule wording within an otherwise clear passage.
A stated action before an event is a deadline; 'when the source data is ready' is
a delivery dependency. Do not assume unstated conditions or approval.

Genuinely mixed/ambiguous examples belong outside primary binary scoring and are
not silently forced into training labels. This audit identified no exclusions
necessary among the 150 supplied development passages. That is AI author judgment,
not a claim of human inter-annotator agreement.

Positive never means incorrect, risky, unapproved, untrue, feasible or helpful to
flag. Negative never means the email is safe or contains no other problem. This
is the shared exploratory target for all compared models; useful review prompts
require a separately defined, human-reviewed product target.
