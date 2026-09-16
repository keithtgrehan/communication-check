# Editorial review desk refinement — 16 September 2026

## Scope and baseline

Keith approved the supplied `02-codex-implementation-prompt.md`, its companion
website copy deck, and six implementation safeguards. The scope is presentation
and wording in the existing app, with a local candidate for review. No push,
deployment, merge, reserved evaluation or third-party video integration is included.

Verified canonical root: `/Users/keith/Documents/ChatGPT/communication-check`.
Baseline: `c89ae393889dd9d8ce8dea4e823bc414db2e01c6` on
`codex/communication-check-tone-review`, synchronized with origin when work began.
The existing untracked `output/` directory was preserved.

Before editing, the baseline production build passed and actual browser captures
were saved under `screenshots/2026-09-16-editorial/before/`. They include blank,
clarity, tone and kept states at 1440×900, 382×1000, 320×900, 382×844 and 320×844;
About and Video at desktop and the original narrow widths.

## Detection preservation

The baseline used only existing public fixtures: 18 development drafts, 12 public
reviewer regression drafts, and all nine UI scenarios. Each was run through clarity
and Direct/Collaborative/Warm tone, for 156 results. Only title, explanation and
prompt fields were removed before comparison; finding IDs, rule IDs, sequence,
quotes, original offsets, checkedCharacters and excludedSections were retained.

After the COPY updates, all 156 normalized results match exactly. Runtime source
outside the two COPY tables is byte-identical to the baseline. Demo texts, public
fixtures, algorithms, limits, priorities and suppression rules remain unchanged.
The existing 451 engine unit tests pass with six intended wording assertions updated.
This is regression evidence, not a new accuracy or generalisation evaluation.

Normalized baseline SHA-256:
`a94966feb36c1ff1c1071abdf6b846674d24778b26a1d53fe06329e7d14d3aaf`.
Current candidate engine manifest SHA-256, including the changed wording:
`bad47e3c5a6be1d98c9a179a7460d61f69ef300cde915fc514ce3da26c1a9a50`.
Historical manifests, detection results and hosted verification records are unchanged.

The About illustration was run through checkDraft: its complete fictional quote,
“We guarantee that the custom integration will be ready by Friday.”, yields a
commitment-confirmation finding with original range [0,65) and the displayed
responsible-person/conditions/dependencies question. A browser check also compares
the static illustration to that real output. It is labelled as an illustration.

## Candidate validation

Full `npm run validate` passed: 7 setup checks, 451 engine tests, 10 scenario tests,
81 browser checks, typecheck/build and source guards. New coverage checks actual
About output, emoji count boundaries, and the first editable surface at 320×844
and 382×844. Existing viewport, exact selection, Keep/Undo, style, failure/retry,
clipboard, history/focus, contrast, enlarged text and runtime privacy checks remain.

The first integration run exposed a doubled-text tab overflow, now fixed by
allowing its layout to respect the label's minimum width. Three ambiguous edited-
state selectors were narrowed to the heading, retaining the original assertions.
Independent review also identified split Video step numbers; intrinsic-width
columns and unbroken counters fix this at normal and enlarged text sizes.

[Before/after screenshots](screenshots/2026-09-16-editorial/README.md) were captured
from real browser states and visually inspected. The narrow first textarea now
begins at approximately 798px (320×844) and 725px (382×844), with original text
sizes and all starting controls retained. Redundant blank guidance remains
associated with the input/control for assistive technology.

Independent Astra Extra High final review found no unresolved actionable issue.
The reviewer independently loaded the actual baseline source, checked all 156
normalized results and source invariance, repeated 15 sample flows across all five
viewport sizes, and verified both-tab failures/retries, copy success/fallback,
emoji limits, exact selection, decisions/style/history, offline operation and
absence of draft-bearing network/storage/logging. Six information-page Axe scans
passed. Enlarged tabs and counters, 200% text/zoom and the first input line at
both 844px-high sizes were independently checked after fixes. Review artifacts
contain only fictional canaries. This is engineering review, not human validation.
The local working probe and baseline JSON are under ignored
`work/editorial-refinement/`; only public fictional examples were used.

## Boundaries

The existing finite detection limits and failed historical target remain. No
production reliability, human validation or improved detection is claimed.
The YouTube URL and Vercel deployment remain later steps. The existing case-study
PDF has not been regenerated in this design pass.
