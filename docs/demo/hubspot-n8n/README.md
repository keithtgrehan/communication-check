# Communication Check + HubSpot + local n8n demo

## Ready to use — verified 23 September 2026

The real flow passed: HubSpot source note → n8n retrieval → manual paste into the unchanged live checker → review/edit/recheck/copy → local form → a new HubSpot note. The 297-character revision matched the actual clipboard paste. HubSpot readback confirmed the wording and paragraph breaks, the correct contact association, and the unchanged original. Browser forms submit CRLF line endings; equality was checked after normalizing those to LF.

- [Local n8n](http://localhost:5678)
- [Load demo draft](http://localhost:5678/workflow/ccDemoLoad20260923)
- [Communication Check](https://communication-check.vercel.app/)
- [Save reviewed draft form](http://localhost:5678/form/communication-check-save)
- [Fictional Sam contact](https://app.hubspot.com/contacts/146011304/record/0-1/874499304647?utm_source=communication-check&utm_medium=demo)
- [Source note](https://app.hubspot.com/contacts/146011304/contact/874499304647?engagement=521461752010&utm_source=communication-check&utm_medium=demo)
- [Verified reviewed note](https://app.hubspot.com/contacts/146011304/contact/874499304647?engagement=521477778648&utm_source=communication-check&utm_medium=demo)

The contact has no email address. Exactly two notes were associated at verification. Only one save was submitted. No email was sent. The original source and live application are unchanged. The historical detection gate remains failed; this demonstration is not evidence of general accuracy or customer validation.

## Start and stop

1. Open Docker Desktop.
2. Double-click `Start demo.command` in this folder. Allow several seconds for n8n to start.
3. Open the Load demo draft link above and sign in using your local n8n owner account if asked.
4. Use the same browser for n8n, the checker and the save form. Expand the browser panel for the recording.

To stop only this demo container, double-click `Stop demo.command`. Credentials and workflows remain in the dedicated Docker volume. Do not remove that volume or use `down --volumes` unless deliberately resetting the demo.

On Keith’s configured Mac, the HubSpot credential is already saved and both workflows already reference it. The original operational copy is `/Users/keith/Documents/Codex/2026-09-23/communication-check-plan/demo/`; use its start/stop helpers for the existing instance. This repository folder is a sanitized copy for reference and recovery. Do not recreate the fictional contact or import the workflows again for normal use. The save workflow is published locally so its form works; the load workflow runs manually and needs no publication. There is no schedule.

## Three-minute walkthrough

- **0:00–0:25:** Show the fictional Sam contact and source note in HubSpot. Explain: “This is an unsent fictional draft stored as a CRM note.”
- **0:25–0:50:** Open Load demo draft and click **Execute workflow**. After success, double-click the final node icon, **Copy draft into Communication Check**. Copy only the `draftText` value from its output, without the field name or JSON quotes.
- **0:50–1:40:** Paste into the checker and click **Check draft**. Show the guaranteed Friday delivery and the question about confirmation. The checker cannot know what was actually agreed.
- **1:40–2:10:** Make the supplied manual revision from `reviewed-draft.txt`. When substituting the complete revision, select the entire editor text first; **Edit this wording** selects only the finding’s quote. Recheck, explain that no wording flagged does not verify facts, then click **Copy draft**. The app did not write the revision.
- **2:10–2:40:** Open the save form, paste and submit **once**. On its first visit, n8n may ask to use your local login for this workflow. The form creates a NEW note on the fixed fictional contact and waits for HubSpot before showing success.
- **2:40–3:00:** Refresh HubSpot and show the new “Communication Check — reviewed draft — not sent” note beside the unchanged source.

Say: “n8n handles CRM retrieval and writeback. The handoff into the checker is manual in this prototype.”

Each deliberate form submission creates another note. The existing verified output can be shown without submitting again. If a save times out or its outcome is unclear, inspect the contact’s notes before retrying; automatic retries are disabled.

## Data handling and limits

This is one operator and fictional data only. Local n8n execution history retains demonstration payloads, and HubSpot stores the source and explicitly saved revision. The standalone checker processes its draft in the browser; the complete CRM workflow is not browser-only or memory-only. It is not a native checker integration.

n8n 2.40.5 is pinned and listens only on 127.0.0.1:5678. The save form requires an authorized n8n login; an anonymous request redirected to authorization during verification. The credential is restricted to api.hubapi.com and stored by n8n outside Git. No public tunnel, cloud n8n service, sending node, scheduled job, app backend or deployment was added.

## Files and recovery

- `workflows/load-demo-draft.json` and `workflows/save-reviewed-draft.json`: sanitized native exports with the credential name only, no credential ID, keys, execution data or pinned results. They are inactive on import. On another n8n instance, select its own saved HubSpot credential; publish Save reviewed draft locally after checking the fixed destination. Re-importing here is unnecessary and may deactivate the running form.
- `source-draft.txt` and `reviewed-draft.txt`: the public fictional source and presenter-supplied revision.
- `verification.json`: observed checks, including the separate static reviewer’s scope.
- `compose.yaml`: pinned local container setup.

No remaining technical blocker was observed. Keith’s spoken rehearsal and recording remain to be done.

The exports retain only the approved fictional record IDs in the private demo account. They do not grant access. For another account, replace the source-note URL and fixed contact association, select a credential entered privately into that n8n instance, and verify before enabling the local form. Do not run a second copy alongside Keith’s existing instance. The September 23 evidence describes the configured local workflows, before removing their credential IDs for this repository copy.
