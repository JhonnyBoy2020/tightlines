import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { measurePhoto } from "../src/lib/measurement.js";
import { emptyField, validateField } from "../src/lib/field.js";
import { validateVision, cleanVision } from "../server/vision.mjs";
import { riverEvidence } from "../server/river-evidence.mjs";
import { buildEvidence, citationWarnings, conditionEvidence } from "../server/ai.mjs";
import { TACKLE } from "../src/data/tackle.js";

test("calibration accounts for image aspect ratio, refuses invalid/no scale", () => {
  const p = [{ x: 0, y: 0 }, { x: .5, y: 0 }, { x: 0, y: 0 }, { x: 0, y: .5 }];
  assert.equal(measurePhoto(p, 50, 1000, 500), 25);
  assert.equal(measurePhoto(p, 0, 1000, 500), null);
  assert.equal(measurePhoto(p.slice(0, 3), 50, 1000, 500), null);
  assert.equal(measurePhoto([{ x: 0, y: 0 }, { x: 0, y: 0 }, ...p.slice(2)], 50, 1000, 500), null);
  assert.equal(measurePhoto([{ x: -1, y: 0 }, ...p.slice(1)], 50, 1000, 500), null);
});
test("photo identification requires consent, JPEG magic bytes and bounded payload", async () => {
  const image = "data:image/jpeg;base64," + (await readFile(new URL("../public/tackle/woolly-bugger.jpg", import.meta.url))).toString("base64");
  assert.doesNotThrow(() => validateVision({ consent: true, image }));
  assert.throws(() => validateVision({ consent: false, image }), /Confirm/);
  assert.throws(() => validateVision({ consent: true, image: "https://private.example/image" }), /JPEG/);
  assert.throws(() => validateVision({ consent: true, image: "data:image/jpeg;base64," + "A".repeat(1800001) }), /limit/);
  assert.throws(() => validateVision({ consent: true, image: "data:image/jpeg;base64," + "A".repeat(300) }), /valid JPEG/);
});
test("AI suggestions cannot supply an invented catalogue ID or measured size", () => {
  const r = cleanVision({ name: "Maybe a lure", catalogueId: "invented", confidence: 99, lengthMm: 28, hookSize: 12, features: ["a tail"] });
  assert.equal(r.catalogueId, null); assert.equal(r.confidence, "low"); assert.equal(r.lengthMm, null); assert.equal(r.hookSize, null);
  assert.equal(cleanVision({ catalogueId: "woolly-bugger", confidence: "medium" }).catalogueId, "woolly-bugger");
});
test("field backup preserves catalogue & calibrated length but strips photos", () => {
  const d = emptyField();
  d.flies.push({ id: "photo-1", name: "Woolly Bugger", size: "", colour: "Black", quantity: 2, catalogueId: "woolly-bugger", lengthMm: 31.5, image: "private-image-bytes" });
  const f = validateField(d).flies[0];
  assert.equal(f.lengthMm, 31.5); assert.equal(f.catalogueId, "woolly-bugger"); assert.equal(f.image, undefined); assert.equal(f.size, "");
  d.flies[0].lengthMm = -2; assert.throws(() => validateField(d), /length/);
  d.flies[0].lengthMm = 20; d.flies[0].catalogueId = "unknown"; assert.throws(() => validateField(d), /catalogue/);
});
test("river evidence refuses arbitrary URLs and labels stale data", async () => {
  let called = false;
  assert.equal((await riverEvidence("https://internal", async () => { called = true; })).available, false);
  assert.equal(called, false);
  const now = Date.parse("2026-10-08T12:00:00Z");
  const mock = async url => ({ ok: true, json: async () => url.includes("/readings?") ? { items: [{ value: 1, dateTime: "2026-10-08T10:00:00Z" }, { value: 1.2, dateTime: "2026-10-08T11:15:00Z" }] } : { items: { parameter: "level", label: "Test gauge", unitName: "m", qualifier: "Stage" } } });
  const r = await riverEvidence("test-level", mock, now);
  assert.equal(r.available, true); assert.ok(Math.abs(r.change - .2) < .0001);
  assert.match(r.limitation, /not water depth/);
  assert.equal((await riverEvidence("test-level", mock, now + 4 * 3600000)).available, false);
});
test("expanded brief has only supplied optional evidence and scrubs catch notes", async () => {
  const r = await buildEvidence({ venueIds: ["thornwood"], date: "2026-10-08", measureId: "test", session: { running: true }, savedReports: [{ title: "User report", url: "https://example.com/report", eventDate: "2026-10-07" }] }, { fetcher: async () => ({}), riverFetcher: async () => ({ available: false }) });
  assert.ok(r.context.allowedEvidenceIds.includes("A1"));
  assert.ok(r.context.allowedEvidenceIds.includes("R1"));
  assert.ok(r.context.allowedEvidenceIds.includes("J2"));
  assert.ok(r.context.allowedEvidenceIds.includes("S1"));
  assert.equal(r.context.inventory, null);
  assert.equal(citationWarnings("Gauge [R1], daylight [A1], report [S1]", r.sources).length, 0);
  assert.equal(citationWarnings("Invented report [S2]", r.sources).length, 1);
  assert.deepEqual(Object.keys(conditionEvidence({ press: 1005, photo: "secret", note: "secret", trend: "steady" })).sort(), ["label", "press", "trend"]);
});
test("all catalogue photos exist with attribution and source URLs", async () => {
  for (const t of TACKLE) { assert.ok(t.author && t.license && t.photoSource.startsWith("https://commons.wikimedia.org/")); assert.ok((await readFile(new URL(`../public/tackle/${t.id}.jpg`, import.meta.url))).length > 1000); }
});
