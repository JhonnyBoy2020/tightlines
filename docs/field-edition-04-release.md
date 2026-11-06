# TightLines UK: Field Edition 04

This is a separate test release building on the approved Field Edition 03. The live site and Mac Desktop folder are not changed by this release.

## What's new

- **Trip planner:** select a day, UK fishing hours, distance radius and bank/boat preference. Compare up to three waters with fresh supported forecasts, hourly heuristic bars, weather detail and operator links.
- **Session mode:** record fish landed, missed takes and fly changes; pause/resume active fishing effort; undo the latest event; finish into the existing journal, including blank sessions.
- **Personal fly box:** store patterns, hook sizes, colours and quantities. Seasonal name matches are labelled as editorial matching, not current hatch observations.
- **Field-book checkpoints:** private cloud save/load, conflict protection, portable JSON backups and validated restore with confirmation.
- **AI coach:** real model-generated advice using server-fetched weather, dated curated notices and the monthly guide, plus separately opted-in fly inventory and up to 20 recent catch entries.
- **Phone navigation:** five primary tabs, with maps, rivers, reports and guide grouped under More.

## How the intelligence works

The AI does not replace the forecast or pretend to know what is happening underwater. The server constructs a bounded evidence pack and asks the model to explain a plan, suggest an approach and state what needs checking.

Each answer includes the supplied evidence list. Forecasts, dated operator notices, catalogue information, the seasonal guide and user-entered data have separate identifiers. Deterministic closure and weather-screening warnings appear alongside generated advice.

The coach is question-by-question, not a persistent conversation or a trained model of the individual angler. It has no live stocking feed, river-gauge reasoning tool, fish-photo identification, bookings or autonomous actions in this version.

## Using the AI preview

Open **Plan & fish → AI coach**. Connect a private preview logbook through **Alerts & sync** first, keeping its key private and saved. Choose a specific water or the planner shortlist, tick only the optional data you want included, consent to the provider request, and ask a question.

Useful prompts:

- “Which of these waters fits my plan, and what should I check before travelling?”
- “What should I try from my fly box?”
- “Explain the forecast and any reasons not to go.”
- “What can my recent journal actually tell us?”

The Computer preview has real AI through a session-backed server. The Netlify branch preview has the same interface but deliberately keeps AI disabled until an owner-controlled provider account is securely configured.

## Verification

- Eleven automated tests pass, covering access isolation, source validation, alert guardrails, field-book validation, conflict detection, quotas, planner exclusions and timed-session fields.
- Production frontend build completes and the dependency audit reports zero known vulnerabilities at the time of testing.
- Browser flows exercised: inventory changes, session pause/resume/undo/finish, blank-session journal entry, backup export/restore, invalid-backup rejection, second-device field-book load and stale-device save conflict.
- Two real AI requests were exercised with synthetic test data: a fly-box question and a Hanningfield access/stocking question. The latter prioritised the dated closure notice and did not represent the seasonal stocking plan as a recent stocking delivery.
- Desktop and 375px mobile layouts were visually reviewed in light and dark themes. Mobile navigation, maps, rivers, reports and guide were opened. No horizontal page overflow or uncaught browser errors were observed in that pass.

## Important limits

- **Save before closing:** new field-book drafts live in the current tab. Save a cloud checkpoint or export JSON before closing, especially offline. Cloud field-book saves are manual.
- **Separate journal:** the existing catch journal retains its existing local persistence and automatic cloud sync. Private-key recovery and durable offline deletion queues are unchanged.
- **Preview isolation:** preview keys/data are separate from the production site. No real user data was used in AI tests.
- **AI activation:** Netlify needs a secret provider API key, an explicitly selected compatible model, the enable flag and approved logbook hashes. It also needs provider-level spending limits and production timeout verification before launch.
- **AI privacy:** optional notes, photos and private keys are excluded from the journal summary. TightLines does not save AI conversations. Requests use `store: false`, which disables stored response state but does not promise zero provider retention; see the [OpenAI Responses guidance](https://developers.openai.com/api/docs/guides/migrate-to-responses).
- **Advice, not assurance:** modelled temperatures, solunar effects and planning indices are not sensor readings, catch probabilities or safety certification. Confirm permissions, rules, reopening and local conditions with the operator.

Implementation and deployment instructions are in `docs/ai-setup.md` in the branch. Nothing here authorises a production merge.
