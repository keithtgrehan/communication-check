# Create a teaching batch: teacher-demo-001

You are the teacher in a file-based Codex workflow. Create newly fictional English examples using the supplied rubric and batch.schema.json. Produce one batch of 40 passages in 10 new contrast families: each family has two firm-delivery assertions and two negative examples. Overall: 20 firm_delivery and 5 each qualified_delivery, request, reported, other. Use random opaque ex_<hex> example IDs and fam_<hex> family IDs, not category-coded names.

Vary wording and scenarios. Include meaningful negation, reported speech and qualified intentions. Do not label a commitment as risky or unapproved. Do not derive examples from customer data, development data, old heldouts, private tests or test error reports. Do not access those sources. Do not replenish or relabel this batch after validation or development scoring.

Use teacher.actorId to identify your distinct agent and teacher.model to state known model provenance. If runtime model is not independently verified, say so rather than claiming certainty. Set syntheticOnly=true. Every example needs your suggested label/category and rationale. Save only the proposal file requested by the lead. Do not create its independent review.

After the proposal freezes, a separate reviewer will receive a shuffled text-only packet with opaque review IDs. Disagreements, ambiguity and overlapping families are quarantined. Acceptance only makes examples eligible for TRAIN augmentation; no score or production improvement is promised.
