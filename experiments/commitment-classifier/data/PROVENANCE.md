# Synthetic development data provenance

Created 2026-10-13 by the Product Manager AI agent for this authorised local
experiment. All 150 passages are new fictional author-written examples, not
customer text, imported datasets or excerpts from prior reserved fixtures.
No historical heldout examples were read by this author. Labels are AI-authored,
not human validation.

The training split has 120 passages: 60 firm delivery assertions and 15 each
qualified delivery, requests, reported wording and other text. The development
split has 30 passages: 15 firm, four each qualified/request/reported and three
other. This artificial class balance does not estimate real email prevalence.

A positive label means the author directly makes an unqualified prospective
assertion that they or their team will deliver a work item. It does not mean the
assertion is wrong, unapproved, risky, achievable or worth a product finding.
Negatives include qualified/conditional intentions, requests, attributed or
quoted wording, past events, negations, hypotheticals and descriptions. Deliberately
mixed or ambiguous passages are excluded from these training/development labels.

Each group is a fictional business scenario containing its contrasting examples.
Fifteen training scenario groups and five development scenario groups are disjoint;
no exact text duplicates occur. This is scenario separation, not a guarantee of
independent linguistic templates. Common delivery verbs and natural-language cues
occur in both splits. Development includes some less conventional positive syntax,
but neither split establishes real-world generalisation. Both splits are visible
to implementation agents and development threshold selection may use the dev set.

The author checked all labels against the wording contract and verified counts,
unique IDs/texts, disjoint scenario groups, category/label agreement and the
2,000 UTF-16-unit passage limit. These are data-author checks, not independent
annotation. No test challenge data is present in this directory.
