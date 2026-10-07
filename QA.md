# TightLines Field Edition QA

## Scope

Update v2 only. Do not merge main, change the live site, or modify the Desktop project.

## Required checks

- Overview: live values, unavailable-feed state, venue selection, pressure/wind/temperature/rain chart controls, chart table/export, checklist.
- Maps: visible tiles, markers, popup opens correct venue, map layers and radius.
- Venue: closure notice overrides score; weather, flies, guide and journal remain accessible.
- Rivers: real EA station and measure selection, correct datum units, timestamp, historical readings, stale/empty/error states, no inferred wading safety.
- Reports: closure versus seasonal plan, filter, original source links, unconfirmed empty states, private source-backed report entry.
- Log: valid save, invalid count rejected, export, delete confirmation, sample forecast never saved as real conditions.
- Cloud: create with opt-in, reconnect in second browser context, round-trip entries, cross-vault isolation, deletion tombstones, unavailable-server failure, export key and disconnect.
- Alerts: opt-in only; selected-water limits, threshold, provider validation; service-worker handlers; quiet hours, no sample/closed/thunder/stress alerts, daily deduplication.
- Responsive: 1440px and 375px, both themes, all screens, no horizontal overflow, navigation and focus.
- Release: production build, dependency audit, function bundle, check Netlify preview deploy and main SHA unchanged.

## Explicit test boundaries

An emulated mobile viewport is not a real iPhone. Physical iPhone installation, notification permission and actual push delivery need the user's device. The scheduler must remain disabled on this preview. Test fixtures in the service suite are synthetic and never exposed as fishing data.
