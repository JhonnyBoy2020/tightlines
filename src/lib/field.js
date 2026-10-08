import { VENUES } from "../data/venues.js";
import { closureFor } from "../data/reports.js";
import { milesFrom, venueStatus } from "./util.js";
import { scoreWeek, hourlyIndex } from "./score.js";
import { sunTimes } from "./astro.js";

export const londonDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(date);
export const emptyField = () => ({ version: 1, flies: [], plan: { date: londonDate(), start: 9, end: 15, radius: 40, mode: "bank" }, session: null });
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
const str = (v, max = 120) => typeof v === "string" ? v.trim().slice(0, max) : "";
const id = v => typeof v === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
const integer = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
export const validDate = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + "T12:00:00Z")) && new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;
export function validateField(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.flies) || input.flies.length > 200) fail("Choose a valid TightLines field-book backup (maximum 200 fly patterns).");
  const p = input.plan;
  if (!p || !validDate(p.date) || !integer(p.start, 0, 23) || !integer(p.end, 1, 24) || p.end <= p.start || !integer(p.radius, 5, 150) || !["bank", "boat"].includes(p.mode)) fail("Choose a valid date, fishing hours, radius and bank/boat preference.");
  const flies = input.flies.map(f => {
    if (!id(f.id) || !str(f.name) || !integer(f.quantity, 0, 999)) fail("Each fly needs a name and a whole-number quantity (0–999).");
    return { id: f.id, name: str(f.name), size: str(f.size, 20), colour: str(f.colour, 40), quantity: f.quantity };
  });
  if (new Set(flies.map(f => f.id)).size !== flies.length) fail("Duplicate fly IDs in backup.");
  let session = null;
  if (input.session) {
    const s = input.session;
    if (!id(s.id) || !VENUES.some(v => v.id === s.venueId) || !Number.isFinite(s.startedAt) || !Number.isFinite(s.lastStarted) || !Number.isFinite(s.elapsed) || s.elapsed < 0 || s.elapsed > 864000000 || !Array.isArray(s.events) || s.events.length > 500) fail("Invalid fishing session in backup.");
    session = { id: s.id, venueId: s.venueId, startedAt: s.startedAt, lastStarted: s.lastStarted, elapsed: s.elapsed, running: !!s.running, fly: str(s.fly), events: s.events.map(e => {
      if (!id(e.id) || !["catch", "missed", "fly"].includes(e.type) || !Number.isFinite(e.at)) fail("Invalid session event.");
      return { id: e.id, type: e.type, at: e.at, fly: str(e.fly) };
    }) };
  }
  return { version: 1, plan: { date: p.date, start: p.start, end: p.end, radius: p.radius, mode: p.mode }, flies, session };
}
export function elapsedMs(s, now = Date.now()) { return s ? s.elapsed + (s.running ? Math.max(0, now - s.lastStarted) : 0) : 0; }
export function rankTrips(venues, feeds, home, plan, now = Date.now()) {
  return venues.map(v => {
    const distance = milesFrom(v, home), feed = feeds[v.id];
    if (distance > plan.radius || !feed || feed instanceof Error || feed.stale || !Number.isFinite(new Date(feed.at).getTime()) || now - new Date(feed.at).getTime() > 90 * 60000) return null;
    const day = scoreWeek(feed.week, v.profile).find(d => londonDate(d.date) === plan.date);
    if (!day || closureFor(v.id) || venueStatus(v, day.date) || day.thunder || day.gust >= 35 || day.result.water >= 20) return null;
    if (plan.mode === "boat" && !/boats/i.test(v.ticket)) return null;
    // Planning times are always UK clock time, regardless of the user's device timezone.
    // No solunar uplift in the planner: rank weather, not an unvalidated lunar hypothesis.
    const sun = sunTimes(day.date, v.lat, v.lon);
    const ukHour = date => { const [h, m] = date.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).split(":").map(Number); return h + m / 60; };
    const hours = hourlyIndex(day, { ...sun, riseH: ukHour(sun.rise), setH: ukHour(sun.set) }, null).filter(h => h.h >= plan.start && h.h < plan.end && !h.night);
    if (!hours.length) return null;
    const score = Math.round(hours.reduce((n, h) => n + h.score, 0) / hours.length * 10) / 10;
    return { v, distance, day, hours, score, fetchedAt: feed.at };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.distance - b.distance).slice(0, 3);
}
