# TightLines UK: Field Edition 03

This development release extends the existing v2 React app. Production remains on main until the owner explicitly approves a merge. The Desktop v1 project is not modified.

## Features

- Redesigned responsive field dashboard with pine-green and warm-paper styling, custom lakeside artwork, light/dark mode, mobile navigation and the existing maps, guide and venue tools.
- Interactive 72-hour pressure, wind, temperature and rainfall charts, readable data tables and CSV exports. No sample values appear on the overview.
- Environment Agency nearby station discovery and 48-hour gauge histories, with units, timestamps, stale warnings, source links and clear separation from fishery water levels.
- Source-backed fishery notice board, private saved reports and venue filtering. Hanningfield's operator closure notice suppresses recommendations. Its seasonal stocking target is not labelled a recent stocking.
- Private cross-device journal sync using a random 256-bit logbook key. Netlify Blobs stores records; no separate database signup or password provider is required.
- Opt-in Web Push subscriptions, configurable score thresholds and up to five waters. Service worker supports notifications and opening the correct venue.
- Hourly alert evaluator with UK quiet hours, forecast-only scoring, known-closure exclusions, thunder/gust/warm-estimate suppression and daily deduplication.
- Safer catch entry, no sample conditions saved as actual forecasts, CSV formula escaping, journal backup and deletion confirmation.

## Operational limits and privacy

- The score is a heuristic, not a validated catch probability. Water temperature is estimated, not measured. Solunar weighting is inherited and is not a scientific guarantee.
- The EA integration covers available stations around the selected English location, not the whole UK. Gauge height is not river depth and cannot establish safe wading.
- No universal automatic stocking feed is connected. The initial board contains dated source reviews. Saved user reports are private and unverified; future fishery partnerships or a moderated publishing workflow would be needed for an authoritative automated report feed.
- A private key grants full access to that logbook. Treat it as a password; save its download securely. There is no key recovery or email-based login. It is kept in page memory and must be entered again after reopening the app. Data is protected by transport and provider storage controls, not end-to-end encrypted by this app.
- The existing guarded local journal storage is retained for the real Netlify/iPhone app. In an embedded preview where browser storage is blocked, connect the cloud logbook or export before closing. Do not assume local persistence in embedded previews.
- Preview and production use separate server storage namespaces. Local browser records are also origin-specific. Export before changing host.
- Automatic sync runs every 30 seconds while the app is open. Keep the app open until a deletion confirms sync. Pending unsynced deletions are held in memory; closing during a failed sync can lose the pending deletion request.
- Sessions are immutable; deletion tombstones prevent older devices resurrecting removed records. The current request limit is 500 records. Do not use this release as a sole archival store without backups.
- Push permission is granted only by clicking Enable. iPhone requires a supported Home Screen web app. Real-device delivery has not been certified by a simulated mobile browser.
- Netlify schedules do not run automatically on deploy previews. The function is additionally build-context gated. Alerts therefore remain inactive until an approved production release; a user-requested test notification can be sent on the preview after opting in.
- No paid plan upgrades, external email sending, or third-party authentication accounts are created. Netlify hosting/function/storage limits still apply.

## Setup

```sh
npm ci
npm test
npm run build
```

`prebuild` writes a non-secret deployment-context module from Netlify's build-time `CONTEXT`, since it is not a built-in runtime variable. Netlify bundles `netlify/functions/api.mjs` and `score-alerts.mjs` with the site. Managed Blobs automatically provides service context; the server creates and stores Web Push VAPID keys on first use. Never commit or print those keys.

For local development:

```sh
npm run dev
# In a second terminal, after predev has created the context module:
TL_PREVIEW_DATA=.preview-data node server/preview.mjs
```

The Vite server proxies the function route to the local API on port 5000. `.preview-data`, environment files and generated context are ignored by git.

## Sources and platform requirements

- Environment Agency API syntax, attribution, units and reporting caveats: https://environment.data.gov.uk/flood-monitoring/doc/reference
- Open Government Licence: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
- Weather forecasts: https://open-meteo.com/
- Hanningfield operator closure notice, reviewed 7 October 2026: https://www.watersideparksuk.com/fishing/
- Hanningfield seasonal stocking statement: https://www.watersideparksuk.com/park/hanningfield/fishing/
- iPhone Home Screen Web Push requirements: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- Netlify schedule behaviour on deploy previews: https://docs.netlify.com/build/functions/scheduled-functions/
- Netlify Blobs conditional writes and automatic function credentials: https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- Netlify function runtime environment variables: https://docs.netlify.com/build/functions/environment-variables/
