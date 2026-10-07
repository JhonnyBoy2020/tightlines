import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { handler, evaluateAlerts } from "../server/service.mjs";
import { store } from "../server/storage.mjs";
const root = await mkdtemp(path.join(os.tmpdir(), "tl-test-"));
process.env.TL_PREVIEW_DATA = root;
const call = async (route, key, data, method) => {
  const res = await handler(new Request("https://test.local/api" + route, { method: method || (data ? "POST" : "GET"), headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(data ? { "Content-Type": "application/json" } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) }));
  return { status: res.status, data: await res.json() };
};
test("private sync, access isolation, immutable records and deletion tombstones", async () => {
  const a = (await call("/vault", null, {})).data.key;
  const b = (await call("/vault", null, {})).data.key;
  assert.equal((await call("/sync", null, {})).status, 401);
  const entry = { id: "test-session", venueId: "thornwood", date: "2026-10-07", fish: "2", fly: "Buzzer" };
  let result = await call("/sync", a, { entries: [entry] });
  assert.equal(result.status, 200);
  assert.equal(result.data.records[0].fish, "2");
  assert.equal((await call("/sync", b, {})).data.records.length, 0);
  result = await call("/sync", a, { entries: [{ ...entry, fish: "99" }] });
  assert.equal(result.data.records[0].fish, "2");
  await call("/sync", a, { deleted: [entry.id] });
  result = await call("/sync", a, { entries: [entry] });
  assert.equal(result.data.records[0].deleted, true);
  assert.equal((await call("/sync", a, { entries: [{ ...entry, fish: "-1" }] })).status, 400);
  assert.equal((await call("/sync", a, { entries: [{ ...entry, id: "../../traversal" }] })).status, 400);
});
test("reports require a source, are private, and reject unsafe URLs", async () => {
  const key = (await call("/vault", null, {})).data.key;
  const report = { venueId: "thornwood", eventDate: "2026-10-07", title: "Test fixture, not a real stocking", text: "Test only", url: "javascript:alert(1)" };
  assert.equal((await call("/reports", key, report)).status, 400);
  report.url = "https://example.com/test";
  assert.equal((await call("/reports", key, report)).status, 200);
  assert.equal((await call("/reports", key)).data.items.length, 1);
});
test("subscription endpoint rejects SSRF and invalid threshold", async () => {
  const key = (await call("/vault", null, {})).data.key;
  const body = { subscription: { endpoint: "https://127.0.0.1/private", keys: { p256dh: "a".repeat(87), auth: "b".repeat(22) } }, venues: ["thornwood"], threshold: 8 };
  assert.equal((await call("/subscription", key, body)).status, 400);
  body.subscription.endpoint = "https://fcm.googleapis.com/test-fixture";
  body.threshold = 99;
  assert.equal((await call("/subscription", key, body)).status, 400);
});
test("score alerts: quiet hours, closure/safety suppression and daily deduplication", async () => {
  const db = store(), now = new Date("2026-10-07T12:00:00Z");
  const subscription = { id: "fixture", vault: "fixture", subscription: { endpoint: "https://fcm.googleapis.com/test-fixture" }, venues: ["thornwood", "hanningfield"], threshold: 5, last: {} };
  await db.setJSON("subscriptions/fixture", subscription);
  let sent = 0;
  const sender = async () => { sent++; };
  const fetcher = async waters => {
    assert.ok(!waters.some(v => v.id === "hanningfield"), "known closure is excluded");
    return Object.fromEntries(waters.map(v => [v.id, { at: new Date(), week: [{ date: now, hi: 15, lo: 8, cloud: 80, wind: 10, gust: 20, rain: 0, press: "steady", dir: "SW" }] }]));
  };
  await evaluateAlerts({ now: new Date("2026-10-07T23:00:00Z"), fetcher, sender });
  assert.equal(sent, 0);
  const thunder = async waters => { const feeds = await fetcher(waters); Object.values(feeds).forEach(f => f.week[0].thunder = true); return feeds; };
  await evaluateAlerts({ now, fetcher: thunder, sender }); assert.equal(sent, 0);
  await evaluateAlerts({ now, fetcher, sender }); assert.equal(sent, 1);
  await evaluateAlerts({ now, fetcher, sender }); assert.equal(sent, 1);
});
test("river proxy validates inputs", async () => {
  assert.equal((await call("/rivers?lat=0&lon=0")).status, 400);
  assert.equal((await call("/readings?measure=../../private")).status, 400);
});
test.after(async () => { await rm(root, { recursive: true, force: true }); });
