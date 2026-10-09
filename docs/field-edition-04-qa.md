# Field Edition 04: test inventory

This release is a preview branch, not a production approval. No Desktop files are part of this change.

## Functional checks

- Planner: change day, start, finish, radius and bank/boat; show only fresh supported forecasts; exclude known closures and screened weather; inspect hourly bar focus/hover; open water and operator details.
- Session: start, pause, resume, record fly, catch and missed take; undo; finish confirmation/cancel; save nonzero and zero-catch sessions; journal includes elapsed fishing effort.
- Fly box: add pattern with size/colour/count; increment/decrement including zero; remove/cancel; invalid and excessive quantity validation.
- Field book: create/connect private logbook; cloud checkpoint; second-device load; conflict refusal; disconnect; backup export, import preview, cancel and confirm; invalid backup rejection.
- AI: disabled provider state, key and consent requirements; optional inventory/journal; empty shortlist; real response, source references and missing-evidence caution; cancellation and provider-error states.
- Navigation: desktop sidebar, five-tab mobile navigation, More directory, existing weather/map/river/report/guide/journal routes.
- Display: 1440px desktop and 375px mobile; light and dark; initial and populated planner, session, fly box and AI views; no horizontal overflow.

## Automated checks

- Private data isolation, field-book validation, optimistic concurrency and journal effort fields.
- No planner ranking of absent, stale, closed or unsafe forecasts; boat catalogue filter; date outside supplied weather range.
- Session elapsed-time arithmetic, impossible dates, invalid backups.
- Missing AI weather remains missing; dated closure notice remains in evidence.
- Concurrent quota claims cannot exceed the local single-process limit.
- Provider disabled by default; consent and request validation before inference.
- Existing journal tombstones, source-backed reports, SSRF input rejection, push alert suppression/deduplication, river input validation.

## Explicit limitations to retain

- Field-book cloud saves are manual. Unsaved offline drafts live only in the open tab; export before closing.
- Catch journal continues to use the pre-existing local persistence and separate automatic sync.
- Private-key recovery/email sign-in, durable offline edit queue, journal photos and device-level iPhone push delivery are not part of this increment.
- Production AI requires a separately provisioned provider key, explicit model, opt-in enable flag and approved logbook hashes; it is off on Netlify until configured.
- Real AI tests use synthetic journal/inventory data, never the user's real private key or personal journal.
