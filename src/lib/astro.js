import SunCalc from "suncalc";

/* Sunrise / sunset — same algorithm as v1 */
export function sunTimes(date, lat, lon) {
  const rad = Math.PI / 180;
  const noon = new Date(date); noon.setUTCHours(12, 0, 0, 0);
  const n = Math.round(noon.getTime() / 86400000 + 2440587.5 - 2451545.0);
  const Js = n - lon / 360;
  const M = ((357.5291 + 0.98560028 * Js) % 360 + 360) % 360;
  const Cc = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const L = (M + Cc + 180 + 102.9372) % 360;
  const Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
  const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
  const cw = (Math.sin(-0.83 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
  const w = Math.acos(Math.max(-1, Math.min(1, cw))) / rad;
  const toDate = (J) => new Date((J - 2440587.5) * 86400000);
  const rise = toDate(Jt - w / 360), set = toDate(Jt + w / 360);
  return { rise, set, dayLen: (2 * w) / 15, riseH: rise.getHours() + rise.getMinutes() / 60, setH: set.getHours() + set.getMinutes() / 60 };
}

export function moonPhase(date) {
  const syn = 29.530588853;
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const frac = (((days % syn) + syn) % syn) / syn;
  const illum = Math.round(((1 - Math.cos(frac * 2 * Math.PI)) / 2) * 100);
  const names = ["New", "Waxing crescent", "First quarter", "Waxing gibbous", "Full", "Waning gibbous", "Last quarter", "Waning crescent"];
  const glyphs = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const i = Math.round(frac * 8) % 8;
  return { name: names[i], glyph: glyphs[i], illum, frac };
}

/* Solunar periods.
   Major = moon overhead (upper transit) or underfoot (lower transit), ±1h.
   Minor = moonrise / moonset, ±30 min.
   Strength is boosted near new/full moon and when a period overlaps sunrise/sunset. */
export function solunar(date, lat, lon, sun) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  let maxAlt = -Infinity, minAlt = Infinity, upper = null, lower = null;
  for (let m = 0; m <= 24 * 60; m += 5) {
    const t = new Date(start.getTime() + m * 60000);
    const alt = SunCalc.getMoonPosition(t, lat, lon).altitude;
    if (alt > maxAlt) { maxAlt = alt; upper = t; }
    if (alt < minAlt) { minAlt = alt; lower = t; }
  }
  const mt = SunCalc.getMoonTimes(start, lat, lon);
  const span = (t, mins) => ({ start: new Date(t.getTime() - mins * 60000), end: new Date(t.getTime() + mins * 60000), at: t });
  const majors = [upper && span(upper, 60), lower && span(lower, 60)].filter(Boolean).map((p, i) => ({ ...p, kind: "major", label: i === 0 ? "Moon overhead" : "Moon underfoot" }));
  const minors = [mt.rise && { ...span(mt.rise, 30), label: "Moonrise" }, mt.set && { ...span(mt.set, 30), label: "Moonset" }].filter(Boolean).map((p) => ({ ...p, kind: "minor" }));
  const periods = [...majors, ...minors].sort((a, b) => a.start - b.start);
  const ph = moonPhase(date);
  const nearSyzygy = Math.min(ph.frac, Math.abs(ph.frac - 0.5), 1 - ph.frac) < 0.07;
  const overlapsLight = sun && periods.some((p) => [sun.rise, sun.set].some((s) => Math.abs(s - p.at) < 90 * 60000));
  const rating = 1 + (nearSyzygy ? 1 : 0) + (overlapsLight ? 1 : 0); // 1..3
  return { periods, moonrise: mt.rise || null, moonset: mt.set || null, rating, nearSyzygy, overlapsLight };
}

/* Solunar boost for an hour (0..1) */
export function solunarAt(sol, h, date) {
  if (!sol) return 0;
  const t0 = new Date(date); t0.setHours(h, 0, 0, 0);
  const t1 = new Date(t0.getTime() + 3600000);
  let b = 0;
  sol.periods.forEach((p) => { if (p.start < t1 && p.end > t0) b = Math.max(b, p.kind === "major" ? 1 : 0.5); });
  return b;
}
