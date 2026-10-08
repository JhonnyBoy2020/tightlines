import { randomBytes, createHash } from "node:crypto";
import webpush from "web-push";
import { store } from "./storage.mjs";
import { VENUES } from "../src/data/venues.js";
import { closureFor } from "../src/data/reports.js";
import { fetchMany } from "../src/lib/weather.js";
import { scoreWeek } from "../src/lib/score.js";
import { venueStatus } from "../src/lib/util.js";
import { deployment } from "./deployment-context.generated.js";
import { validateField } from "../src/lib/field.js";
import { aiStatus, coach } from "./ai.mjs";

const sha = text => createHash("sha256").update(text).digest("hex");
const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const cleanID = s => typeof s === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(s);
const text = (s, max = 1200) => typeof s === "string" ? s.trim().slice(0, max) : "";
const cache = new Map();
const EA = "https://environment.data.gov.uk/flood-monitoring";
async function remote(url, ttl = 300000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  const res = await fetch(url, { signal: AbortSignal.timeout(18000), headers: { Accept: "application/json" } });
  if (!res.ok) throw bad("The Environment Agency feed is temporarily unavailable. Please retry.", 502);
  const data = await res.json();
  if (cache.size > 150) cache.delete(cache.keys().next().value);
  cache.set(url, { at: Date.now(), data });
  return data;
}
async function auth(req) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw bad("Enter a valid private logbook key.", 401);
  const id = sha(token);
  if (!await store().get(`vault/${id}`, { type: "json" })) throw bad("This logbook key was not found on this host. Check the key and website.", 401);
  return id;
}
async function body(req) {
  const raw = await req.text();
  if (raw.length > 300000) throw bad("This request is too large.", 413);
  try { return JSON.parse(raw); } catch { throw bad("Invalid JSON."); }
}
export async function pushKeys() {
  const db = store();
  let keys = await db.get("system/vapid", { type: "json" });
  if (!keys) {
    const generated = webpush.generateVAPIDKeys();
    await db.setJSON("system/vapid", generated, { onlyIfNew: true });
    keys = await db.get("system/vapid", { type: "json" });
  }
  return keys;
}
function validateSubscription(s) {
  let u; try { u = new URL(s?.endpoint); } catch { throw bad("Invalid push subscription."); }
  const h = u.hostname;
  const trusted = h === "fcm.googleapis.com" || h === "updates.push.services.mozilla.com" || h.endsWith(".push.apple.com") || h === "web.push.apple.com" || h.endsWith(".notify.windows.com");
  if (u.protocol !== "https:" || u.port || u.username || u.password || !trusted) throw bad("Unsupported notification provider.");
  if (!/^[A-Za-z0-9_-]{80,100}={0,2}$/.test(s.keys?.p256dh) || !/^[A-Za-z0-9_-]{20,30}={0,2}$/.test(s.keys?.auth)) throw bad("Invalid subscription keys.");
  return { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } };
}
export async function sendPush(subscription, payload) {
  const keys = await pushKeys();
  return webpush.sendNotification(subscription, JSON.stringify(payload), { vapidDetails: { subject: "https://tightlines-uk.netlify.app", ...keys }, TTL: 1800, timeout: 10000 });
}
export async function handler(req) {
  try {
    const u = new URL(req.url);
    const route = u.pathname.replace(/^.*\/(?:api|functions\/api)/, "") || "/";
    if (req.method !== "GET") {
      const origin = req.headers.get("origin");
      if (origin && origin !== u.origin && !process.env.TL_PREVIEW_DATA) throw bad("Cross-origin request refused.", 403);
    }
    if (route === "/health") return json({ ok: true, storage: process.env.TL_PREVIEW_DATA ? "private development server" : "Netlify Blobs", scheduled: deployment.production, push: true });
    if (route === "/ai/status" && req.method === "GET") return json(aiStatus());
    if (route === "/rivers" && req.method === "GET") {
      const lat = Number(u.searchParams.get("lat")), lon = Number(u.searchParams.get("lon"));
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 49 || lat > 56 || lon < -7 || lon > 3) throw bad("Select a location in England.");
      const source = `${EA}/id/stations?parameter=level&status=Active&lat=${lat}&long=${lon}&dist=35&_limit=150`;
      const data = await remote(source);
      return json({ items: (data.items || []).filter(s => s.lat && s.long).map(s => ({ id: s.stationReference, label: Array.isArray(s.label) ? s.label.join(", ") : s.label, river: s.riverName || "Watercourse not supplied", lat: s.lat, lon: s.long, measures: (Array.isArray(s.measures) ? s.measures : [s.measures]).filter(Boolean).filter(m => m.parameter === "level" || m.parameter === "flow").map(m => ({ id: m["@id"].split("/").pop(), unit: m.unitName, qualifier: m.qualifier, latest: m.latestReading })) })), source, fetchedAt: new Date().toISOString() });
    }
    if (route === "/readings" && req.method === "GET") {
      const measure = u.searchParams.get("measure");
      if (!cleanID(measure)) throw bad("Invalid measure.");
      const since = new Date(Date.now() - 48 * 3600000).toISOString();
      const source = `${EA}/id/measures/${encodeURIComponent(measure)}/readings?since=${since}&_sorted&_limit=300`;
      const data = await remote(source);
      return json({ items: (data.items || []).filter(r => Number.isFinite(r.value)).sort((a, b) => a.dateTime.localeCompare(b.dateTime)), source, fetchedAt: new Date().toISOString() });
    }
    if (route === "/vault" && req.method === "POST") {
      // A random 256-bit capability; only its hash is stored. No email, no tracking.
      const key = randomBytes(32).toString("base64url");
      await store().setJSON(`vault/${sha(key)}`, { createdAt: new Date().toISOString() }, { onlyIfNew: true });
      return json({ key }, 201);
    }
    const vault = await auth(req), db = store(), prefix = `records/${vault}/`;
    if (route === "/ai/brief" && req.method === "POST") return json(await coach(await body(req), vault, db));
    if (route === "/field") {
      const key = `field/${vault}`, old = await db.getWithMetadata(key, { type: "json" });
      if (req.method === "GET") return json({ data: old?.data || null, revision: old?.etag || "new" });
      if (req.method !== "PUT") throw bad("Method not allowed.", 405);
      const input = await body(req), data = validateField(input.data);
      if (input.revision !== (old?.etag || "new")) throw bad("Another device changed this field book. Export your draft, then load the saved copy before saving again.", 409);
      const saved = await db.setJSON(key, data, old ? { onlyIfMatch: old.etag } : { onlyIfNew: true });
      if (!saved.modified) throw bad("Another device saved first. Export your draft and reload the saved field book.", 409);
      if (!saved.etag) throw bad("Saved, but a confirmation token was unavailable. Load the saved copy before further edits.", 409);
      return json({ revision: saved.etag });
    }
    if (route === "/sync" && req.method === "POST") {
      const input = await body(req);
      const entries = input.entries || [], deleted = input.deleted || [];
      if (!Array.isArray(entries) || entries.length > 500 || !Array.isArray(deleted) || deleted.length > 500) throw bad("Sync up to 500 entries at a time.");
      for (const item of entries) {
        const id = String(item.id);
        if (!cleanID(id) || !VENUES.some(v => v.id === item.venueId)) throw bad("Invalid catch record.");
        if (!Number.isInteger(Number(item.fish)) || Number(item.fish) < 0 || Number(item.fish) > 9999) throw bad("Fish caught must be a whole number from 0 to 9999.");
        const conditionJSON = item.cond && typeof item.cond === "object" ? JSON.stringify(item.cond) : "";
        if (conditionJSON.length > 5000) throw bad("Condition snapshot is too large.");
        const record = { id, venueId: item.venueId, venueName: VENUES.find(v => v.id === item.venueId).name, fish: String(item.fish), date: text(item.date, 40), best: text(item.best, 120), fly: text(item.fly, 120), line: text(item.line, 120), note: text(item.note), score: Number.isFinite(item.score) ? item.score : null, cond: conditionJSON ? JSON.parse(conditionJSON) : null, durationMinutes: Number.isFinite(item.durationMinutes) ? Math.max(0, Math.min(14400, item.durationMinutes)) : null, missedTakes: Number.isInteger(item.missedTakes) ? Math.max(0, Math.min(500, item.missedTakes)) : 0, savedAt: new Date().toISOString() };
        // Immutable entries + permanent tombstones: concurrent devices never resurrect deletes.
        await db.setJSON(prefix + id, record, { onlyIfNew: true });
      }
      for (const id of deleted) {
        if (!cleanID(String(id))) throw bad("Invalid record id.");
        await db.setJSON(prefix + id, { id: String(id), deleted: true, savedAt: new Date().toISOString() });
      }
      const { blobs } = await db.list({ prefix });
      const records = [];
      for (const b of blobs) { const record = await db.get(b.key, { type: "json" }); if (record) records.push(record); }
      return json({ records, syncedAt: new Date().toISOString() });
    }
    if (route === "/reports") {
      const p = `reports/${vault}/`;
      if (req.method === "POST") {
        const b = await body(req);
        if (!VENUES.some(v => v.id === b.venueId) || !/^\d{4}-\d{2}-\d{2}$/.test(b.eventDate) || !b.title?.trim()) throw bad("Add a water, report date and title.");
        let source; try { source = new URL(b.url); } catch { throw bad("Add the original report's web address."); }
        if (!["https:", "http:"].includes(source.protocol) || source.username || source.password) throw bad("Use an HTTP or HTTPS source address.");
        const id = randomBytes(16).toString("hex");
        await db.setJSON(p + id, { id, venueId: b.venueId, eventDate: b.eventDate, title: text(b.title, 160), text: text(b.text), url: source.href, source: "Your saved source (not independently verified)", type: "saved report", checkedAt: new Date().toISOString().slice(0, 10) });
      } else if (req.method !== "GET") throw bad("Method not allowed.", 405);
      const { blobs } = await db.list({ prefix: p });
      const items = []; for (const b of blobs) items.push(await db.get(b.key, { type: "json" }));
      return json({ items: items.filter(Boolean) });
    }
    if (route === "/push-key" && req.method === "GET") return json({ publicKey: (await pushKeys()).publicKey });
    if (route === "/subscription" && req.method === "POST") {
      const b = await body(req), subscription = validateSubscription(b.subscription);
      const venues = [...new Set(b.venues || [])].filter(id => VENUES.some(v => v.id === id)).slice(0, 5);
      if (!venues.length || !Number.isFinite(b.threshold) || b.threshold < 5 || b.threshold > 10) throw bad("Choose 1–5 waters and a score from 5 to 10.");
      const id = sha(subscription.endpoint);
      const old = await db.get(`subscriptions/${id}`, { type: "json" });
      if (old && old.vault !== vault) throw bad("This device is subscribed to a different logbook. Disable its alerts first.", 409);
      await db.setJSON(`subscriptions/${id}`, { id, vault, subscription, venues, threshold: b.threshold, last: old?.last || {}, createdAt: new Date().toISOString() });
      return json({ ok: true, scheduled: deployment.production });
    }
    if (route === "/subscription" && req.method === "DELETE") {
      const b = await body(req), id = sha(b.endpoint || "");
      const old = await db.get(`subscriptions/${id}`, { type: "json" });
      if (old?.vault === vault) await db.delete(`subscriptions/${id}`);
      return json({ ok: true });
    }
    if (route === "/push-test" && req.method === "POST") {
      const b = await body(req), id = sha(b.endpoint || "");
      const old = await db.getWithMetadata(`subscriptions/${id}`, { type: "json" });
      if (!old || old.data.vault !== vault) throw bad("Enable alerts on this device first.");
      if (Date.now() - (old.data.testAt || 0) < 60000) throw bad("Wait one minute before another test.", 429);
      const claimed = await db.setJSON(`subscriptions/${id}`, { ...old.data, testAt: Date.now() }, { onlyIfMatch: old.etag });
      if (!claimed.modified) throw bad("Please retry.", 409);
      await sendPush(old.data.subscription, { title: "Pocket Ghillie is connected", body: "Test notification. No fishing recommendation is implied.", url: "/", tag: "tightlines-test" });
      return json({ ok: true });
    }
    throw bad("Not found.", 404);
  } catch (e) {
    console.error("TightLines service:", e.status || 500, e.message);
    return json({ error: e.status ? e.message : "The service could not complete this request. Your local records are unchanged; please retry." }, e.status || 503);
  }
}

export async function evaluateAlerts({ fetcher = fetchMany, sender = sendPush, now = new Date() } = {}) {
  const db = store(), { blobs } = await db.list({ prefix: "subscriptions/" });
  const subscriptions = [];
  for (const b of blobs) { const item = await db.getWithMetadata(b.key, { type: "json" }); if (item) subscriptions.push({ key: b.key, ...item }); }
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/London" }).format(now));
  if (hour < 6 || hour >= 21) return { sent: 0, reason: "quiet hours" };
  const ids = [...new Set(subscriptions.flatMap(s => s.data.venues))];
  const waters = VENUES.filter(v => ids.includes(v.id) && !closureFor(v.id));
  if (!waters.length) return { sent: 0 };
  const feeds = await fetcher(waters), dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
  let sent = 0;
  for (const s of subscriptions) {
    const last = { ...s.data.last }, matches = [];
    for (const v of waters.filter(v => s.data.venues.includes(v.id))) {
      const feed = feeds[v.id];
      if (!feed || feed instanceof Error || Date.now() - new Date(feed.at) > 90 * 60000) continue;
      const day = scoreWeek(feed.week, v.profile)[0];
      if (!day || venueStatus(v, day.date) || day.thunder || day.gust >= 35 || day.result.water >= 20) continue;
      if (day.result.score >= s.data.threshold && last[v.id] !== dayKey) { matches.push({ v, day }); last[v.id] = dayKey; }
    }
    if (!matches.length) continue;
    // Claim before send: overlapping scheduled invocations cannot double-send.
    const claim = await db.setJSON(s.key, { ...s.data, last }, { onlyIfMatch: s.etag });
    if (!claim.modified) continue;
    const m = matches.sort((a, b) => b.day.result.score - a.day.result.score)[0];
    try {
      await sender(s.data.subscription, { title: `${m.v.name}: ${m.day.result.score}/10`, body: "Forecast conditions meet your threshold. A model estimate, not a catch guarantee. Check access and weather before travelling.", url: `/?water=${m.v.id}`, tag: `tightlines-${dayKey}` });
      sent++;
    } catch (e) {
      if ([404, 410].includes(e.statusCode)) await db.delete(s.key);
      // Keep claim on transient errors: at-most-once is preferable to duplicates.
      console.error("Push delivery failed", e.statusCode || "network");
    }
  }
  return { sent };
}
