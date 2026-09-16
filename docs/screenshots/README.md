# Portfolio screenshots

## September 16 local follow-on

Captured from the real production build at `http://127.0.0.1:4173`, branch
`codex/communication-check-tone-review`, based on main `b22bcfd`. These images
show a fresh fictional draft processed by the actual clarity/tone engines;
no fixture lookup or generated UI mock is used. They do not show a deployment.
The final commit and review are recorded in ../PROGRESS.md and ../VERIFICATION.md.

- [1440×900 clarity](2026-09-16-local/clarity-1440-top.png) and [exact selected evidence](2026-09-16-local/clarity-1440-selection.png).
- [1024×768 tone](2026-09-16-local/tone-1024-top.png).
- 390×844: [top](2026-09-16-local/clarity-390-top.png), [editor](2026-09-16-local/clarity-390-editor.png), [tone results](2026-09-16-local/tone-390-results.png), [full flow](2026-09-16-local/tone-390-full.png).
- 320×844: [top](2026-09-16-local/clarity-320-top.png), [editor](2026-09-16-local/clarity-320-editor.png), [tone results](2026-09-16-local/tone-320-results.png), [full flow](2026-09-16-local/tone-320-full.png).
- [200% content zoom](2026-09-16-local/tone-200percent-zoom.png) and [doubled text sizes at 390px](2026-09-16-local/tone-390-enlarged-text.png).

Desktop/mobile and enlarged states were visually inspected. These are Chromium
viewport emulations, not physical-device or human usability evidence.

## September 11 hosted baseline

Captured 2026-09-11 from https://communication-check-preview.onrender.com after
all 28 hosted browser checks and exact asset verification passed.
Checkout: 4931fe2f8968b0447c5e2872e520306aa0bb74b7.
Deployment: dep-dai10kbm8hqs73dnm68g, live 14:29:50 UTC.

Fictional built-in demos only, using the same engine as pasted drafts. Desktop
viewport 1440×900 and mobile 390×844; images capture the full page. All three
captures were visually inspected. These are browser emulations, not physical-device
or human usability tests. Detection remains experimental; see ../EVALUATION.md.

- [Desktop review](desktop-review.png) — primary portfolio image and Featured thumbnail.
- [Mobile review](mobile-review.png) — responsive interaction.
- [Clean result](clean-result.png) — honest empty state.

The demo script's actual edit/recheck/current-copy flow was also verified on this
hosted candidate. A video recording was deferred; these files are screenshots.
