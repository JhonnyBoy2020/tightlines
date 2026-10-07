import React, { useState, useMemo, useEffect } from "react";

/* ============================================================
   TIGHTLINES UK — live stillwater trout conditions
   Data: Open-Meteo hourly feed (no key) → sample fallback
   ============================================================ */

const C = {
  bg: "#0A0F14", panel: "#111920", panel2: "#162029", line: "rgba(255,255,255,0.08)", line2: "rgba(255,255,255,0.14)",
  text: "#E9EFF3", muted: "#8A98A6", dim: "#5C6A77",
  cyan: "#4FD6C8", cyanBg: "rgba(79,214,200,0.12)",
  go: "#35D07F", goBg: "rgba(53,208,127,0.14)", fair: "#F2B544", fairBg: "rgba(242,181,68,0.14)", poor: "#F0564F", poorBg: "rgba(240,86,79,0.14)",
};
const F = {
  display: "'SF Pro Display',-apple-system,'Segoe UI',Roboto,sans-serif",
  body: "-apple-system,'SF Pro Text','Segoe UI',Roboto,sans-serif",
  mono: "ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace",
};
const COL = (k) => ({ go: C.go, fair: C.fair, poor: C.poor }[k]);
const BG = (k) => ({ go: C.goBg, fair: C.fairBg, poor: C.poorBg }[k]);
const keyOf = (s) => (s >= 7 ? "go" : s >= 4.5 ? "fair" : "poor");
const PRESS = { falling: { glyph: "↘", label: "falling" }, "steady-high": { glyph: "▲", label: "static high" }, steady: { glyph: "→", label: "steady" }, rising: { glyph: "↗", label: "rising" } };

/* ---------------- Venues ---------------- */
const VENUES = [
  { id: "thornwood", name: "Thornwood Springs", where: "Epping, Essex", lat: 51.7206, lon: 0.1248, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", website: "https://thornwoodsprings.com/", phone: "07588 669255", profile: { depth: "deep", spring: true, verified: true, note: "Spring-fed · holes to 23ft" } },
  { id: "hanningfield", name: "Hanningfield Reservoir", where: "Chelmsford, Essex", lat: 51.66, lon: 0.51, kind: "reservoir", species: "Rainbows & browns", ticket: "Day ticket & boats", website: "https://stillwaterfisheries.com/fish/hanningfield-reservoir/", phone: "01268 712180", profile: { depth: "deep", spring: false, verified: true, note: "Deep reservoir · to 55ft" } },
  { id: "chigboro", name: "Chigboro Fisheries", where: "Maldon, Essex", lat: 51.74, lon: 0.65, kind: "small", species: "Rainbows, browns & more", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/chigboro-fisheries/", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth" } },
  { id: "norton", name: "Norton Fishery", where: "near Ongar, Essex", lat: 51.67, lon: 0.2, kind: "small", species: "Rainbows, browns & more", ticket: "Day ticket", closed: ["Mon"], website: "http://www.nortonfishery.com/", profile: { depth: "deep", spring: true, verified: true, note: "Spring-fed · ruts to 26ft" } },
  { id: "dairymeade", name: "Dairymeade Fisheries", where: "Great Dunmow, Essex", lat: 51.9, lon: 0.33, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "http://flyandlure.org/listings/places_to_fly_fish/england/essex/dairymeade_fisheries", phone: "07923 578680", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth · confirm open" } },
  { id: "causeway", name: "Causeway Fly Fishers", where: "North-west Essex", lat: 52.0, lon: 0.21, kind: "small", species: "Rainbows, browns & more", ticket: "Members only", website: "https://www.causewayflyfishers.co.uk/", profile: { depth: "medium", spring: false, verified: true, note: "Medium depth" } },
  { id: "walthamstow", name: "Walthamstow Reservoirs", where: "Tottenham, London", lat: 51.586, lon: -0.053, kind: "reservoir", species: "Rainbows & browns", ticket: "Day ticket on arrival", website: "https://www.thameswater.co.uk/about-us/community/days-out/walthamstow-fishery", profile: { depth: "medium", spring: false, verified: false, note: "Victorian reservoirs · depth est." } },
  { id: "redbournbury", name: "Redbournbury Fishery", where: "Redbourn, Herts", lat: 51.782, lon: -0.362, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/redbournbury-fishery/", profile: { depth: "shallow", spring: false, verified: false, note: "Shallow" } },
  { id: "tringford", name: "Tringford Trout Fishery", where: "Tring, Herts", lat: 51.81, lon: -0.664, kind: "reservoir", species: "Rainbows & browns", ticket: "Book ahead", season: [4, 10], website: "https://www.tringfordtroutfishery.co.uk/", profile: { depth: "shallow", spring: false, verified: false, note: "Shallow · Apr–Oct" } },
  { id: "latchford", name: "Latchford Fly Fishers", where: "Standon, Herts", lat: 51.866, lon: 0.03, kind: "small", species: "Rainbows & browns", ticket: "Members only", website: "https://www.latchfordflyfishing.org/", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth" } },
  { id: "ribvalley", name: "Rib Valley Lakes", where: "Ware, Herts", lat: 51.827, lon: -0.036, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/rib-valley-fishing-lakes/", profile: { depth: "medium", spring: false, verified: false, note: "Trout stocking unconfirmed" } },
  { id: "albury", name: "Albury Estate Fisheries", where: "Guildford, Surrey", lat: 51.219, lon: -0.49, kind: "small", species: "Rainbows, browns & more", ticket: "Day ticket", website: "https://alburyestatefisheries.co.uk/", phone: "07976 810737", profile: { depth: "medium", spring: true, verified: true, note: "Spring-fed · medium depth" } },
  { id: "frensham", name: "Frensham Trout Fishery", where: "Farnham, Surrey", lat: 51.138, lon: -0.79, kind: "small", species: "Rainbows, browns & more", ticket: "Book ahead", website: "https://www.frenshamtroutfishery.com/", phone: "01252 591567", profile: { depth: "medium", spring: true, verified: true, note: "6 lakes · spring flow-through" } },
  { id: "coltsford", name: "Coltsford Mill", where: "Oxted, Surrey", lat: 51.237, lon: 0.0, kind: "small", species: "Rainbows, browns & more", ticket: "Book ahead", website: "https://www.coltsfordmill-fishery.co.uk/", profile: { depth: "medium", spring: false, verified: true, note: "River Eden-fed · avg 7–8ft" } },
  { id: "halliford", name: "Halliford Mere Lakes", where: "Shepperton, Surrey", lat: 51.39, lon: -0.461, kind: "small", species: "Rainbows, browns & more", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/halliford-mere/", profile: { depth: "medium", spring: true, verified: true, note: "Spring-fed · medium depth" } },
  { id: "hazelcopse", name: "Hazel Copse Fishery", where: "Dorking, Surrey", lat: 51.13, lon: -0.35, kind: "small", species: "Rainbows, browns & more", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/hazel-copse-fishery/", profile: { depth: "medium", spring: true, verified: false, note: "Spring-fed · medium depth" } },
  { id: "bewl", name: "Bewl Water", where: "Lamberhurst, Kent", lat: 51.08, lon: 0.39, kind: "reservoir", species: "Rainbows", ticket: "Day ticket & boats", website: "https://www.bewlwater.co.uk/fishing/trout-fishing", phone: "01892 890352", profile: { depth: "deep", spring: false, verified: true, note: "770-acre reservoir · deep" } },
  { id: "springhill", name: "Spring Hill Trout Waters", where: "Pembury, Kent", lat: 51.15, lon: 0.34, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", website: "https://www.springhilltroutwaters.co.uk/", phone: "01892 826041", profile: { depth: "medium", spring: true, verified: true, note: "Spring-fed · medium depth" } },
  { id: "chalybeate", name: "Chalybeate Springs", where: "Eridge Green, Kent", lat: 51.1, lon: 0.22, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/chalybeate-springs/", profile: { depth: "medium", spring: true, verified: false, note: "Spring-fed · medium depth" } },
  { id: "tenterden", name: "Tenterden Trout Waters", where: "Tenterden, Kent", lat: 51.07, lon: 0.66, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", season: [3, 11], website: "https://www.tenterden-trout-waters.co.uk/", phone: "01580 763201", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth · Mar–Nov" } },
  { id: "chequertree", name: "Chequertree Fishery", where: "Ashford, Kent", lat: 51.13, lon: 0.75, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "https://www.chequertreefishery.com/", phone: "01233 820078", profile: { depth: "shallow", spring: false, verified: false, note: "Shallow" } },
  { id: "boughbeech", name: "Bough Beech Reservoir", where: "Edenbridge, Kent", lat: 51.2, lon: 0.11, kind: "reservoir", species: "Rainbows & browns", ticket: "Book ahead", website: "https://www.fisheryguide.co.uk/", profile: { depth: "deep", spring: false, verified: false, note: "Deep water · confirm open" } },
  { id: "lakedown", name: "Lakedown Trout Fishery", where: "Heathfield, E. Sussex", lat: 50.98, lon: 0.3, kind: "small", species: "Rainbows & browns", ticket: "Book ahead", website: "https://www.lakedowntroutfishery.com/", phone: "01435 883449", profile: { depth: "medium", spring: true, verified: true, note: "4 spring-fed lakes" } },
  { id: "ashdown", name: "Ashdown Forest Fly Fishery", where: "off A22, E. Sussex", lat: 51.03, lon: 0.05, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", website: "https://flyfishingsussex.co.uk/", phone: "07415 094414", profile: { depth: "medium", spring: true, verified: true, note: "Spring-fed · medium depth" } },
  { id: "powdermill", name: "Powdermill Reservoir", where: "Battle, E. Sussex", lat: 50.93, lon: 0.52, kind: "reservoir", species: "Rainbows", ticket: "Members only", website: "https://www.hastingsflyfishers.co.uk/", phone: "01424 870498", profile: { depth: "deep", spring: false, verified: true, note: "Deep water" } },
  { id: "brickfarm", name: "Brick Farm Lakes", where: "Hailsham, E. Sussex", lat: 50.85, lon: 0.3, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/brick-farm-lakes/", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth" } },
  { id: "duncton", name: "Duncton Mill Fishery", where: "Petworth, W. Sussex", lat: 50.943, lon: -0.629, kind: "small", species: "Rainbows, browns & more", ticket: "Day ticket", website: "https://www.dunctonmilltroutfishery.co.uk/", phone: "01798 879139", profile: { depth: "medium", spring: true, verified: true, note: "Spring-fed · medium depth" } },
  { id: "felixfarm", name: "Felix Farm Trout Fishery", where: "Twyford, Berks", lat: 51.47, lon: -0.82, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "http://www.felixfarmtroutfishery.co.uk/", phone: "07962 355019", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth" } },
  { id: "barnelms", name: "Barn Elms Fly Fishery", where: "Theale, Berks", lat: 51.452, lon: -1.137, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", website: "https://www.barnelmsfishery.co.uk/", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth" } },
  { id: "sportfish", name: "Sportfish Game Fishing Centre", where: "Reading, Berks", lat: 51.43, lon: -1.06, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "https://www.sportfish.co.uk/", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth" } },
  { id: "grafham", name: "Grafham Water", where: "Huntingdon, Cambs", lat: 52.29, lon: -0.32, kind: "reservoir", species: "Rainbows & browns", ticket: "Day ticket & boats", website: "https://stillwaterfisheries.com/fish/grafham-water/", profile: { depth: "deep", spring: false, verified: true, note: "Large deep reservoir" } },
  { id: "pochard", name: "Pochard Lake Fishery", where: "Leighton Buzzard, Beds", lat: 51.95, lon: -0.66, kind: "small", species: "Rainbows & browns", ticket: "Day ticket", website: "https://stillwaterfisheries.com/fish/pochard-lake/", profile: { depth: "medium", spring: true, verified: false, note: "Spring-fed · medium depth" } },
  { id: "vicaragespinney", name: "Vicarage Spinney", where: "Milton Keynes, Bucks", lat: 52.09, lon: -0.85, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "https://www.dayticketlakes.com/buckinghamshire/vicarage-spinning-trout-fishery/", profile: { depth: "deep", spring: false, verified: false, note: "6m deep · confirm open" } },
  { id: "churchhill", name: "Church Hill Fishery", where: "Milton Keynes, Bucks", lat: 51.96, lon: -0.72, kind: "small", species: "Rainbows", ticket: "Day ticket", website: "https://www.dayticketlakes.com/buckinghamshire/", profile: { depth: "medium", spring: false, verified: false, note: "Medium depth · confirm open" } },
];

/* ---------------- Dates, sun, moon ---------------- */
const TODAY = new Date();
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const hhmm = (d) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateStr = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

function sunTimes(date, lat, lon) {
  const rad = Math.PI / 180;
  const noon = new Date(date); noon.setHours(12, 0, 0, 0);
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
function moonPhase(date) {
  const syn = 29.530588853;
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const frac = (((days % syn) + syn) % syn) / syn;
  const illum = Math.round(((1 - Math.cos(frac * 2 * Math.PI)) / 2) * 100);
  const names = ["New", "Waxing crescent", "First quarter", "Waxing gibbous", "Full", "Waning gibbous", "Last quarter", "Waning crescent"];
  const glyphs = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const i = Math.round(frac * 8) % 8;
  return { name: names[i], glyph: glyphs[i], illum };
}

/* ---------------- Sample week (fallback only) ---------------- */
const SAMPLE_WEEK = [
  { hi: 15, lo: 8, cloud: 70, wind: 11, gust: 20, dir: "SW", press: "falling", rain: 4 },
  { hi: 13, lo: 7, cloud: 85, wind: 18, gust: 32, dir: "W", press: "rising", rain: 9 },
  { hi: 12, lo: 5, cloud: 30, wind: 9, gust: 15, dir: "NW", press: "rising", rain: 0 },
  { hi: 13, lo: 4, cloud: 10, wind: 4, gust: 7, dir: "N", press: "steady-high", rain: 0 },
  { hi: 14, lo: 6, cloud: 40, wind: 7, gust: 12, dir: "S", press: "steady", rain: 0 },
  { hi: 15, lo: 9, cloud: 80, wind: 12, gust: 22, dir: "SW", press: "falling", rain: 2 },
  { hi: 14, lo: 10, cloud: 90, wind: 15, gust: 26, dir: "SW", press: "falling", rain: 6 },
].map((d, i) => ({ ...d, date: addDays(TODAY, i) }));

/* ============================================================
   LIVE DATA — Open-Meteo hourly
   ============================================================ */
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const degToDir = (deg) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms))]);

async function fetchLive(v) {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${v.lat}&longitude=${v.lon}&hourly=temperature_2m,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation&wind_speed_unit=mph&timezone=Europe%2FLondon&past_days=1&forecast_days=7`;
  const res = await withTimeout(fetch(u), 10000, "Open-Meteo");
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const j = await res.json();
  const H = j.hourly;
  if (!H || !H.time || H.time.length < 48) throw new Error("No hourly data returned");
  const nDays = Math.floor(H.time.length / 24);
  const days = [];
  for (let d = 0; d < nDays; d++) {
    const sl = (k) => H[k].slice(d * 24, d * 24 + 24).map((x) => (x == null ? 0 : x));
    const temp = sl("temperature_2m"), cloud = sl("cloud_cover"), press = sl("pressure_msl"), wind = sl("wind_speed_10m"), gust = sl("wind_gusts_10m"), wdir = sl("wind_direction_10m"), rain = sl("precipitation");
    const day = (arr) => arr.slice(6, 20);
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    let sx = 0, sy = 0; day(wdir).forEach((deg) => { sx += Math.cos((deg * Math.PI) / 180); sy += Math.sin((deg * Math.PI) / 180); });
    const domDeg = (Math.atan2(sy, sx) * 180) / Math.PI;
    days.push({
      hi: Math.round(Math.max(...temp)), lo: Math.round(Math.min(...temp)), cloud: Math.round(mean(day(cloud))), wind: Math.round(mean(day(wind))),
      gust: Math.round(Math.max(...gust)), dir: degToDir(domDeg), rain: Math.round(rain.reduce((a, b) => a + b, 0) * 10) / 10,
      pMean: mean(press), hourly: { temp, cloud, wind, gust, rain, press, dir: wdir.map(degToDir) },
    });
  }
  const out = [];
  for (let d = 1; d < days.length && out.length < 7; d++) {
    const delta = days[d].pMean - days[d - 1].pMean;
    const press = delta <= -2.5 ? "falling" : delta >= 2.5 ? "rising" : days[d].pMean >= 1021 ? "steady-high" : "steady";
    out.push({ ...days[d], press, pDelta: Math.round(delta * 10) / 10, date: addDays(TODAY, out.length) });
  }
  if (out.length < 5) throw new Error("Too few forecast days returned");
  return { week: out, source: "Open-Meteo", at: new Date() };
}

/* ============================================================
   SCORING ENGINE
   ============================================================ */
const WATER_BASE = [4, 4, 6, 9, 13, 17, 20, 20, 17, 13, 9, 6];
function estimateWater(day, prev, profile) {
  const memory = prev.length ? prev.reduce((a, p) => a + (p.hi + p.lo) / 2, 0) / prev.length : (day.hi + day.lo) / 2;
  const air = 0.65 * memory + 0.35 * day.hi;
  const base = WATER_BASE[day.date.getMonth()];
  let w = 0.5 * base + 0.5 * air;
  if (profile.spring) w += (10.5 - w) * 0.35;
  if (profile.depth === "deep") w += (base - w) * 0.3;
  if (profile.depth === "shallow") w += (air - w) * 0.3;
  return Math.round(w * 10) / 10;
}
function scoreDay(day, prev, profile = {}) {
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
  else if (day.press === "steady-high") { s -= 1; R.push({ bad: true, t: "Static high pressure — the lockjaw pattern" }); }
  else if (day.press === "rising") { s -= 0.5; R.push({ bad: true, t: "Pressure rebuilding after the front — fish often sulk" }); }
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
  s = Math.max(0, Math.min(10, Math.round(s * 10) / 10));
  const colorKey = keyOf(s);
  const verdict = { go: "Go fishing", fair: "Worth a cast", poor: "Stay home" }[colorKey];
  const tip = colorKey === "go" ? (day.cloud >= 60 ? "Fishable all day — stay out until the light goes." : "Make the most of it — a steady slow retrieve will do the work.")
    : colorKey === "fair" ? (water >= 17 ? "Dawn raid — first light until the sun gets up." : water < 8 ? "Late start — fish the warmest hours, midday to three." : "Pick your window and fish it hard; expect a short spell.")
    : "Tie flies, book the better day — the fish aren't playing.";
  const good = R.filter((r) => !r.bad), bad = R.filter((r) => r.bad);
  return { score: s, verdict, colorKey, water, reasons: [...good.slice(0, 2), ...bad.slice(0, 2), ...good.slice(2, 3)].slice(0, 4), tip };
}
function scoreWeek(week, profile) {
  return week.map((day, i) => ({ ...day, label: DAYS[day.date.getDay()], result: scoreDay(day, week.slice(Math.max(0, i - 2), i), profile) }));
}

/* ---------------- Hourly fishing index ---------------- */
function hourlyIndex(day, sun) {
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
    return { h, score: Math.max(0, Math.min(10, Math.round((base + m) * 10) / 10)), night: false, cloud, wind, temp };
  });
}
function bestWindow(hours) {
  let best = { start: 0, avg: -1 };
  for (let i = 0; i < 22; i++) { const a = (hours[i].score + hours[i + 1].score + hours[i + 2].score) / 3; if (!hours[i].night && a > best.avg) best = { start: i, avg: a }; }
  return { start: best.start, end: best.start + 3, avg: Math.round(best.avg * 10) / 10 };
}

/* ---------------- Fly box & method ---------------- */
const OPPOSITE = { N: "south", NE: "south-west", E: "west", SE: "north-west", S: "north", SW: "north-east", W: "east", NW: "south-east" };
function flyBox(day) {
  const m = day.date.getMonth(), w = day.result.water, bright = day.cloud < 35, ripple = day.wind >= 5 && day.wind <= 15;
  let flies;
  if (m <= 1 || m === 11) flies = ["Cat's Whisker", "Orange Blob", "Booby (black)", "Slow buzzer (black, 12)", "Bloodworm"];
  else if (m <= 3) flies = ["Black buzzer (12–14)", "Bloodworm", "Diawl Bach", "Cat's Whisker", "Black Tadpole"];
  else if (m <= 5) flies = ["Olive buzzer (12)", "CDC Shuttlecock", "Damsel nymph", "Hopper (claret)", "Cruncher"];
  else if (m <= 7) flies = ["Deep buzzer (olive)", "Hopper (black/claret)", "Sedge (dry, dusk)", "Damsel nymph", "Booby early"];
  else if (m <= 9) flies = ["Floating Fry", "Minkie", "Daddy Longlegs", "Corixa", "Hopper (brown)"];
  else flies = ["Minkie / Zonker", "Humungus", "Black buzzer (12)", "Daddy (while they last)", "Orange Blob"];
  const notes = [];
  if (bright && !ripple) notes.push("Bright & calm: go a size smaller, naturals over lures, 15ft+ leader.");
  if (ripple && day.cloud >= 50) notes.push("Cloud & ripple: washing-line of buzzers under a booby or dry.");
  if (day.wind > 15) notes.push("Fresh wind: heavier flies, a weighted point fly, shorter leader.");
  if (w >= 18) notes.push("Warm water: get down early with a DI-3 or booby on a short leader.");
  if (w < 8) notes.push("Cold water: slow everything — static booby, long pauses, bright lures.");
  return { flies, notes };
}
function method(day) {
  const w = day.result.water, bright = day.cloud < 35;
  if (w >= 18) return { line: "DI-3 / fast glass", leader: "6–9ft fluoro", retrieve: "Slow figure-of-eight, hang at the end", depth: "8–15ft+" };
  if (w < 8) return { line: "DI-3 or DI-5", leader: "4–6ft", retrieve: "Static booby, or dead slow with long pauses", depth: "Bottom foot" };
  if (bright && day.wind < 5) return { line: "Floating / slow glass", leader: "15–18ft fluoro", retrieve: "Barely moving, let it swing", depth: "3–6ft" };
  if (day.cloud >= 60) return { line: "Floating", leader: "12–15ft, 3 flies", retrieve: "Washing line, drift with the wind", depth: "1–4ft" };
  return { line: "Intermediate", leader: "10–12ft", retrieve: "Steady pulls, vary the pace", depth: "3–8ft" };
}

/* ---------------- Distance & status ---------------- */
const DEFAULT_HOME = { label: "Epping / NE London", lat: 51.66, lon: 0.08 };
const TOWNS = [DEFAULT_HOME, { label: "Central London", lat: 51.507, lon: -0.128 }, { label: "Romford", lat: 51.575, lon: 0.18 }, { label: "Croydon", lat: 51.376, lon: -0.098 }, { label: "Watford", lat: 51.656, lon: -0.39 }, { label: "Chelmsford", lat: 51.736, lon: 0.469 }, { label: "St Albans", lat: 51.755, lon: -0.336 }, { label: "Guildford", lat: 51.236, lon: -0.57 }, { label: "Sevenoaks", lat: 51.272, lon: 0.19 }, { label: "Tunbridge Wells", lat: 51.132, lon: 0.263 }, { label: "Reading", lat: 51.454, lon: -0.978 }, { label: "Milton Keynes", lat: 52.04, lon: -0.76 }];
function milesFrom(v, h) {
  const R = 3959, r = (x) => (x * Math.PI) / 180;
  const a = Math.sin(r(v.lat - h.lat) / 2) ** 2 + Math.cos(r(h.lat)) * Math.cos(r(v.lat)) * Math.sin(r(v.lon - h.lon) / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
function venueStatus(v, date) {
  if (v.season) { const m = date.getMonth() + 1; if (m < v.season[0] || m > v.season[1]) return "Closed for season"; }
  if (v.closed && v.closed.includes(DAYS[date.getDay()])) return `Closed ${DAYS[date.getDay()]}s`;
  return null;
}

/* ---------------- Local persistence ---------------- */
const LS = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
};

/* ================= UI atoms ================= */
const panel = { background: C.panel, borderRadius: 18, border: `1px solid ${C.line}` };
const Label = ({ children, color }) => <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: color || C.muted, textTransform: "uppercase", letterSpacing: "0.14em" }}>{children}</div>;
const Chip = ({ on, onClick, children, tone, disabled }) => (
  <button disabled={disabled} onClick={onClick} style={{ border: `1px solid ${on ? "transparent" : C.line2}`, cursor: disabled ? "default" : "pointer", borderRadius: 999, padding: "8px 13px", fontFamily: F.body, fontWeight: 600, fontSize: 13, background: on ? (tone || C.text) : "transparent", color: on ? C.bg : C.text, whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1 }}>{children}</button>
);
const SourceTag = ({ live }) => (
  <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: live ? C.cyan : C.dim, background: live ? C.cyanBg : "rgba(255,255,255,0.05)", borderRadius: 999, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 5 }}>
    {live && <span style={{ width: 6, height: 6, borderRadius: 999, background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />}{live ? "LIVE" : "SAMPLE"}
  </span>
);

function ScoreRing({ score, colorKey, size = 96 }) {
  const r = (size - 12) / 2, circ = 2 * Math.PI * r, fg = COL(colorKey);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fg} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 10) * circ} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ filter: `drop-shadow(0 0 6px ${fg})` }} />
      <text x="50%" y="50%" dy="0.12em" textAnchor="middle" fontFamily={F.mono} fontWeight="700" fontSize={size * 0.32} fill={C.text}>{score}</text>
      <text x="50%" y="50%" dy="1.7em" textAnchor="middle" fontFamily={F.mono} fontSize={size * 0.1} fill={C.muted}>/10</text>
    </svg>
  );
}

function DayStrip({ week, activeIdx, onPick }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {week.map((d, i) => {
        const active = i === activeIdx, st = d.status;
        return (
          <button key={i} onClick={() => onPick(i)} style={{ flex: 1, minWidth: 0, border: `1px solid ${active ? C.cyan : C.line}`, cursor: "pointer", background: active ? C.panel2 : "transparent", borderRadius: 12, padding: "8px 0 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: st ? 0.45 : 1 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: active ? C.cyan : C.muted }}>{i === 0 ? "TODAY" : d.label.toUpperCase()}</span>
            <span style={{ width: 26, height: 26, borderRadius: 999, background: st ? C.dim : COL(d.result.colorKey), color: C.bg, fontFamily: F.mono, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{st ? "✕" : Math.round(d.result.score)}</span>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>{d.hi}°</span>
          </button>
        );
      })}
    </div>
  );
}

function Sparkline({ week, activeIdx, onPick }) {
  const W = 400, H = 54, pad = 16, step = (W - pad * 2) / (week.length - 1);
  const pts = week.map((d, i) => [pad + i * step, H - 8 - (d.result.score / 10) * (H - 16)]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 54, display: "block" }}>
      <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={C.cyan} stopOpacity="0.3" /><stop offset="1" stopColor={C.cyan} stopOpacity="0" /></linearGradient></defs>
      <path d={`${path} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`} fill="url(#sg)" />
      <path d={path} fill="none" stroke={C.cyan} strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === activeIdx ? 6 : 3.5} fill={COL(week[i].result.colorKey)} stroke={C.panel} strokeWidth="2" style={{ cursor: "pointer" }} onClick={() => onPick(i)} />)}
    </svg>
  );
}

function HourlyChart({ hours, win, sun }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 72 }}>
        {hours.map((x) => {
          const inWin = x.h >= win.start && x.h < win.end;
          return <div key={x.h} title={`${x.h}:00 — ${x.night ? "dark" : x.score}`} style={{ flex: 1, height: x.night ? 4 : `${Math.max(6, x.score * 7)}px`, background: x.night ? "rgba(255,255,255,0.08)" : COL(keyOf(x.score)), opacity: x.night ? 1 : inWin ? 1 : 0.45, borderRadius: 3, boxShadow: inWin ? `0 0 8px ${COL(keyOf(x.score))}` : "none" }} />;
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: F.mono, fontSize: 9, color: C.dim }}>
        <span>00</span><span>☀ {hhmm(sun.rise)}</span><span>12</span><span>{hhmm(sun.set)} ☾</span><span>24</span>
      </div>
    </div>
  );
}

function Stat({ k, v, sub, accent }) {
  return (
    <div style={{ ...panel, padding: "10px 12px", flex: 1, minWidth: 0 }}>
      <Label>{k}</Label>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, color: accent || C.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ================= App ================= */
export default function App() {
  const [venueId, setVenueId] = useState(null);
  const [radius, setRadius] = useState(() => LS.get("tl-radius", 30));
  const [homeDayIdx, setHomeDayIdx] = useState(0);
  const [sortBy, setSortBy] = useState("score");
  const [kind, setKind] = useState("all");
  const [home, setHome] = useState(() => LS.get("tl-home", DEFAULT_HOME));
  const [pickingHome, setPickingHome] = useState(false);
  const [gpsErr, setGpsErr] = useState(false);
  const [feeds, setFeeds] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});
  const [bulk, setBulk] = useState(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("plan");
  const [log, setLog] = useState(() => LS.get("tl-log", []));
  const [logForm, setLogForm] = useState(null);

  useEffect(() => { LS.set("tl-radius", radius); }, [radius]);
  useEffect(() => { LS.set("tl-home", home); }, [home]);
  function saveLog(next) { setLog(next); LS.set("tl-log", next); }

  function useGps() {
    setGpsErr(false);
    if (!navigator.geolocation) { setGpsErr(true); return; }
    navigator.geolocation.getCurrentPosition((p) => { setHome({ label: "My location", lat: p.coords.latitude, lon: p.coords.longitude }); setPickingHome(false); }, () => setGpsErr(true), { timeout: 8000 });
  }

  async function loadVenue(v) {
    setLoading((p) => ({ ...p, [v.id]: true })); setErrors((p) => ({ ...p, [v.id]: null }));
    try { const f = await fetchLive(v); setFeeds((p) => ({ ...p, [v.id]: f })); }
    catch (e) { setErrors((p) => ({ ...p, [v.id]: e.message })); }
    finally { setLoading((p) => ({ ...p, [v.id]: false })); }
  }
  async function loadAll(list) {
    setBulk({ done: 0, total: list.length });
    let done = 0;
    for (let i = 0; i < list.length; i += 4) {
      await Promise.all(list.slice(i, i + 4).map(async (v) => { await loadVenue(v); done++; setBulk({ done, total: list.length }); }));
    }
    setTimeout(() => setBulk(null), 1200);
  }

  const ranked = useMemo(() => VENUES.map((v) => {
    const feed = feeds[v.id];
    const w = scoreWeek(feed ? feed.week : SAMPLE_WEEK, v.profile).map((d) => ({ ...d, status: venueStatus(v, d.date) }));
    const open = w.filter((d) => !d.status);
    const best = open.length ? open.reduce((b, d) => (d.result.score > b.result.score ? d : b), open[0]) : null;
    const sel = w[Math.min(homeDayIdx, w.length - 1)];
    return { v, dist: milesFrom(v, home), sel, best, live: !!feed };
  }).filter((x) => x.dist <= radius && (kind === "all" || x.v.kind === kind))
    .sort((a, b) => { if (sortBy === "distance") return a.dist - b.dist; const sa = a.sel.status ? -1 : a.sel.result.score, sb = b.sel.status ? -1 : b.sel.result.score; return sb - sa; }), [feeds, radius, homeDayIdx, home, sortBy, kind]);
  const liveCount = ranked.filter((x) => x.live).length;

  // Auto-load live feeds for the visible list on first open
  useEffect(() => { if (ranked.length && Object.keys(feeds).length === 0 && !bulk) loadAll(ranked.map((x) => x.v)); /* eslint-disable-next-line */ }, []);

  const venue = venueId ? VENUES.find((v) => v.id === venueId) : null;
  const feed = venue ? feeds[venueId] : null;
  const week = useMemo(() => venue ? scoreWeek(feed ? feed.week : SAMPLE_WEEK, venue.profile).map((d) => ({ ...d, status: venueStatus(venue, d.date) })) : [], [venue, feed]);
  const bestIdx = useMemo(() => { let b = -1; week.forEach((d, i) => { if (!d.status && (b < 0 || d.result.score > week[b].result.score)) b = i; }); return b < 0 ? 0 : b; }, [week]);
  const day = week[Math.min(dayIdx, Math.max(0, week.length - 1))];
  const sun = useMemo(() => (venue && day ? sunTimes(day.date, venue.lat, venue.lon) : null), [venue, day]);
  const moon = useMemo(() => (day ? moonPhase(day.date) : null), [day]);
  const hours = useMemo(() => (day && sun ? hourlyIndex(day, sun) : []), [day, sun]);
  const win = hours.length ? bestWindow(hours) : null;
  const box = day ? flyBox(day) : null;
  const meth = day ? method(day) : null;
  const venueLog = venue ? log.filter((l) => l.venueId === venueId) : [];

  async function shareVerdict() {
    const text = `${venue.name} — ${dateStr(day.date)}: ${day.result.score}/10, ${day.result.verdict}. Best window ${String(win.start).padStart(2, "0")}:00–${String(win.end).padStart(2, "0")}:00. Water ~${Math.round(day.result.water)}°C, ${day.dir} ${day.wind} mph, ${day.cloud}% cloud. "${day.result.tip}" — TightLines UK`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } } catch (e) { /* closed */ }
  }

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(1200px 500px at 50% -200px, #14303A 0%, ${C.bg} 60%)`, fontFamily: F.body, color: C.text }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 14px 40px" }}>

        <div style={{ padding: "20px 2px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}>TIGHT<span style={{ color: C.cyan }}>LINES</span></div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.muted }}>{dateStr(TODAY).toUpperCase()}</div>
        </div>

        {venue === null ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <button onClick={() => { setPickingHome(!pickingHome); setGpsErr(false); }} style={{ border: "none", cursor: "pointer", background: "transparent", padding: 0, fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.cyan }}>◎ {home.label} ▾</button>
              <div style={{ display: "flex", gap: 5 }}>{[15, 30, 60].map((r) => <Chip key={r} on={radius === r} onClick={() => setRadius(r)}>{r} mi</Chip>)}</div>
            </div>
            {pickingHome && (
              <div style={{ ...panel, padding: 12, marginBottom: 10 }}>
                <Label>Fishing from</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  <Chip on tone={C.cyan} onClick={useGps}>Use my GPS</Chip>
                  {TOWNS.map((t) => <Chip key={t.label} on={home.label === t.label} onClick={() => { setHome(t); setPickingHome(false); }}>{t.label}</Chip>)}
                </div>
                {gpsErr && <div style={{ marginTop: 8, fontSize: 12, color: C.fair }}>Couldn't get your location — pick the nearest town.</div>}
              </div>
            )}

            <div style={{ ...panel, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: `linear-gradient(135deg, ${C.panel2}, ${C.panel})` }}>
              <div style={{ minWidth: 0 }}>
                <Label color={liveCount ? C.cyan : C.muted}>{liveCount ? `● ${liveCount}/${ranked.length} waters live` : "○ Sample forecast"}</Label>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{bulk ? `Pulling hourly feeds… ${bulk.done}/${bulk.total}` : "Open-Meteo hourly · pressure, wind, cloud, rain"}</div>
              </div>
              <button onClick={() => loadAll(ranked.map((x) => x.v))} disabled={!!bulk} style={{ border: "none", cursor: "pointer", borderRadius: 999, background: C.cyan, color: C.bg, fontWeight: 700, fontSize: 13, padding: "10px 14px", opacity: bulk ? 0.6 : 1, flexShrink: 0 }}>{bulk ? "Loading…" : liveCount === ranked.length && ranked.length ? "Refresh" : "Go live — all"}</button>
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {SAMPLE_WEEK.map((d, i) => (
                <button key={i} onClick={() => setHomeDayIdx(i)} style={{ flex: 1, minWidth: 0, border: `1px solid ${homeDayIdx === i ? C.cyan : C.line}`, cursor: "pointer", borderRadius: 10, padding: "8px 0", fontFamily: F.mono, fontSize: 10, background: homeDayIdx === i ? C.panel2 : "transparent", color: homeDayIdx === i ? C.cyan : C.muted }}>
                  {i === 0 ? "TODAY" : DAYS[d.date.getDay()].toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
              <Chip on={sortBy === "score"} onClick={() => setSortBy("score")}>Best conditions</Chip>
              <Chip on={sortBy === "distance"} onClick={() => setSortBy("distance")}>Nearest</Chip>
              <Chip on={kind === "all"} onClick={() => setKind("all")}>All</Chip>
              <Chip on={kind === "small"} onClick={() => setKind("small")}>Small waters</Chip>
              <Chip on={kind === "reservoir"} onClick={() => setKind("reservoir")}>Reservoirs</Chip>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ranked.map(({ v, dist, sel, best, live }) => {
                const st = sel.status, err = errors[v.id];
                return (
                  <button key={v.id} onClick={() => { setVenueId(v.id); setDayIdx(homeDayIdx); setTab("plan"); window.scrollTo(0, 0); }} style={{ ...panel, cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, opacity: st ? 0.55 : 1, color: C.text }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                        {loading[v.id] ? <span style={{ fontFamily: F.mono, fontSize: 9, color: C.cyan }}>…</span> : live ? <SourceTag live /> : err ? <span style={{ fontFamily: F.mono, fontSize: 9, color: C.poor }}>FEED ERR</span> : null}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{dist} mi · {v.ticket} · {v.profile.spring ? "spring-fed" : v.profile.depth}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: st ? C.muted : COL(sel.result.colorKey), marginTop: 4 }}>
                        {st ? st : `${sel.result.verdict} · water ~${Math.round(sel.result.water)}°C`}{best && !st && best.result.score > sel.result.score ? ` · best ${best.label}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ background: st ? "rgba(255,255,255,0.05)" : BG(sel.result.colorKey), color: st ? C.muted : COL(sel.result.colorKey), borderRadius: 12, padding: "6px 12px", fontFamily: F.mono, fontWeight: 700, fontSize: 18 }}>{st ? "—" : sel.result.score}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>{sel.hi}° {PRESS[sel.press].glyph} {sel.dir}{sel.wind}</div>
                    </div>
                  </button>
                );
              })}
              {ranked.length === 0 && <div style={{ ...panel, padding: 20, textAlign: "center", color: C.muted, fontSize: 14 }}>Nothing within {radius} miles — widen the search.</div>}
            </div>

            {log.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <Label>Recent sessions</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {log.slice(0, 3).map((l) => <div key={l.id} style={{ ...panel, padding: "10px 12px", fontSize: 13 }}><b>{l.venueName}</b> · {l.date} · {l.fish} fish{l.best ? ` · best ${l.best}` : ""}{l.note ? <span style={{ color: C.muted }}> — {l.note}</span> : null}</div>)}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setVenueId(null)} style={{ border: "none", cursor: "pointer", background: "transparent", padding: "0 0 8px", fontFamily: F.body, fontWeight: 600, fontSize: 14, color: C.cyan }}>← All waters</button>

            <div style={{ ...panel, padding: 16, background: `linear-gradient(135deg, ${C.panel2}, ${C.panel})` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{venue.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{venue.where} · {milesFrom(venue, home)} mi · {venue.species}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "4px 9px", color: C.text }}>{venue.profile.note}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em", color: venue.profile.verified ? C.go : C.fair }}>{venue.profile.verified ? "VERIFIED" : "ESTIMATED"}</span>
                    <SourceTag live={!!feed} />
                  </div>
                </div>
                <button onClick={() => loadVenue(venue)} disabled={loading[venueId]} style={{ border: "none", cursor: "pointer", borderRadius: 999, background: feed ? "rgba(79,214,200,0.15)" : C.cyan, color: feed ? C.cyan : C.bg, fontWeight: 700, fontSize: 13, padding: "10px 14px", opacity: loading[venueId] ? 0.6 : 1, flexShrink: 0 }}>
                  {loading[venueId] ? "Fetching…" : feed ? "Refresh" : "Go live"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                {[["Fishery site", venue.website], ["Directions", `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + ", " + venue.where + ", UK")}`], venue.phone ? ["Call", `tel:${venue.phone.replace(/\s/g, "")}`] : null].filter(Boolean).map(([t, h]) => (
                  <a key={t} href={h} target={h.startsWith("tel") ? undefined : "_blank"} rel="noreferrer" style={{ flex: 1, textDecoration: "none", textAlign: "center", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 0", fontWeight: 600, fontSize: 13, color: C.text }}>{t}</a>
                ))}
              </div>
              {feed && <div style={{ fontFamily: F.mono, fontSize: 10, color: C.muted, marginTop: 10 }}>Updated {hhmm(feed.at)} · {feed.source} · hourly resolution</div>}
            </div>

            {errors[venueId] && <div style={{ background: C.poorBg, border: `1px solid ${C.poor}`, color: C.text, borderRadius: 12, padding: "10px 14px", fontSize: 12, marginTop: 10, fontFamily: F.mono, lineHeight: 1.5 }}>Live feed failed: {errors[venueId]}<br /><span style={{ color: C.muted }}>Showing sample data. Tap "Go live" to retry.</span></div>}

            <div style={{ marginTop: 10 }}><DayStrip week={week} activeIdx={Math.min(dayIdx, week.length - 1)} onPick={setDayIdx} /></div>
            <div style={{ ...panel, marginTop: 8, padding: "6px 4px 0" }}><Sparkline week={week} activeIdx={Math.min(dayIdx, week.length - 1)} onPick={setDayIdx} /></div>
            <button onClick={() => setDayIdx(bestIdx)} style={{ marginTop: 8, border: "none", cursor: "pointer", background: "transparent", padding: 0, fontSize: 13, color: C.cyan, fontWeight: 600 }}>▸ Best day: {dateStr(week[bestIdx].date)} ({week[bestIdx].result.score}/10)</button>

            <div style={{ display: "flex", gap: 5, margin: "12px 0 10px" }}>
              {[["plan", "Verdict"], ["flies", "Fly box"], ["log", `Log${venueLog.length ? ` (${venueLog.length})` : ""}`]].map(([k, t]) => <Chip key={k} on={tab === k} onClick={() => setTab(k)}>{t}</Chip>)}
            </div>

            {tab === "plan" && (
              <>
                {day.status && <div style={{ background: C.poorBg, border: `1px solid ${C.poor}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{day.status} — scores for reference only.</div>}
                <div style={{ ...panel, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <Label>{dateStr(day.date)}</Label>
                      <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: COL(day.result.colorKey), lineHeight: 1.05, marginTop: 4, letterSpacing: "-0.02em" }}>{day.result.verdict}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.7 }}>
                        {day.hi}° / {day.lo}° · {day.cloud}% CLD<br />{day.dir} {day.wind} MPH · G{day.gust} · {PRESS[day.press].glyph} {PRESS[day.press].label.toUpperCase()}{day.rain ? ` · ${day.rain}MM` : ""}
                      </div>
                    </div>
                    <ScoreRing score={day.result.score} colorKey={day.result.colorKey} />
                  </div>
                  <div style={{ marginTop: 14, padding: "12px 14px", background: C.cyanBg, borderRadius: 12, borderLeft: `3px solid ${C.cyan}` }}>
                    <div style={{ fontSize: 15, lineHeight: 1.45, fontStyle: "italic" }}>"{day.result.tip}"</div>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                    {day.result.reasons.map((x, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 6, width: 7, height: 7, borderRadius: 999, flexShrink: 0, background: x.bad ? C.poor : C.go, boxShadow: `0 0 6px ${x.bad ? C.poor : C.go}` }} />
                        <span style={{ fontSize: 14, color: C.text, lineHeight: 1.45 }}>{x.t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...panel, padding: 16, marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Label>24h fishing index{day.hourly ? "" : " · modelled"}</Label>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: C.cyan }}>BEST {String(win.start).padStart(2, "0")}:00–{String(win.end).padStart(2, "0")}:00 · {win.avg}</span>
                  </div>
                  <div style={{ marginTop: 12 }}><HourlyChart hours={hours} win={win} sun={sun} /></div>
                  {day.hourly && (
                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                      {[["06h", 6], ["12h", 12], ["18h", 18]].map(([l, h]) => (
                        <div key={l} style={{ fontFamily: F.mono, fontSize: 10, color: C.muted, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 8px" }}>
                          <span style={{ color: C.text }}>{l}</span> {Math.round(day.hourly.temp[h])}° · {Math.round(day.hourly.cloud[h])}% · {day.hourly.dir[h]}{Math.round(day.hourly.wind[h])}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <Stat k="Water est." v={`~${Math.round(day.result.water)}°C`} sub={day.result.water >= 10 && day.result.water < 18 ? "feeding band" : day.result.water >= 18 ? "warm" : "cold"} accent={day.result.water >= 10 && day.result.water < 18 ? C.go : C.fair} />
                  <Stat k="Sunrise" v={hhmm(sun.rise)} sub={`${sun.dayLen.toFixed(1)}h light`} />
                  <Stat k="Sunset" v={hhmm(sun.set)} sub="pack up by then" />
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <Stat k="Moon" v={`${moon.glyph} ${moon.illum}%`} sub={moon.name} />
                  <Stat k="Fish the" v={`${OPPOSITE[day.dir]} bank`} sub={`${day.dir} wind pushes food there`} accent={C.cyan} />
                </div>

                <div style={{ ...panel, padding: 16, marginTop: 10 }}>
                  <Label>Method</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginTop: 10 }}>
                    {[["Line", meth.line], ["Leader", meth.leader], ["Depth", meth.depth], ["Retrieve", meth.retrieve]].map(([k, v]) => (
                      <div key={k}><div style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>{k.toUpperCase()}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, lineHeight: 1.35 }}>{v}</div></div>
                    ))}
                  </div>
                </div>

                <button onClick={shareVerdict} style={{ marginTop: 10, width: "100%", border: "none", cursor: "pointer", background: C.cyan, color: C.bg, borderRadius: 14, padding: "14px 0", fontFamily: F.body, fontWeight: 700, fontSize: 14 }}>
                  {copied ? "Copied ✓" : "Share this verdict"}
                </button>
              </>
            )}

            {tab === "flies" && (
              <>
                <div style={{ ...panel, padding: 16 }}>
                  <Label>{MONTHS[day.date.getMonth()]} fly box</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {box.flies.map((f) => <span key={f} style={{ background: C.cyanBg, color: C.cyan, borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 600 }}>{f}</span>)}
                  </div>
                  {box.notes.length > 0 && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>{box.notes.map((n, i) => <div key={i} style={{ fontSize: 14, color: C.text, lineHeight: 1.45, paddingLeft: 12, borderLeft: `2px solid ${C.line2}` }}>{n}</div>)}</div>}
                </div>
                <div style={{ ...panel, padding: 16, marginTop: 10 }}>
                  <Label>Kit check · {day.label}</Label>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                    {[day.rain >= 3 ? "Waterproofs — rain forecast" : "Light layers", day.lo <= 5 ? "Gloves and a hat — cold start" : day.lo >= 15 ? "Sun cream and water" : "A warm layer for dawn/dusk", day.wind > 15 ? "Heavier rod or a 7-wt — it's blowing" : "Your usual 6/7-wt", day.cloud < 35 ? "Polarised glasses — spot fish, protect eyes" : "Glasses anyway — hooks fly", `${meth.line} line on the reel before you leave`].map((k, i) => <div key={i} style={{ display: "flex", gap: 8 }}><span style={{ color: C.cyan }}>☐</span>{k}</div>)}
                  </div>
                </div>
              </>
            )}

            {tab === "log" && (
              <>
                <div style={{ ...panel, padding: 16 }}>
                  {!logForm ? (
                    <button onClick={() => setLogForm({ fish: "", best: "", note: "", date: dateStr(day.date) })} style={{ width: "100%", border: "none", cursor: "pointer", background: C.cyan, color: C.bg, borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 14 }}>+ Log a session here</button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Label>New session · {logForm.date}</Label>
                      {[["fish", "Fish caught (number)"], ["best", "Best fish (e.g. 4lb rainbow)"], ["note", "Fly / notes"]].map(([k, ph]) => (
                        <input key={k} value={logForm[k]} onChange={(e) => setLogForm({ ...logForm, [k]: e.target.value })} placeholder={ph} style={{ border: `1px solid ${C.line2}`, background: "rgba(255,255,255,0.04)", color: C.text, borderRadius: 10, padding: "11px 12px", fontSize: 14, fontFamily: F.body, outline: "none" }} />
                      ))}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { saveLog([{ id: Date.now(), venueId, venueName: venue.name, date: logForm.date, fish: logForm.fish || "0", best: logForm.best, note: logForm.note, score: day.result.score }, ...log]); setLogForm(null); }} style={{ flex: 1, border: "none", cursor: "pointer", background: C.text, color: C.bg, borderRadius: 10, padding: "12px 0", fontWeight: 700 }}>Save</button>
                        <button onClick={() => setLogForm(null)} style={{ flex: 1, border: `1px solid ${C.line2}`, cursor: "pointer", background: "transparent", color: C.text, borderRadius: 10, padding: "12px 0", fontWeight: 600 }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {venueLog.map((l) => (
                    <div key={l.id} style={{ ...panel, padding: "11px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.45 }}><b>{l.date}</b> · {l.fish} fish{l.best ? ` · best ${l.best}` : ""}{l.note ? <><br /><span style={{ color: C.muted }}>{l.note}</span></> : null}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>app said {l.score}</span><button onClick={() => saveLog(log.filter((x) => x.id !== l.id))} style={{ border: "none", cursor: "pointer", background: "transparent", color: C.poor, fontSize: 16 }}>×</button></div>
                    </div>
                  ))}
                  {venueLog.length === 0 && !logForm && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 10 }}>No sessions logged here yet.</div>}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 20, textAlign: "center", fontFamily: F.mono, fontSize: 10, color: C.dim, lineHeight: 1.7 }}>
          FEED: OPEN-METEO HOURLY · UPDATED ON OPEN<br />SCORE: WATER MODEL · PRESSURE TREND · CLOUD · WIND · OVERNIGHT · RAIN · DEPTH · SPRING
        </div>
      </div>
    </div>
  );
}
