# External sources and model provenance

Verified 2026-10-14. This audit inspected public source documentation and metadata;
after protocol freeze, it acquired the public English test JSON to verify its schema.
Acquisition and its exact schema are recorded by `external_data.py`.
Prior project heldouts were not inspected. No model weights were downloaded here.

## Task boundary

The project rubric requires a new, author-owned, unqualified assertion of future
delivery of a concrete work item. Neither external dataset supplies that label.
Published labels must stay in a separate benchmark; a target-model score on those
labels is a cross-task transfer diagnostic, not target accuracy. Neither source is
eligible for automatic target training. Unknown, ambiguous, or mixed records must
not become negative training labels.

## ML-Promise

The [original arXiv paper](https://arxiv.org/abs/2411.04473) describes four ESG tasks.
The [final author paper](https://aclanthology.org/2025.emnlp-main.1028.pdf) explicitly
includes principles and strategies in Promise Identification (PI), as well as
commitments. PI is Yes/No. Other labels concern evidence, evidence clarity, and
verification timing; these are not uncertainty qualifiers for our target rubric.
The paper gives 400 English training and 200 English test instances.

The final paper's [dataset landing URL](https://MLpromise.nlpfin.com/) resolves to
the [public author Drive folder](https://drive.google.com/drive/folders/1e4Ntcq3Gs2S7H4jfSwzd_HGvbzAWj37J).
Its Test folder contains `English_test.json`, file ID
`1TonLbkuKLCrpsv7HMZdnS5oTFn7FREid`. The English training file is
`1yu9vkvIzChBv3E16LynMLp9JTiBNuZ6p`; it is not used in this experiment. The older
[task data page](https://sites.google.com/view/promiseeval/data) still asks for
registration; that does not invalidate the author's later public download.

Observed artifact: 449,446 bytes, SHA-256
`94d60d386c772bb06681336c5351673de87e57f8b6d045a29ad9b1f1f0361d0d`.
The released JSON contains **400 rows**, unlike the paper's 200 English test rows.
Call it the author-hosted PromiseEval English test release, not an exact
reproduction of the paper split. Its list records have `URL`, `page_number`, `data`,
`promise_status`, `verification_timeline`, `evidence_status`, and `evidence_quality`.
Text is `data`; PI is `promise_status`, exactly `Yes` or `No`. No source ID exists,
so preserve the original index as `English_test.json:<zero-based index>`.

Annotations are released under CC BY-NC-SA 4.0 according to the final paper.
That is distinct from the arXiv manuscript's CC BY-NC-ND license. The
[annotation license](https://creativecommons.org/licenses/by-nc-sa/4.0/) excludes
commercial use and requires attribution and share-alike for distributed adaptations.
Use only for this isolated research benchmark, with no commercial training,
deployment, or raw-data publication. Public corporate report text is not thereby
relicensed for every use.

## MailEx

The [author repository](https://github.com/salokr/Email-Event-Extraction/tree/57507a458ce157378300d982914d7528448a381d)
describes Enron email threads with tokenized `sentences` and
`events[turn][event_type]`, containing `labels`, `triggers`, and `extras`.
Ten event types distinguish requests, delivery of information, and amendments;
`Deliver_Data` does not mean an unqualified future work-item promise. Its published
split is 1,200/150/150 threads. The linked
[data.zip](https://drive.google.com/file/d/1a336g4-wlEwsVbXLPB9wPQnBDRE933mb/view)
is external to GitHub; the repository does not contain those split files.
The public download with `confirm=t` returned HTTP 200, a 5,476,134-byte ZIP and
the correct ZIP signature. Only eight prefix bytes were read; the full archive
was not downloaded or scored. Schema verification used the published README/loaders.

The dataset's stated license is CC BY-SA 4.0. Its
[terms allow commercial reuse subject to conditions](https://creativecommons.org/licenses/by-sa/4.0/).
The underlying [Enron source](https://www.cs.cmu.edu/~enron/) is real correspondence
released through an investigation, with privacy/redaction concerns. The annotation
license is not blanket assurance about all underlying personal or third-party rights.
Commercial suitability therefore remains conditional; no automatic training import.
Availability is audited, but no native MailEx score is claimed in this milestone.

## Candidate models

[DeBERTa v2.0-c model card](https://huggingface.co/MoritzLaurer/deberta-v3-base-zeroshot-v2.0-c/blob/bddf8c5411c34ac3565e16e04384fd68b2618dda/README.md):
MIT; author identifies the `-c` training mix as commercially friendly: Mixtral
synthetic classification data, MNLI, and FEVER-NLI. This is the source author's
provenance assertion, not an independent rights audit. Prefer it for a future
commercial candidate if the separate target evaluation succeeds.

[ModernBERT v2.0 model card](https://huggingface.co/MoritzLaurer/ModernBERT-base-zeroshot-v2.0/blob/d421c4545a438fd006fb43f8b981c5d908faa1e1/README.md):
Apache-2.0 model metadata, but trained on the general v2.0 mix. The v2.0 card
explicitly warns that models without `-c` include noncommercial training data.
Commercial eligibility is unresolved despite the permissive model license;
retain only as a research comparator in this milestone.

Both pinned `config.json` files map class 0 to `entailment` and class 1 to
`not_entailment`; their maximum positions are 512 and 8192 respectively.
Those labels are NLI judgments about a supplied hypothesis, not existing
work-item-delivery labels. Complete weight/config/tokenizer URLs and revisions are
in `source-audit.json`.

## Fixed external benchmark

Use only ML-Promise English TEST native PI labels. Select the first 64 rows by
SHA-256 of canonical source ID plus complete text, before consulting labels; keep
the original split, IDs, raw bytes/hash, counts, and exclusion reasons. No external
training file is needed. Invalid selected rows are reported, never backfilled or
relabeled. No truncation of the input text is silently treated as full-document
evaluation.

The selected 64 contain 43 native Yes and 21 No labels; three exceed 2,000 UTF-16
units. These observed counts did not affect selection. Inference input limits and
abstention coverage must be reported. All 400 source rows remain preserved in the
raw download. The parser smoke check verified the hash, native mapping, unique
IDs, deterministic selection, and training exclusion; it did not run predictions.

Frozen NLI hypothesis: `This passage states a company principle, commitment, or
strategy related to environmental, social, or governance criteria.` Threshold 0.5,
no prompt selection or tuning on this benchmark. Report native PI metrics and
per-class counts separately from the project target. C42 can be shown only as an
explicit cross-task transfer diagnostic and must be excluded from native-task
ranking or candidate promotion. Published data may overlap unknown pretraining;
this is not a guaranteed contamination-free benchmark.
