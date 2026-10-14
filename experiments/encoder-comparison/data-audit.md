# Dataset audit — 14 October 2026

Decision: retain the existing 150 fictional passages unchanged for every model
arm: 120 training / 30 development, with 60 / 15 positives respectively.
No relabeling, text edits, exclusions or split changes were made. Data SHA-256:
`ae0236ea3ef255dc517f62cf77df6f3d40b1661a4a88f5c0abb7b81d1d533468`. The original experiment is untouched.

The PM agent read all 150 passages and assessed their labels against the shared
rubric in `data/rubric.md`. Labels match the declared author-owned, unqualified
prospective delivery target, including ordinary work-document promises. They are
AI judgments and do not demonstrate that a product finding would be useful.

The audit goes beyond scenario IDs. It checked normalized text duplicates and
all 4,500 cross-split pairs using token-set Jaccard and token-sequence similarity,
and manually inspected the 12 highest sequence-similarity pairs. There are zero
normalized duplicates, 15 train scenario groups, five dev scenario groups and no
scenario overlap. Maximum cross-split token Jaccard is 0.3333; maximum sequence
ratio is 0.5000. Both metrics are descriptive, not proofs or acceptance thresholds.
The closest sequence pair contrasts an attributed customer statement with a past
plan statement. Other close pairs share assurance verbs, hypothetical grammar,
negation/past scope or generic delivery phrases, while their scenario content and
wording differ. The most lexically similar pairs are not necessarily paraphrases.

Each scenario's authored contrast set stays entirely in its original split.
No material copied cross-split scenario or near-identical contrast pair was
identified. We therefore retain the split instead of changing data while testing
model architecture. `data/audit.json` includes the inspected pair IDs, exact
metrics, per-record broad-construction tags and construction counts.

Broad grammatical/paraphrase families DO overlap: explicit assurances, future
assertions, recipient receipt, requests, reporting, conditions, estimates,
negation, completed past and hypothetical wording. The construction tags identify
this limitation; they are not claimed to be fully independent semantic clusters.
Grouping every shared promise/request construction into one split would largely
separate the target grammar itself, rather than merely prevent copied examples.
This dataset is scenario-held-out, not template-independent. The fresh evaluator
received only scenario/construction inventories, not raw train/dev passages.

Further limitations: artificial 50/50 prevalence; short stylised passages;
shared AI author/model biases; small development set; no human adjudication.
Neither overlap measures nor fresh synthetic evaluation establish real-user
performance. The existing app deliberately suppresses many ordinary promises
counted positive here, so this target cannot substantiate improved app findings.
No historical or fresh private test examples were accessed. No model fitting or
threshold selection was performed by this data audit.
