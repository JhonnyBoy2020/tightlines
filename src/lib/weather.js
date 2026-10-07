import { TODAY, addDays } from "./util.js";

/* ---------- Sample week (fallback only) ---------- */
export const SAMPLE_WEEK = [
  { hi: 15, lo: 8, cloud: 70, wind: 11, gust: 20, dir: "SW", press: "falling", rain: 4 },
  { hi: 13, lo: 7, cloud: 85, wind: 18, gust: 32, dir: "W", press: "rising", rain: 9 },
  { hi: 12, lo: 5, cloud: 30, wind: 9, gust: 15, dir: "NW", press: "rising", rain: 0 },
  { hi: 13, lo: 4, cloud: 10, wind: 4, gust: 7, dir: "N", press: "steady-high", rain: 0 },
  { hi: 14, lo: 6, cloud: 40, wind: 7, gust: 12, dir: "S", press: "steady", rain: 0 },
  { hi: 15, lo: 9, cloud: 80, wind: 12, gust: 22, dir: "SW", press: "falling", rain: 2 },
  { hi: 14, lo: 10, cloud: 90, wind: 15, gust: 26, dir: "SW", press: "falling", rain: 6 },
].map((d, i) => ({ ...d, date: addDays(TODAY, i) }));

export const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const degToDir = (deg) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/* WMO weather codes → short text + glyph */
export function wx(code) {
  if (code == null) return { t: "—", g: "·" };
  if (code === 0) return { t: "Clear", g: "☀" };
  if (code <= 2) return { t: "Partly cloudy", g: "⛅" };
  if (code === 3) return { t: "Overcast", g: "☁" };
  if (code <= 48) return { t: "Fog", g: "≋" };
  if (code <= 57) return { t: "Drizzle", g: "☂" };
  if (code <= 67) return { t: "Rain", g: "☔" };
  if (code <= 77) return { t: "Snow", g: "❄" };
  if (code <= 82) return { t: "Showers", g: "☔" };
  if (code <= 86) return { t: "Snow showers", g: "❄" };
  return { t: "Thunderstorm", g: "⚡" };
}

const HOURLY = [
  "temperature_2m", "apparent_temperature", "relative_humidity_2m", "dew_point_2m",
  "cloud_cover", "pressure_msl", "wind_speed_10m", "wind_gusts_10m", "wind_direction_10m",
  "precipitation", "precipitation_probability", "uv_index", "visibility", "weather_code",
];
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms))]);

/* Fill gaps: carry the last good value forward (never let pressure drop to 0) */
function clean(arr, fallback = 0) {
  let last = arr.find((x) => x != null);
  if (last == null) last = fallback;
  return arr.map((x) => (x == null ? last : (last = x)));
}

const londonHourKey = (d = new Date()) => d.toLocaleString("sv-SE", { timeZone: "Europe/London" }).slice(0, 13).replace(" ", "T");

function parse(j) {
  const H = j.hourly;
  if (!H || !H.time || H.time.length < 48) throw new Error("No hourly data returned");
  const S = {};
  HOURLY.forEach((k) => { S[k] = clean(H[k] || [], k === "pressure_msl" ? 1013 : 0); });
  const nowIdx = Math.max(0, H.time.findIndex((t) => t.slice(0, 13) === londonHourKey()));
  const nDays = Math.floor(H.time.length / 24);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const days = [];
  for (let d = 0; d < nDays; d++) {
    const sl = (k) => S[k].slice(d * 24, d * 24 + 24);
    const temp = sl("temperature_2m"), cloud = sl("cloud_cover"), press = sl("pressure_msl"), wind = sl("wind_speed_10m"), gust = sl("wind_gusts_10m"), wdir = sl("wind_direction_10m"), rain = sl("precipitation");
    const pop = sl("precipitation_probability"), hum = sl("relative_humidity_2m"), dew = sl("dew_point_2m"), uv = sl("uv_index"), vis = sl("visibility"), code = sl("weather_code"), feels = sl("apparent_temperature");
    const day = (arr) => arr.slice(6, 20);
    let sx = 0, sy = 0; day(wdir).forEach((deg) => { sx += Math.cos((deg * Math.PI) / 180); sy += Math.sin((deg * Math.PI) / 180); });
    const domDeg = ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360;
    // 3-hour pressure tendency for each hour (uses the previous day's hours where needed)
    const tend = Array.from({ length: 24 }, (_, h) => { const i = d * 24 + h; return i >= 3 ? Math.round((S.pressure_msl[i] - S.pressure_msl[i - 3]) * 10) / 10 : 0; });
    const daylightTend = tend.slice(6, 20);
    days.push({
      hi: Math.round(Math.max(...temp)), lo: Math.round(Math.min(...temp)), cloud: Math.round(mean(day(cloud))), wind: Math.round(mean(day(wind))),
      gust: Math.round(Math.max(...gust)), dir: degToDir(domDeg), dirDeg: Math.round(domDeg), rain: Math.round(rain.reduce((a, b) => a + b, 0) * 10) / 10,
      pMean: mean(press), pMin: Math.round(Math.min(...press)), pMax: Math.round(Math.max(...press)),
      pFastDrop: Math.min(...daylightTend), pFastRise: Math.max(...daylightTend),
      popMax: Math.round(Math.max(...day(pop))), uvMax: Math.round(Math.max(...uv) * 10) / 10, humidity: Math.round(mean(day(hum))),
      dew: Math.round(mean(day(dew))), visMin: Math.round(Math.min(...day(vis)) / 100) / 10,
      thunder: day(code).some((c) => c >= 95), fog: day(code).some((c) => c === 45 || c === 48),
      hourly: { temp, feels, cloud, wind, gust, rain, pop, hum, dew, uv, vis, code, press, tend, deg: wdir, dir: wdir.map(degToDir) },
    });
  }
  const out = [];
  for (let d = 1; d < days.length && out.length < 7; d++) {
    const delta = days[d].pMean - days[d - 1].pMean;
    const press = delta <= -2.5 ? "falling" : delta >= 2.5 ? "rising" : days[d].pMean >= 1021 ? "steady-high" : "steady";
    out.push({ ...days[d], press, pDelta: Math.round(delta * 10) / 10, date: addDays(TODAY, out.length) });
  }
  if (out.length < 5) throw new Error("Too few forecast days returned");
  const nowP = S.pressure_msl[nowIdx];
  const now = {
    idx: nowIdx, temp: S.temperature_2m[nowIdx], feels: S.apparent_temperature[nowIdx], press: nowP,
    t3: Math.round((nowP - S.pressure_msl[Math.max(0, nowIdx - 3)]) * 10) / 10,
    t24: Math.round((nowP - S.pressure_msl[Math.max(0, nowIdx - 24)]) * 10) / 10,
    hum: S.relative_humidity_2m[nowIdx], dew: S.dew_point_2m[nowIdx], wind: S.wind_speed_10m[nowIdx], gust: S.wind_gusts_10m[nowIdx],
    dir: degToDir(S.wind_direction_10m[nowIdx]), deg: S.wind_direction_10m[nowIdx], cloud: S.cloud_cover[nowIdx], uv: S.uv_index[nowIdx],
    vis: Math.round(S.visibility[nowIdx] / 100) / 10, pop: S.precipitation_probability[nowIdx], code: S.weather_code[nowIdx],
  };
  // Pressure series for charting: from 24h ago to +72h
  const series = H.time.map((t, i) => ({ t, p: S.pressure_msl[i] })).slice(Math.max(0, nowIdx - 24), nowIdx + 72);
  return { week: out, now, series, nowKey: H.time[nowIdx], source: "Open-Meteo", at: new Date() };
}

const url = (lats, lons) => `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=${HOURLY.join(",")}&wind_speed_unit=mph&timezone=Europe%2FLondon&past_days=1&forecast_days=7`;

export async function fetchLive(v) {
  const res = await withTimeout(fetch(url(v.lat, v.lon)), 12000, "Open-Meteo");
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return parse(await res.json());
}

/* Batch: one request for up to 10 waters. Returns { id: feed | Error } */
export async function fetchMany(list) {
  if (list.length === 1) { try { return { [list[0].id]: await fetchLive(list[0]) }; } catch (e) { return { [list[0].id]: e }; } }
  const res = await withTimeout(fetch(url(list.map((v) => v.lat).join(","), list.map((v) => v.lon).join(","))), 15000, "Open-Meteo");
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const j = await res.json();
  const arr = Array.isArray(j) ? j : [j];
  const out = {};
  list.forEach((v, i) => { try { out[v.id] = parse(arr[i]); } catch (e) { out[v.id] = e; } });
  return out;
}
