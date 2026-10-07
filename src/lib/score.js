import { DAYS } from "./util.js";
import { keyOf } from "../theme.js";
import { MONTH_GUIDE } from "../data/guide.js";
import { solunarAt } from "./astro.js";

const WATER_BASE = [4, 4, 6, 9, 13, 17, 20, 20, 17, 13, 9, 6];
export function estimateWater(day, prev, profile) {
  const memory = prev.length ? prev.reduce((a, p) => a + (p.hi + p.lo) / 2, 0) / prev.length : (day.hi + day.lo) / 2;
  const air = 0.65 * memory + 0.35 * day.hi;
  const base = WATER_BASE[day.date.getMonth()];
  let w = 0.5 * base + 0.5 * air;
  if (profile.spring) w += (10.5 - w) * 0.35;
  if (profile.depth === "deep") w += (base - w) * 0.3;
  if (profile.depth === "shallow") w += (air - w) * 0.3;
  return Math.round(w * 10) / 10;
}

/* Soft cap: raw scores up to 7 unchanged; above that they compress towards 10,
   so a great day (9+) stands out from a merely good one instead of every day hitting 10. */
const soften = (raw) => (raw <= 7 ? raw : 7 + 3 * (1 - Math.exp(-(raw - 7) / 3)));

export function scoreDay(day, prev, profile = {}) {
  let s = 5; const R = [];
  const water = estimateWater(day, prev, profile);
  const relief = profile.depth === "deep" ? 0.55 : profile.depth === "medium" ? 0.8 : 1.15;
  if (water >= 21) { s -= 3.5 * relief; R.push({ bad: true, t: profile.depth === "deep" ? "Water warm — only the deep water is holding feeding fish" : "Water too warm, oxygen low — trout stressed and off the feed" }); }
  else if (water >= 18) { s -= 1.5 * relief; R.push({ bad: true, t: "Water on the warm side — fish deep, early start pays" }); }
  else if (water >= 10) { s += 1.5; R.push({ bad: false, t: `Water ~${Math.round(water)}°C — right in the feeding band` }); }
  else if (water >= 7) { s += 0.5; R.push({ bad: false, t: "Cool water — fish feeding, but slower and lower" }); }
  else if (water >= 4) { s -= 1; R.push({ bad: true, t: "Cold water — short feeding spells, mostly midday" }); }
  else { s -= 2.5; R.push({ bad: true, t: "Water near freezing — very tough going" }); }
  if (profile.spring && (water < 8 || water > 18)) { s += 0.5; R.push({ bad: false, t: "Spring-fed — groundwater buffers the extremes here" }); }
  if (day.press === "falling") { s += 1.5; R.push({ bad: false, t: `Falling barometer${day.pDelta != null ? ` (${day.pDelta} hPa)` : ""} — classic feeding trigger` }); }
  else if (day.press === "steady-high") { s -= 1; R.push({ bad: true, t: `Static high pressure${day.pMean ? ` (~${Math.round(day.pMean)} hPa)` : ""} — the lockjaw pattern` }); }
  else if (day.press === "rising") { s -= 0.5; R.push({ bad: true, t: "Pressure rebuilding after the front — fish often sulk" }); }
  if (day.pFastDrop != null && day.pFastDrop <= -2 && day.press !== "falling") { s += 0.5; R.push({ bad: false, t: `Barometer drops ${Math.abs(day.pFastDrop)} hPa in 3h during the day — front arriving, watch for a feeding spell` }); }
  if (day.lo >= 18) { s -= 1.5; R.push({ bad: true, t: "Tropical night — no overnight cooling, dawn window gone" }); }
  else if (day.lo <= 2 && water < 8) { s -= 0.5; R.push({ bad: true, t: "Frost overnight — wait for the sun to lift the margins" }); }
  else if (day.lo <= 13 && water >= 17) { s += 1; R.push({ bad: false, t: "Cool night recovers the water — fish the first two hours" }); }
  if (day.cloud >= 60) { s += 1.5; R.push({ bad: false, t: "Good cloud cover — confident fish, all-day sport" }); }
  else if (day.cloud >= 35) { s += 0.5; R.push({ bad: false, t: "Broken cloud — useful cover" }); }
  else { s -= 1.5; R.push({ bad: true, t: "Bright, clear sky — fish spooky and sitting deep" }); }
  if (day.wind >= 5 && day.wind <= 15) { s += 1; R.push({ bad: false, t: `Fishing breeze from the ${day.dir} — ripple hides the leader` }); }
  else if (day.wind < 5) { s -= 1; R.push({ bad: true, t: "Flat calm — every cast shows, go fine and long" }); }
  else if (day.wind > 22 || day.gust > 35) { s -= 1.5; R.push({ bad: true, t: `Too windy (gusts ${day.gust} mph) — brutal casting, fish off the feed` }); }
  else { s -= 0.5; R.push({ bad: true, t: "Fresh wind — pick a sheltered bank, shorten the leader" }); }
  if (day.rain >= 3 && day.rain <= 15) { s += 0.5; R.push({ bad: false, t: "Rain freshens and oxygenates the water" }); }
  else if (day.rain > 15) { s -= 1; R.push({ bad: true, t: "Heavy rain — colour and runoff, fish go off for a spell" }); }
  if (day.thunder) { s -= 1.5; R.unshift({ bad: true, t: "Thunderstorms forecast — carbon rods conduct lightning; get off the bank when it nears" }); }
  if (day.fog) R.push({ bad: true, t: "Fog forecast — slow start, take care on the drive" });
  s = Math.max(0, Math.min(10, Math.round(soften(s) * 10) / 10));
  const colorKey = keyOf(s);
  const verdict = { go: "Go fishing", fair: "Worth a cast", poor: "Stay home" }[colorKey];
  const tip = colorKey === "go" ? (day.cloud >= 60 ? "Fishable all day — stay out until the light goes." : "Make the most of it — a steady slow retrieve will do the work.")
    : colorKey === "fair" ? (water >= 17 ? "Dawn raid — first light until the sun gets up." : water < 8 ? "Late start — fish the warmest hours, midday to three." : "Pick your window and fish it hard; expect a short spell.")
    : "Tie flies, book the better day — the fish aren't playing.";
  const safety = R.filter((r) => /Thunder/.test(r.t));
  const good = R.filter((r) => !r.bad), bad = R.filter((r) => r.bad && !/Thunder/.test(r.t));
  return { score: s, verdict, colorKey, water, reasons: [...safety, ...good.slice(0, 2), ...bad.slice(0, 2), ...good.slice(2, 3)].slice(0, 5), tip };
}
export function scoreWeek(week, profile) {
  return week.map((day, i) => ({ ...day, label: DAYS[day.date.getDay()], result: scoreDay(day, week.slice(Math.max(0, i - 2), i), profile) }));
}

/* Hourly index — v1 logic plus pressure tendency, rain chance and solunar periods */
export function hourlyIndex(day, sun, sol) {
  const w = day.result.water, base = day.result.score;
  const H = day.hourly;
  return Array.from({ length: 24 }, (_, h) => {
    const night = h < sun.riseH - 1 || h > sun.setH + 1;
    if (night) return { h, score: 0, night: true };
    const cloud = H ? H.cloud[h] : day.cloud, wind = H ? H.wind[h] : day.wind, rain = H ? H.rain[h] : 0, temp = H ? H.temp[h] : null;
    let m = 0;
    if (cloud >= 60) m += 0.8; else if (cloud < 35) m -= 0.8;
    if (wind >= 5 && wind <= 15) m += 0.5; else if (wind < 4) m -= 0.5; else if (wind > 22) m -= 1;
    if (rain > 3) m -= 0.7;
    const dawn = h >= sun.riseH - 1 && h < sun.riseH + 2.5, dusk = h > sun.setH - 2.5 && h <= sun.setH + 1, mid = h >= 11 && h < 15;
    if (w >= 17) { if (dawn) m += 1.5; if (dusk) m += 1.2; if (mid) m -= 1.2; }
    else if (w < 8) { if (mid || (h >= 13 && h < 16)) m += 1.3; if (dawn) m -= 1.5; if (dusk) m -= 0.8; }
    else { if (dawn || dusk) m += 0.6; if (cloud < 35 && mid) m -= 0.8; }
    if (temp != null && temp <= 2) m -= 0.6;
    const tend = H && H.tend ? H.tend[h] : 0;
    if (tend <= -1) m += 0.6; else if (tend >= 1.5) m -= 0.3;
    if (H && H.code && H.code[h] >= 95) m -= 2.5;
    const sb = solunarAt(sol, h, day.date);
    m += sb * 0.4;
    return { h, score: Math.max(0, Math.min(10, Math.round((base + m) * 10) / 10)), night: false, cloud, wind, temp, tend, solunar: sb };
  });
}
export function bestWindow(hours) {
  let best = { start: 0, avg: -1 };
  for (let i = 0; i < 22; i++) { const a = (hours[i].score + hours[i + 1].score + hours[i + 2].score) / 3; if (!hours[i].night && a > best.avg) best = { start: i, avg: a }; }
  return { start: best.start, end: best.start + 3, avg: Math.round(best.avg * 10) / 10 };
}

/* Fly box: this month's guide, re-ordered and annotated for the day's conditions */
export const OPPOSITE = { N: "south", NE: "south-west", E: "west", SE: "north-west", S: "north", SW: "north-east", W: "east", NW: "south-east" };
export function flyBox(day) {
  const g = MONTH_GUIDE[day.date.getMonth()], w = day.result.water, bright = day.cloud < 35, ripple = day.wind >= 5 && day.wind <= 15;
  const lureFirst = w < 8 || day.wind > 15 || (!bright && day.rain > 3);
  const notes = [];
  if (bright && !ripple) notes.push("Bright & calm: go a size smaller, naturals over lures, 15ft+ leader.");
  if (ripple && day.cloud >= 50) notes.push("Cloud & ripple: washing-line of buzzers under a booby or dry.");
  if (day.wind > 15) notes.push("Fresh wind: heavier flies, a weighted point fly, shorter leader.");
  if (w >= 18) notes.push("Warm water: get down early with a DI-3 or booby on a short leader.");
  if (w < 8) notes.push("Cold water: slow everything — static booby, long pauses, bright lures.");
  if (day.rain > 3) notes.push("Coloured water after rain: brighter or darker silhouettes — orange, black, or a Blob.");
  if (bright && w >= 14) notes.push("Bright sun drives daphnia deep — count your sinking line down until you find the fish.");
  const colour = bright ? "Natural, darker colours: black, olive, brown" : day.cloud >= 70 ? "Brighter is better under heavy cloud: orange, white, lime" : "Mix it up: one natural, one bright";
  return { flies: g.flies, lures: g.lures, lureFirst, notes, colour, biting: g.biting, guide: g };
}
export function method(day) {
  const w = day.result.water, bright = day.cloud < 35;
  if (w >= 18) return { line: "DI-3 / fast glass", leader: "6–9ft fluoro", retrieve: "Slow figure-of-eight, hang at the end", depth: "8–15ft+" };
  if (w < 8) return { line: "DI-3 or DI-5", leader: "4–6ft", retrieve: "Static booby, or dead slow with long pauses", depth: "Bottom foot" };
  if (bright && day.wind < 5) return { line: "Floating / slow glass", leader: "15–18ft fluoro", retrieve: "Barely moving, let it swing", depth: "3–6ft" };
  if (day.cloud >= 60) return { line: "Floating", leader: "12–15ft, 3 flies", retrieve: "Washing line, drift with the wind", depth: "1–4ft" };
  return { line: "Intermediate", leader: "10–12ft", retrieve: "Steady pulls, vary the pace", depth: "3–8ft" };
}
