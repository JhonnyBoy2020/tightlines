# Pocket Ghillie intelligence and tackle lens

Preview-only expansion on field-edition-04. Main, production, Desktop files and domain/DNS are protected.

## QA inventory

- Overview and planner share a briefing in memory. Input/privacy changes hide the old answer, age over 15 minutes is labelled, navigation never triggers a paid generation.
- Opted-in evidence: up to three waters; fresh forecast and hourly planning; calculated daylight/moon; dated curated notices; chosen EA gauge; optional fly box, latest 20 catches, up to 10 saved reports and active session.
- No inference of safe access, recent stocking, measured water temperature or causal catch patterns. River gauge is not a stillwater measurement.
- Photo library: six attributed photographs, family/search filters, enlarged detail, review/edit before adding, unknown hook number preserved.
- Inventory: quantities, removal confirmation, catalogue ID and calibrated length survive validated cloud checkpoints/backups; no uploaded photograph stored.
- Active session: select photographed tackle, record fly change, pause protection, preserve journal capture.
- Camera: explicit file/camera gesture, accepted types, 15MB input ceiling, resize to 1200px JPEG and remove metadata, no upload until consent.
- AI identification: authenticated and allowlisted, shared quotas, low-confidence and non-tackle outcomes, no exact hook/weight/brand/length claims. User review before saving.
- Measurement: four points, keyboard adjustment, valid reference, same-plane confirmation, aspect-ratio-correct estimate, reset, unknown size without reference, no mm-to-hook-number conversion.
- Mobile 375px and desktop 1440px: library, box, camera, measurement and briefing. Light/dark, empty/disabled/error/busy states, no overflow or uncaught errors.
- Automated tests for measurement degeneracy, image validation, field schema, river freshness, evidence privacy and source coverage.
- Off-happy paths: non-image upload, coincident marks, invalid reference, missing gauge, no private key, unshared data and stale briefing.

## Boundaries

This is not a fully autonomous agent. Scores and alert safety exclusions remain deterministic; paid AI generation is requested by the user. Briefing evidence is a selected shortlist, not every venue on every request. Private data is opt-in, and uploaded photographs are ephemeral.

Camera identification is probabilistic. Physical measurement uses user-marked reference geometry, not an AI guess. Hook numbers must come from known packaging or a suitable manufacturer chart.

## Results, 8 October 2026

- 20 automated tests pass; production build and diff checks pass.
- Real internal-preview model calls completed for a public Woolly Bugger photograph and a Hanningfield briefing. Vision returned a likely bead-head Woolly Bugger variant without a hook number or physical length. Briefing prioritised closure, distinguished planned stocking from an event, and correctly treated unshared inventory as unknown.
- The internal preview uses its configured platform model; Netlify retains the user's `gpt-6.1-sol` configuration. These internal tests do not substitute for a final test against that Netlify deployment/model.
- Internal preview authentication initially returned 401, resolved by restarting with its documented credential preset. The user's OpenAI key and Netlify permissions were not changed.
- Browser checks passed: family filter (two streamers), enlarge/close photo, review/add, hook number entry, photo-based selection during a running session, pause protection, cloud checkpoint, measurement controls, zero-result before alignment confirmation, a known 2:1 geometry ratio, and unknown hook size on a measured entry.
- The geometric calibration test used arbitrary marks to test the computation, not a physical measurement of the photographed fly. Physical accuracy and iPhone camera capture still need validation with a ruler and real tackle.
- No AI requests occurred before consent. Navigating Overview → planner reused the result without an extra model request. Privacy-option changes hid the result; a deliberately aged QA response displayed the 15-minute stale warning.
- Invalid file type was rejected. The chosen EA gauge appeared in briefing context; 118 stations were returned during the browser check, with no API error.
- Desktop and 375px phone screenshots inspected for the new library, inventory, camera and briefing; dark-mode camera/catalogue checked. No horizontal overflow or uncaught page errors observed.
- Six catalogue images have individually linked authors, licences and pattern references. The Pheasant Tail source photograph is low resolution; it is a reference example rather than a fine-detail or size template.

## Data and image references

Pattern descriptions, typical size ranges, authors, individual file pages and licence URLs are linked on every catalogue card in the app and recorded in `src/data/tackle.js`. Images are resized photographs, not AI-generated pattern images.

- [OpenAI image-input formats and vision limitations](https://developers.openai.com/api/docs/guides/images-vision)
- [Selected model image-input capability](https://developers.openai.com/api/docs/models/gpt-6.1-sol)
- [Hook-size comparisons and manufacturer variation](https://www.theessentialfly.com/fly-tying-hook-comparison-chart.html)
- [EA real-time API documentation](https://environment.data.gov.uk/flood-monitoring/doc/reference)
- [Netlify preview](https://deploy-preview-2--tightlines-uk.netlify.app/)
