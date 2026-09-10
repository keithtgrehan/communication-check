# Communication Check

**Check your customer follow-up before you send it.**

Private portfolio MVP for B2B SaaS account managers and customer-success managers
reviewing customer onboarding follow-up emails.

## Status

Repository and collaboration setup are being prepared. The application, rule
engine, hosted preview and evaluation results are not implemented yet.
See [current progress](docs/PROGRESS.md) for verified status.

## Start here

- [Product brief](docs/PRODUCT_BRIEF.md): audience, workflow and frozen scope.
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md): milestones and acceptance.
- [Working instructions](AGENTS.md): authority, agent ownership and boundaries.
- [Workflow](docs/WORKFLOW.md): how Keith, ChatGPT and the Codex lead collaborate.
- [Goal prompt](docs/GOAL_PROMPT.md): start the build goal from the current state.
- [Reuse ledger](docs/REUSE_LEDGER.md): source, commit, rights and reuse decisions.

The canonical repository is https://github.com/keithtgrehan/communication-check.
Work on `codex/communication-check-mvp`; all product implementation remains on
that branch until Keith explicitly authorises a merge.

## Setup automation

Requires Node.js 22 or later and Git; the setup tools have no npm dependencies.

```text
npm run setup
npm run validate:setup
npm run handoff
```

Setup installs repository-local Git hooks without replacing existing hooks or
changing global Git settings. Every commit refreshes `.handoff/CHATGPT_CONTEXT.md`
from an explicit allowlist of the product brief and progress document. `npm run
handoff` also refreshes it on demand. Generation is local and sends nothing.

At verified milestones, the build lead delivers the packet to the existing
product-companion task using the app's supported task tools. This is not automatic
ChatGPT Project Sources synchronisation; that interface is not available to the
agent. [Project instructions](docs/CHATGPT_PROJECT_INSTRUCTIONS.md) describe how
ChatGPT can fetch current brief/progress from GitHub instead of relying on an old
upload when its connector is available.

## Source and privacy boundaries

`reference/vibe-signal/` is an audited reference-only source snapshot, not the
application. It is excluded from the future frontend build. No private datasets,
deployment credentials or donor Git history were imported. New rules and demos
will be written for this product. Browser-local operation and no draft transmission
are requirements, not verified claims at this stage.

The repository is private. No public licence has been selected for the product.
See [third-party notices](THIRD_PARTY_NOTICES.md).
