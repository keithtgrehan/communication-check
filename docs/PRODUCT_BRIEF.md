# Communication Check

**Check your customer follow-up before you send it.**

## Purpose and priorities

Build a credible portfolio product first, test usefulness with real users second, and explore low-maintenance revenue only after repeat usefulness. The first audience is B2B SaaS account managers and customer-success managers writing onboarding follow-up emails.

**Current delivery decision, 2026-09-10:** Keith asked to focus on shipping quickly
and making the product look good on a portfolio. Deliver the existing reviewed
application as a polished, functional portfolio prototype, with a verified preview
and concise portfolio materials. Stop the deeper semantic-parser experiment and
further evaluation rounds for this delivery. The original detection target remains
unmet and must be documented honestly; it is not a shipping gate for this explicitly
revised portfolio scope. Do not claim reliable general-language detection,
production readiness, human validation or that the original target passed.

## Frozen MVP

Choose a fictional example or paste a draft → check → inspect useful findings → edit → recheck → copy. Provide three fictional demos that use the same checker as user drafts. Show up to three useful findings; each quotes exact original wording, explains the concern plainly, offers an actionable review prompt, and can be dismissed.

Conservative checks cover:

- Unclear requested action or responsible owner.
- Vague timing when another action depends on it.
- Several competing requests without a clear first action.
- Proposed versus agreed wording worth confirming.
- Delivery, pricing, or functionality commitments worth confirming.

Suppress findings for clear owners, legitimate deadlines, ordered checklists, harmless conversational timing, negation and qualifications where appropriate. Length alone is not overload. Respect signatures and quoted history without shifting evidence offsets.

Never invent dates, owners, promises, agreements, or facts. Without supporting context, say “Confirm this commitment before sending.” Do not claim a statement is false or unauthorised. No overall score or numeric confidence. An empty result says “No checks flagged this draft” and explains that facts and agreements were not verified.

## Architecture and data handling

Use a static React/Vite interface and a small deterministic TypeScript engine. Preserve original-text offsets. Drafts and findings are memory-only by design; no draft-bearing telemetry, feedback, logs, URLs, or browser persistence. Editing invalidates stale results; copying uses the current draft. Verify runtime network and storage behaviour before claiming drafts stay in the browser. Privacy remains an engineering requirement until verified.

The interface must work responsively with keyboard access, visible focus and accessible labels. No accounts, payments, integrations, recording, mobile app, model training, LLM, full email generation, automatic rewriting, or automatic sending in this MVP. Renewals and sales are later workflows.

## Readiness and evidence

Portfolio delivery requires meaningful check/span/browser/privacy tests, a verified preview, reviewed code, a polished usable interface and portfolio materials. Preserve the failed detection evidence as a known limitation and future product-readiness requirement. Public release is a separate approval gate. Human market validation is outstanding until real participants provide feedback; fictional tests and agent labels do not demonstrate real-world accuracy or market fit.

Prepare a protocol for three usability users and five repeat-use pilots while engineering continues. Browser-local action and commitment review is a hypothesis, not proven uniqueness. Do not send outreach or fabricate participation, consent or findings.

## Source of truth and boundaries

- Repository: `keithtgrehan/communication-check` (private).
- Local root: `/Users/keith/Documents/ChatGPT/communication-check`.
- Implementation branch: `codex/communication-check-mvp`.
- Source baseline: Vibe Signal `000ba0685f961e253b0d34c0b02539ac897356e9`; retain source/licence attribution for actual reused components.
- Keep Vibe Signal, RCR, Synapse Atlas and other projects separate and untouched.
- Later connection to document only: RCR approved commitments → writer's draft → Communication Check. Do not build a shared platform.

The repository brief and progress record are authoritative. ChatGPT receives sanitised milestone copies of those two documents only. Implementation status and evidence are recorded in docs/PROGRESS.md; this brief specifies requirements and does not itself establish validation.
