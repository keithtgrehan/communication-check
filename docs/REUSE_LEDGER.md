# Reuse ledger

Inspected 67 accessible Keith-owned repositories during bounded planning on
2026-09-10. Deep reads were limited to promising sources. None of the donors or
their deployments was changed.

| Source | Commit | Relevant paths or pattern | Decision and rights |
| --- | --- | --- | --- |
| keithtgrehan/vibe-signal | 000ba0685f961e253b0d34c0b02539ac897356e9 | web/src/App.jsx, styles.css, resultViewModel.js; Vite/package/index metadata | Six exact files imported to reference/vibe-signal, not runtime. Owner-authorised private reuse; no public project licence. Adapt UI patterns only; replace backend path, demos, wording, rules and confidence labels. |
| keithtgrehan/revenue-conversation-review | d1ab6fe50c76e5bbfece4e7fd6eef590c5835703 | web/src/domain/codepoints.ts, web/src/components/TranscriptEvidence.tsx, web/src/domain/review.ts | Candidate for selective MIT adaptation; no files imported. Retain exact MIT copyright/permission if used. Pure JS offsets may avoid code-point adapter; retain its Unicode regression cases. |
| keithtgrehan/Sales-Call-NLP-Signal-Product | be574dad69dc448a0fa692289a2f42e55ba2dc6e | src/sales_call_nlp/extract/deterministic.py | Omit. Broad substring rules, fixed confidence and unconditional synthetic provenance. No licence found. |
| keithtgrehan/keith-career-command-center | 900e5e74c066b42a9b87d6deb3a54b44200c5c53 | src/lib/cv/claim-lint.ts | Concept only: claims need evidence. No licence found; no code, records or systems copied. |
| keithtgrehan/career-command-Centre-Portfolio-Production | 94c0fcee6f97450c0cdb5b7e3a3d1df012841440 | src/lib/domain/cv.ts, src/lib/fixtures/schema.ts | Concept only: explicit review states and honest fixture provenance. No licence found; no code or data copied. |
| keithtgrehan/relationship-communication-chat-1-1-Portfolio-piece- | db7848e64a0a1580c2943b785c186a1b2353c4ae | scripts/check-privacy.mjs, scripts/check-bundle.mjs, tests/rendered-html.test.mjs | Candidate privacy regression pattern under MIT; no files imported. Replace sessionStorage assumptions; add runtime network/storage tests. |

RCR's protected deployment is documented in its repository, while independent
adjudication, usability and publication gates remain outstanding. No new live
verification was performed and this product does not inherit RCR's approvals.

The future RCR connection is documentation-only: human-approved commitments →
writer's draft → Communication Check. No shared platform or integration in MVP.

## Implemented reuse decisions

The MVP app, rules, demos, fixtures, span handling and privacy tests were written
for Communication Check. No additional donor source was copied. Vibe's six
reference blobs remain unchanged and do not enter the build. RCR and other
candidate patterns above informed requirements only; no code or regression
fixture was imported from them. UTF-16 slicing and selection use browser-native
offsets. The only bundled external runtime code is React, React DOM and Scheduler;
see THIRD_PARTY_NOTICES.md and the shipped exact MIT notice.
