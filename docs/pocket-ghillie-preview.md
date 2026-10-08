# Pocket Ghillie preview

Pocket Ghillie is the new user-facing name. The purchased domain is pocketghillie.com; attaching it, DNS changes and production release require separate approval.

## Compatibility

- Existing `tl-*` local-storage keys and Netlify Blobs namespaces are unchanged.
- Existing GitHub repository, Netlify project handle and deployed URLs are unchanged.
- Private logbook keys remain in memory. Keep the private key safely before closing the app.
- The service-worker shell version has changed to refresh the brand.

## AI configuration

- Dedicated OpenAI project: Pocket Ghillie.
- Restricted Responses API key, scoped to Netlify Functions on `field-edition-04` only. No frontend secret.
- Preview model: `gpt-6.1-sol`, reasoning effort `low`, response storage disabled.
- Only the approved private preview logbook is allowlisted by its SHA-256 identifier.
- Limits: 10 requests per logbook/day and 40 requests globally/day. Failed provider attempts count.
- Preview key expires after 30 days and must be rotated before expiry.
- No automatic credit replenishment was enabled by this work.
- Whole-app AI orchestration is not implemented yet; the current integration is the evidence-grounded coach.

## Rebrand and connection QA inventory

- Desktop and 375px phone: wordmark readable, no horizontal overflow.
- Browser title, manifest and coach name: Pocket Ghillie.
- Light and dark overview: preserve contrast and layout.
- Planner, coach and settings navigation: user controls still work.
- Automated tests and production build pass.
- Negative case: unconnected AI submission remains disabled.
- Negative case: invalid reasoning configuration is rejected.
- Deployed preview only: AI configured, private logbook connected.
- Two approved public-data AI questions: Thornwood forecast and Hanningfield access/stocking. No optional journal or inventory sent.
- Production branch, custom domain/DNS and Desktop folder remain unchanged.

## Authoritative settings

- [Preview app](https://deploy-preview-2--tightlines-uk.netlify.app/)
- [Review branch and pull request](https://github.com/JhonnyBoy2020/tightlines/pull/2)
- [OpenAI project](https://platform.openai.com/settings/proj_Lw7VFbBtwSySCsw5PGcyyuLa)
- [Netlify environment settings](https://app.netlify.com/projects/tightlines-uk/configuration/env)
