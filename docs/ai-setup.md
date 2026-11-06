# TightLines Coach: deployment setup

The Field Edition 04 branch adds a real, server-side AI coach. AI is disabled unless explicitly configured; an unconfigured host displays that state and never substitutes a canned answer.

## Architecture

The browser submits a question, selected water IDs, date, consent and any opted-in inventory/journal summary. The authenticated server fetches fresh weather, adds dated curated notices and the monthly editorial guide, sanitises optional personal fields, enforces quotas, then calls the OpenAI Responses API.

The response returns plain text, evidence IDs, the exact source list supplied, and deterministic closure/missing-data/screening warnings. It cannot book, alter records, browse arbitrary URLs or trigger external actions.

## Preview versus production

- Computer private preview: runs against a session-backed server and platform-provided AI proxy. This proves real inference but is not permanent Netlify infrastructure.
- Netlify preview/production: uses the included Netlify Function and managed Blobs. AI remains off until the owner configures a provider account.
- Existing production data namespace is retained. Preview data remains separate from production.
- Do not copy sandbox credentials into Netlify, the browser, GitHub, logs or files.

## Netlify environment variables

Configure these as function/runtime variables using Netlify's secure settings, in the intended deployment context only:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Secret provider API key. Never use a `VITE_` prefix. |
| `AI_MODEL` | A model ID available to the owner's provider account and compatible with the Responses API. Set explicitly; internal preview model aliases are not portable provider IDs. |
| `AI_ENABLED` | Must be `true` to enable inference. |
| `AI_ALLOWED_VAULTS` | Comma-separated SHA-256 hashes of approved private logbook keys. Publicly creating a new logbook does not grant AI access. |

`OPENAI_BASE_URL` is optional for an intentionally configured OpenAI-compatible provider. Leave unset for direct OpenAI. Do not set `TL_PREVIEW_DATA` on Netlify; it selects the development disk adapter and bypasses the production allowlist.

Use the provider's own project-level budget/rate controls as well. The app additionally enforces ten attempts per logbook per UK calendar day, forty attempts globally per day, at most three waters, 1,200 question characters, 100 inventory patterns, 20 recent journal entries and 1,800 output tokens. Failed provider requests count; quotas are conservative, not a billing guarantee.

Before enabling production, verify timeout behaviour on the actual Netlify plan, provider billing, approved logbook hashes, a real source-backed answer, a missing-forecast case and closure suppression. Keep the kill switch available: set `AI_ENABLED=false`.

## Privacy and evidence

- Optional journal sharing excludes free-text notes, photos, private keys and precise home coordinates. Date, venue, catch count, fly and fishing duration are included only when chosen.
- Inventory sharing is separate, optional consent.
- Questions/answers are not persisted by TightLines or printed to its logs. Usage counters contain counts/timestamps and a vault hash.
- The request uses `store: false`. That disables stored Responses state; it is not a claim of zero provider retention. OpenAI documents this setting in its [Responses migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses).
- Keys belong exclusively on the server. Follow the [OpenAI API quickstart](https://platform.openai.com/docs/quickstart?api-mode=responses&lang=python) for the provider account setup.
- Evidence IDs distinguish forecast (`W`), venue catalogue (`V`), dated notice (`N`), seasonal guide (`G1`), user fly inventory (`B1`) and optional recent journal (`J1`). These are evidence pointers, not automated fact-checking of generated prose.
- The coach has no live stocking feed or river-gauge tool in this increment. Those are explicitly absent rather than fabricated.

## Field-book durability

Fly inventory, plan and active session live in the open page until manually checkpointed to cloud or exported. Changes survive in-app navigation, not a closed tab without a saved checkpoint. Backups are validated and require replacement confirmation. Concurrent cloud edits receive a conflict rather than silent overwrite.

Catch journal entries retain the existing local storage and cloud-sync mechanism; timed-session duration and missed takes are now included. Sessions can be zero-catch trips. Existing key recovery limitations and pending offline-delete durability limitations are unchanged.
