import React, { useState, useMemo, useEffect, useCallback } from "react";
import { C, F, COL, BG, PRESS, panel } from "./theme.js";
import { VENUES, TOWNS, DEFAULT_HOME } from "./data/venues.js";
import { TODAY, DAYS, MONTHS, hhmm, dateStr, pad2, milesFrom, venueStatus, LS, isIOS, isStandalone, directionsUrl } from "./lib/util.js";
import { SAMPLE_WEEK, fetchMany } from "./lib/weather.js";
import { sunTimes, moonPhase, solunar } from "./lib/astro.js";
import { scoreWeek, hourlyIndex, bestWindow, flyBox, method, OPPOSITE } from "./lib/score.js";
import { FLIES, MONTH_GUIDE } from "./data/guide.js";
import { Label, Chip, SourceTag, ScoreRing, DayStrip, Sparkline, HourlyChart, Stat, Btn } from "./components/ui.jsx";
import { WatersMap, VenueMap } from "./components/Maps.jsx";
import { NowCard, PressureChart, SolunarCard, HourlyTable } from "./components/Conditions.jsx";
import Guide, { MonthCard } from "./components/Guide.jsx";
import LogScreen, { LogForm, LogEntry } from "./components/Log.jsx";
import { LayoutDashboard, Map, MapPin, Waves, FileText, BookOpen, NotebookPen, Bell, Sun, Moon, ArrowRight, Cloud, Compass, Menu } from "lucide-react";
import Dashboard from "./components/Dashboard.jsx";
import Rivers from "./components/Rivers.jsx";
import Reports from "./components/Reports.jsx";
import CloudSettings from "./components/CloudSettings.jsx";
import useCloud from "./lib/useCloud.js";
import { closureFor } from "./data/reports.js";
import FieldBook from "./components/FieldBook.jsx";
import useFieldBook from "./lib/useFieldBook.js";
import "./field.css";

/* ============================================================
   POCKET GHILLIE — live stillwater trout conditions
   Data: Open-Meteo hourly feed (no key) → sample fallback
   ============================================================ */

function useWide(min = 980) {
  const q = `(min-width: ${min}px)`;
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => setWide(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, [q]);
  return wide;
}
function useOnline() {
  const [on, setOn] = useState(() => navigator.onLine);
  useEffect(() => { const a = () => setOn(true), b = () => setOn(false); window.addEventListener("online", a); window.addEventListener("offline", b); return () => { window.removeEventListener("online", a); window.removeEventListener("offline", b); }; }, []);
  return on;
}

const Logo = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Pocket Ghillie logo">
    <path d="M4 22c5-9 13-14 24-14" stroke={C.cyan} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M28 8v9a4 4 0 0 1-8 0" stroke={C.text} strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="6" cy="25" r="2.2" fill={C.cyan} />
  </svg>
);

const NAV = [["today", "Overview", LayoutDashboard], ["waters", "Explore waters", MapPin], ["field", "Plan & fish", Compass], ["map", "Water map", Map], ["rivers", "River levels", Waves], ["reports", "Fishery reports", FileText], ["guide", "Fly guide", BookOpen], ["log", "My journal", NotebookPen]];
const MOBILE_NAV = [["today", "Today", LayoutDashboard], ["waters", "Waters", MapPin], ["field", "Plan & fish", Compass], ["log", "Journal", NotebookPen], ["more", "More", Menu]];

function InstallHint({ onClose }) {
  return (
    <div style={{ ...panel, padding: "12px 14px", marginBottom: 10, display: "flex", gap: 10, alignItems: "flex-start", borderColor: "rgba(79,214,200,0.35)" }}>
      <Logo size={30} />
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.45 }}>
        <b>Put Pocket Ghillie on your iPhone</b><br />
        <span style={{ color: C.muted }}>Tap the Share button <span style={{ color: C.cyan }}>⬆</span> in Safari, then <b style={{ color: C.text }}>Add to Home Screen</b>. It opens full-screen like an app and works offline with your last forecast.</span>
      </div>
      <button aria-label="Dismiss" onClick={onClose} style={{ border: "none", background: "transparent", color: C.muted, fontSize: 18, cursor: "pointer" }}>×</button>
    </div>
  );
}

export default function App() {
  const wide = useWide();
  const online = useOnline();
  const [screen, setScreen] = useState("today");
  const [venueId, setVenueId] = useState(() => { const id = new URLSearchParams(window.location.search).get("water"); return VENUES.some(v => v.id === id) ? id : null; });
  const [theme, setTheme] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [radius, setRadius] = useState(() => LS.get("tl-radius", 30));
  const [homeDayIdx, setHomeDayIdx] = useState(0);
  const [sortBy, setSortBy] = useState("score");
  const [kind, setKind] = useState("all");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [search, setSearch] = useState("");
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
  const [logForm, setLogForm] = useState(false);
  const [favs, setFavs] = useState(() => LS.get("tl-favs", []));
  const [hint, setHint] = useState(() => isIOS() && !isStandalone() && !LS.get("tl-hint-off", false));

  useEffect(() => { LS.set("tl-radius", radius); }, [radius]);
  useEffect(() => { LS.set("tl-home", home); }, [home]);
  useEffect(() => { LS.set("tl-favs", favs); }, [favs]);
  function applyLog(next) { setLog(next); LS.set("tl-log", next); }
  const cloud = useCloud(log, applyLog);
  const fieldBook = useFieldBook(cloud.key);
  function saveLog(next) {
    log.filter(l => !next.some(n => String(n.id) === String(l.id))).forEach(l => cloud.markDeleted(l.id));
    applyLog(next);
  }
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  function useGps() {
    setGpsErr(false);
    if (!navigator.geolocation) { setGpsErr(true); return; }
    navigator.geolocation.getCurrentPosition((p) => { setHome({ label: "My location", lat: p.coords.latitude, lon: p.coords.longitude }); setPickingHome(false); }, () => setGpsErr(true), { timeout: 8000 });
  }

  const applyResults = (res) => {
    const ok = {}, bad = {};
    Object.entries(res).forEach(([id, r]) => { if (r instanceof Error) bad[id] = r.message; else ok[id] = r; });
    setFeeds((p) => ({ ...p, ...ok }));
    setErrors((p) => { const n = { ...p }; Object.keys(ok).forEach((id) => { n[id] = null; }); return { ...n, ...bad }; });
  };
  async function loadVenue(v) {
    setLoading((p) => ({ ...p, [v.id]: true }));
    try { applyResults(await fetchMany([v])); }
    finally { setLoading((p) => ({ ...p, [v.id]: false })); }
  }
  const loadAll = useCallback(async (list) => {
    if (!list.length) return;
    setBulk({ done: 0, total: list.length });
    let done = 0;
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      setLoading((p) => ({ ...p, ...Object.fromEntries(chunk.map((v) => [v.id, true])) }));
      try { applyResults(await fetchMany(chunk)); }
      catch (e) { // batch failed — fall back one by one
        for (const v of chunk) { try { applyResults(await fetchMany([v])); } catch (e2) { setErrors((p) => ({ ...p, [v.id]: e2.message })); } }
      }
      setLoading((p) => ({ ...p, ...Object.fromEntries(chunk.map((v) => [v.id, false])) }));
      done += chunk.length; setBulk({ done, total: list.length });
    }
    setTimeout(() => setBulk(null), 1200);
  }, []);

  /* Every venue scored for the chosen day (map needs all; list filters by radius) */
  const all = useMemo(() => VENUES.map((v) => {
    const feed = feeds[v.id];
    const w = scoreWeek(feed ? feed.week : SAMPLE_WEEK, v.profile).map((d) => ({ ...d, status: closureFor(v.id) ? "Operator closure notice · confirm reopening" : venueStatus(v, d.date) }));
    const open = w.filter((d) => !d.status);
    const best = open.length ? open.reduce((b, d) => (d.result.score > b.result.score ? d : b), open[0]) : null;
    const sel = w[Math.min(homeDayIdx, w.length - 1)];
    return { v, dist: milesFrom(v, home), sel, best, live: !!feed && !feed.stale };
  }), [feeds, homeDayIdx, home]);

  const ranked = useMemo(() => all
    .filter((x) => x.dist <= radius && (kind === "all" || x.v.kind === kind) && (!onlyFavs || favs.includes(x.v.id)) && (!search || (x.v.name + " " + x.v.where).toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      const fa = favs.includes(a.v.id) ? 1 : 0, fb = favs.includes(b.v.id) ? 1 : 0;
      if (fa !== fb && sortBy === "score" && !onlyFavs) return fb - fa;
      if (sortBy === "distance") return a.dist - b.dist;
      const sa = a.sel.status ? -1 : a.sel.result.score, sb = b.sel.status ? -1 : b.sel.result.score; return sb - sa;
    }), [all, radius, kind, sortBy, favs, onlyFavs, search]);
  const inRadius = useMemo(() => all.filter((x) => x.dist <= radius), [all, radius]);
  const liveCount = inRadius.filter((x) => x.live).length;

  // Auto-load any waters in range that don't have a live feed yet (first open and when the radius grows)
  const loadScope = screen === "map" || screen === "field" || wide ? all : inRadius; // planner radius can extend beyond the overview
  const missingKey = loadScope.filter((x) => !feeds[x.v.id] && !loading[x.v.id] && !errors[x.v.id]).map((x) => x.v.id).join(",");
  useEffect(() => {
    if (!missingKey || bulk) return;
    const t = setTimeout(() => loadAll(VENUES.filter((v) => missingKey.split(",").includes(v.id))), 150);
    return () => clearTimeout(t);
  }, [missingKey, bulk, loadAll]);

  const venue = venueId ? VENUES.find((v) => v.id === venueId) : null;
  const feed = venue ? feeds[venueId] : null;
  const week = useMemo(() => venue ? scoreWeek(feed ? feed.week : SAMPLE_WEEK, venue.profile).map((d) => ({ ...d, status: closureFor(venue.id) ? "Operator closure notice · confirm reopening" : venueStatus(venue, d.date) })) : [], [venue, feed]);
  const bestIdx = useMemo(() => { let b = -1; week.forEach((d, i) => { if (!d.status && (b < 0 || d.result.score > week[b].result.score)) b = i; }); return b < 0 ? 0 : b; }, [week]);
  const day = week[Math.min(dayIdx, Math.max(0, week.length - 1))];
  const sun = useMemo(() => (venue && day ? sunTimes(day.date, venue.lat, venue.lon) : null), [venue, day]);
  const moon = useMemo(() => (day ? moonPhase(day.date) : null), [day]);
  const sol = useMemo(() => (venue && day && sun ? solunar(day.date, venue.lat, venue.lon, sun) : null), [venue, day, sun]);
  const hours = useMemo(() => (day && sun ? hourlyIndex(day, sun, sol) : []), [day, sun, sol]);
  const win = hours.length ? bestWindow(hours) : null;
  const box = day ? flyBox(day) : null;
  const meth = day ? method(day) : null;
  const venueLog = venue ? log.filter((l) => l.venueId === venueId) : [];

  function openVenue(id) { setVenueId(id); setDayIdx(homeDayIdx); setTab("plan"); setLogForm(false); window.scrollTo(0, 0); }
  function go(s) { setScreen(s); setVenueId(null); window.scrollTo(0, 0); }

  async function shareVerdict() {
    const text = `${venue.name} — ${dateStr(day.date)}: ${day.result.score}/10, ${day.result.verdict}. Best window ${pad2(win.start)}:00–${pad2(win.end)}:00. Water ~${Math.round(day.result.water)}°C, ${day.dir} ${day.wind} mph, ${day.cloud}% cloud${day.pMean ? `, ${Math.round(day.pMean)} hPa ${PRESS[day.press].label}` : ""}. "${day.result.tip}" — Pocket Ghillie`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } } catch (e) { /* closed */ }
  }

  /* ---------------- Pieces ---------------- */
  const homeBar = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
        <button onClick={() => { setPickingHome(!pickingHome); setGpsErr(false); }} style={{ border: "none", cursor: "pointer", background: "transparent", padding: 0, fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.cyan, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>◎ {home.label} ▾</button>
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
    </>
  );

  const liveBar = (
    <div style={{ ...panel, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: `linear-gradient(135deg, ${C.panel2}, ${C.panel})` }}>
      <div style={{ minWidth: 0 }}>
        <Label color={liveCount ? C.cyan : C.muted}>{!online ? "Offline · data may be stale" : liveCount ? `${liveCount}/${inRadius.length} forecasts loaded` : "Waiting for forecasts"}</Label>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{!online ? "Showing your last saved forecast — reconnect to refresh" : bulk ? `Pulling hourly feeds… ${bulk.done}/${bulk.total}` : "Open-Meteo hourly · pressure, wind, cloud, rain"}</div>
      </div>
      <button onClick={() => { setErrors({}); loadAll(inRadius.map((x) => x.v)); }} disabled={!!bulk} style={{ border: "none", cursor: "pointer", borderRadius: 999, background: C.cyan, color: C.bg, fontWeight: 700, fontSize: 13, padding: "10px 14px", opacity: bulk ? 0.6 : 1, flexShrink: 0 }}>{bulk ? "Loading…" : liveCount === inRadius.length && inRadius.length ? "Refresh" : "Go live — all"}</button>
    </div>
  );

  const dayPicker = (
    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
      {SAMPLE_WEEK.map((d, i) => (
        <button key={i} onClick={() => setHomeDayIdx(i)} style={{ flex: 1, minWidth: 0, border: `1px solid ${homeDayIdx === i ? C.cyan : C.line}`, cursor: "pointer", borderRadius: 10, padding: "8px 0", fontFamily: F.mono, fontSize: 10, background: homeDayIdx === i ? C.panel2 : "transparent", color: homeDayIdx === i ? C.cyan : C.muted }}>
          {i === 0 ? "TODAY" : DAYS[d.date.getDay()].toUpperCase()}
        </button>
      ))}
    </div>
  );

  const filters = (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search waters or towns…" aria-label="Search waters" style={{ width: "100%", border: `1px solid ${C.line2}`, background: "rgba(255,255,255,0.04)", color: C.text, borderRadius: 12, padding: "10px 12px", fontSize: 16, outline: "none", marginBottom: 8 }} />
      <div className="noscroll" style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
        <Chip on={sortBy === "score"} onClick={() => setSortBy("score")}>Best conditions</Chip>
        <Chip on={sortBy === "distance"} onClick={() => setSortBy("distance")}>Nearest</Chip>
        <Chip on={onlyFavs} tone={C.fair} onClick={() => setOnlyFavs(!onlyFavs)}>★ Favourites</Chip>
        <Chip on={kind === "all"} onClick={() => setKind("all")}>All</Chip>
        <Chip on={kind === "small"} onClick={() => setKind("small")}>Small waters</Chip>
        <Chip on={kind === "reservoir"} onClick={() => setKind("reservoir")}>Reservoirs</Chip>
      </div>
    </>
  );

  const list = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {ranked.map(({ v, dist, sel, best, live }) => {
        const st = sel.status, err = errors[v.id], fav = favs.includes(v.id);
        return (
          <button className="water-row" key={v.id} onClick={() => openVenue(v.id)} style={{ ...panel, cursor: "pointer", textAlign: "left", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, color: C.text, borderColor: venueId === v.id ? C.cyan : C.line }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {fav && <span style={{ color: C.fair, fontSize: 13 }}>★</span>}
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                {loading[v.id] ? <span style={{ fontFamily: F.mono, fontSize: 9, color: C.cyan }}>…</span> : live ? <SourceTag live /> : err ? <span style={{ fontFamily: F.mono, fontSize: 9, color: C.poor }}>FEED ERR</span> : null}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{dist} mi · {v.ticket} · {v.profile.spring ? "spring-fed" : v.profile.depth}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: st ? C.muted : COL(sel.result.colorKey), marginTop: 4 }}>
                {st ? st : live ? `${sel.result.verdict} · water estimate ~${Math.round(sel.result.water)}°C` : "No current forecast"}{live && best && !st && best.result.score > sel.result.score ? ` · best ${best.label}` : ""}{live && sel.thunder ? " · Thunder forecast" : ""}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ background: st ? "rgba(255,255,255,0.05)" : BG(sel.result.colorKey), color: st ? C.muted : COL(sel.result.colorKey), borderRadius: 12, padding: "6px 12px", fontFamily: F.mono, fontWeight: 700, fontSize: 18 }}>{st || !live ? "—" : sel.result.score}</div>
              {live && <div style={{ fontFamily: F.mono, fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{sel.pMean ? `${Math.round(sel.pMean)} hPa` : `${sel.hi}°`} {PRESS[sel.press].glyph}</div>}
            </div>
          </button>
        );
      })}
      {ranked.length === 0 && <div style={{ ...panel, padding: 20, textAlign: "center", color: C.muted, fontSize: 14 }}>{onlyFavs ? "No favourites in range yet — tap ☆ on a water to add it." : search ? "No waters match that search." : `Nothing within ${radius} miles — widen the search.`}</div>}
    </div>
  );

  const monthTeaser = (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <Label>This month on the water</Label>
        <button onClick={() => go("guide")} style={{ border: "none", background: "transparent", color: C.cyan, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Full guide →</button>
      </div>
      <MonthCard g={MONTH_GUIDE[TODAY.getMonth()]} compact />
    </div>
  );

  const recent = log.length > 0 && (
    <div style={{ marginTop: 18 }}>
      <Label>Recent sessions</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        {log.slice(0, 3).map((l) => <div key={l.id} style={{ ...panel, padding: "10px 12px", fontSize: 13 }}><b>{l.venueName}</b> · {l.date} · {l.fish} fish{l.best ? ` · best ${l.best}` : ""}{l.fly ? ` · ${l.fly}` : ""}{l.note ? <span style={{ color: C.muted }}> — {l.note}</span> : null}</div>)}
      </div>
    </div>
  );

  /* ---------------- Venue detail ---------------- */
  const venueHeader = venue && (
    <div style={{ ...panel, padding: 16, background: `linear-gradient(135deg, ${C.panel2}, ${C.panel})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{venue.name}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{venue.where} · {milesFrom(venue, home)} mi · {venue.species}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "4px 9px", color: C.text }}>{venue.profile.note}</span>
            <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em", color: C.muted }}>CATALOGUE PROFILE · CHECK LOCALLY</span>
            <SourceTag live={!!feed} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
          <button onClick={() => loadVenue(venue)} disabled={loading[venueId]} style={{ border: "none", cursor: "pointer", borderRadius: 999, background: feed ? "rgba(79,214,200,0.15)" : C.cyan, color: feed ? C.cyan : C.bg, fontWeight: 700, fontSize: 13, padding: "10px 14px", opacity: loading[venueId] ? 0.6 : 1 }}>
            {loading[venueId] ? "Fetching…" : feed ? "Refresh" : "Go live"}
          </button>
          <button aria-label={favs.includes(venueId) ? "Remove favourite" : "Add favourite"} onClick={() => toggleFav(venueId)} style={{ border: `1px solid ${C.line2}`, cursor: "pointer", borderRadius: 999, background: "transparent", color: favs.includes(venueId) ? C.fair : C.muted, fontSize: 13, fontWeight: 600, padding: "7px 12px" }}>{favs.includes(venueId) ? "★ Saved" : "☆ Save"}</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {[["Fishery site", venue.website], ["Directions", directionsUrl(venue)], venue.phone ? ["Call", `tel:${venue.phone.replace(/\s/g, "")}`] : null].filter(Boolean).map(([t, h]) => (
          <Btn key={t} href={h} style={{ flex: 1, padding: "10px 0" }}>{t}</Btn>
        ))}
      </div>
      {feed && <div style={{ fontFamily: F.mono, fontSize: 10, color: C.muted, marginTop: 10 }}>Updated {hhmm(feed.at)} · {feed.source} · hourly resolution</div>}
    </div>
  );

  const venueMapBlock = venue && (
    <div>
      <VenueMap venue={venue} windDeg={day?.dirDeg ?? null} height={wide ? 300 : 200} />
      <div style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>Satellite view · the pin is approximate, so use Directions for the entrance. Switch layers top-right.</div>
    </div>
  );

  const weatherBlock = day && (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {dayIdx === 0 && feed?.now && <NowCard now={feed.now} />}
      {feed?.series && (
        <div style={{ ...panel, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Label>Barometer · 4 days</Label>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: C.cyan }}>{Math.round(feed.now.press)} hPa {feed.now.t3 <= -0.5 ? "↘" : feed.now.t3 >= 0.5 ? "↗" : "→"}</span>
          </div>
          <div style={{ marginTop: 10 }}><PressureChart series={feed.series} /></div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>Pressure is weather context, not a dependable bite predictor. The 1021 hPa reference is a model convention, not a biological threshold. Compare the pattern with your own catches.</div>
        </div>
      )}
      {!wide && <SolunarCard sol={sol} moon={moon} />}
      <HourlyTable day={day} />
      {!feed && <div style={{ ...panel, padding: 16, fontSize: 13, color: C.muted }}>Live pressure, humidity, UV and hour-by-hour detail appear once the live feed loads.</div>}
    </div>
  );

  const planBlock = day && (
    <>
      {day.status && <div style={{ background: C.poorBg, border: `1px solid ${C.poor}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{day.status} — scores for reference only.</div>}
      {day.thunder && <div style={{ background: C.fairBg, border: `1px solid ${C.fair}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⚡ Thunderstorms forecast. Carbon rods conduct lightning — if you hear thunder, rods down and off the bank.</div>}
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
          <div style={{ fontSize: 15, lineHeight: 1.45 }}>"{day.result.tip}"</div>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <Label>24h fishing index{day.hourly ? "" : " · modelled"}</Label>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: C.cyan, whiteSpace: "nowrap" }}>BEST {pad2(win.start)}:00–{pad2(win.end)}:00 · {win.avg}</span>
        </div>
        <div style={{ marginTop: 12 }}><HourlyChart hours={hours} win={win} sun={sun} /></div>
        <div style={{ fontSize: 10, color: C.dim, marginTop: 6, fontFamily: F.mono }}><span style={{ color: C.fair }}>▬</span> SOLUNAR MAJOR · <span style={{ color: "rgba(242,181,68,0.6)" }}>▬</span> MINOR</div>
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
        <Stat k="Barometer" v={day.pMean ? `${Math.round(day.pMean)}` : PRESS[day.press].glyph} sub={day.pMean ? `hPa · ${PRESS[day.press].label}` : PRESS[day.press].label} accent={day.press === "falling" ? C.go : day.press === "steady-high" ? C.fair : C.text} />
        <Stat k="Rain chance" v={day.popMax != null ? `${day.popMax}%` : `${day.rain}mm`} sub={day.popMax != null ? `${day.rain} mm total` : "total"} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <Stat k="Sunrise" v={hhmm(sun.rise)} sub={`${sun.dayLen.toFixed(1)}h light`} />
        <Stat k="Sunset" v={hhmm(sun.set)} sub="pack up by then" />
        <Stat k="UV max" v={day.uvMax != null ? day.uvMax : "—"} sub={day.uvMax >= 5 ? "fish go deep" : day.uvMax != null ? "fine" : "live feed"} />
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
  );

  const fliesBlock = day && (
    <>
      <div style={{ ...panel, padding: 16 }}>
        <Label>{MONTHS[day.date.getMonth()]} fly box · {day.label}</Label>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{box.lureFirst ? "Today leans to lures — start with an attractor, then go natural." : "Today leans to naturals — start imitative, keep a lure on standby."}</div>
        {[[box.lureFirst ? "Lures first" : "Imitative first", box.lureFirst ? box.lures : box.flies, box.lureFirst], [box.lureFirst ? "Then try" : "Lures on standby", box.lureFirst ? box.flies : box.lures, !box.lureFirst]].map(([t, items, lure]) => (
          <div key={t} style={{ marginTop: 12 }}>
            <Label>{t}</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {items.map((f) => <span key={f} style={{ background: lure ? C.fairBg : C.cyanBg, color: lure ? C.fair : C.cyan, borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 600 }}>{f}</span>)}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 13 }}><b style={{ color: C.cyan }}>Colour:</b> {box.colour}</div>
        {box.notes.length > 0 && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>{box.notes.map((n, i) => <div key={i} style={{ fontSize: 14, color: C.text, lineHeight: 1.45, paddingLeft: 12, borderLeft: `2px solid ${C.line2}` }}>{n}</div>)}</div>}
      </div>
      <div style={{ ...panel, padding: 16, marginTop: 10 }}>
        <Label>What's biting in {MONTHS[day.date.getMonth()]}</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>{box.biting.map((b) => <div key={b} style={{ fontSize: 14, display: "flex", gap: 8 }}><span style={{ color: C.go }}>●</span>{b}</div>)}</div>
        <button onClick={() => go("guide")} style={{ marginTop: 10, border: "none", background: "transparent", color: C.cyan, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>Month-by-month guide →</button>
      </div>
      <div style={{ ...panel, padding: 16, marginTop: 10 }}>
        <Label>Kit check · {day.label}</Label>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
          {[day.rain >= 3 ? "Waterproofs — rain forecast" : "Light layers", day.lo <= 5 ? "Gloves and a hat — cold start" : day.lo >= 15 ? "Sun cream and water" : "A warm layer for dawn/dusk", day.wind > 15 ? "Heavier rod or a 7-wt — it's blowing" : "Your usual 6/7-wt", day.cloud < 35 ? "Polarised glasses — spot fish, protect eyes" : "Glasses anyway — hooks fly", `${meth.line} line on the reel before you leave`, day.uvMax >= 5 ? "Sun cream and a cap — UV is high" : null, day.thunder ? "Check the radar before you go — storms forecast" : null].filter(Boolean).map((k, i) => <div key={i} style={{ display: "flex", gap: 8 }}><span style={{ color: C.cyan }}>☐</span>{k}</div>)}
        </div>
      </div>
    </>
  );

  const logBlock = venue && day && (
    <>
      <div style={{ ...panel, padding: 16 }}>
        {!logForm ? (
          <button onClick={() => setLogForm(true)} style={{ width: "100%", border: "none", cursor: "pointer", background: C.cyan, color: C.bg, borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 14 }}>+ Log a session here</button>
        ) : (
          <LogForm venue={venue} day={day} moon={moon} hasLive={!!feed && !feed.stale} defaultDate={day.date.toLocaleDateString("sv-SE", { timeZone: "Europe/London" })} flies={FLIES.map((f) => f.n)} onSave={(e) => { saveLog([e, ...log]); setLogForm(false); }} onCancel={() => setLogForm(false)} />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
        {venueLog.map((l) => <LogEntry key={l.id} l={l} onDelete={(id) => saveLog(log.filter((x) => x.id !== id))} />)}
        {venueLog.length === 0 && !logForm && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 10 }}>No sessions logged here yet.</div>}
      </div>
    </>
  );

  const VTABS = [["plan", "Verdict"], ["weather", "Weather"], ["flies", "Fly box"], ["log", `Log${venueLog.length ? ` (${venueLog.length})` : ""}`]];

  const venueView = venue && day && (
    <>
      <button onClick={() => setVenueId(null)} style={{ border: "none", cursor: "pointer", background: "transparent", padding: "0 0 8px", fontFamily: F.body, fontWeight: 600, fontSize: 14, color: C.cyan }}>← {screen === "map" ? "Back to map" : "All waters"}</button>
      <div style={wide ? { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,420px)", gap: 16, alignItems: "start" } : {}}>
        <div>
          {venueHeader}
          {closureFor(venue.id) && <div className="notice-strip compact"><div><strong>Operator notice takes priority over the score.</strong><p>{closureFor(venue.id).text}</p><a href={closureFor(venue.id).url} target="_blank" rel="noreferrer">Read operator notice · checked {closureFor(venue.id).checkedAt}</a></div></div>}
          {!feed && <p className="inline-error">Illustrative forecast only. The detail below uses sample data until the live weather feed loads; do not use it to plan a trip.</p>}
          {!wide && <div style={{ marginTop: 10 }}>{venueMapBlock}</div>}
          {errors[venueId] && <div style={{ background: C.poorBg, border: `1px solid ${C.poor}`, color: C.text, borderRadius: 12, padding: "10px 14px", fontSize: 12, marginTop: 10, fontFamily: F.mono, lineHeight: 1.5 }}>Live feed failed: {errors[venueId]}<br /><span style={{ color: C.muted }}>Showing sample data. Tap "Go live" to retry.</span></div>}
          <div style={{ marginTop: 10 }}><DayStrip week={week} activeIdx={Math.min(dayIdx, week.length - 1)} onPick={setDayIdx} /></div>
          <div style={{ ...panel, marginTop: 8, padding: "6px 4px 0" }}><Sparkline week={week} activeIdx={Math.min(dayIdx, week.length - 1)} onPick={setDayIdx} /></div>
          <button onClick={() => setDayIdx(bestIdx)} style={{ marginTop: 8, border: "none", cursor: "pointer", background: "transparent", padding: 0, fontSize: 13, color: C.cyan, fontWeight: 600 }}>▸ Best day: {dateStr(week[bestIdx].date)} ({week[bestIdx].result.score}/10)</button>
          <div className="noscroll" style={{ display: "flex", gap: 5, margin: "12px 0 10px", overflowX: "auto" }}>
            {VTABS.map(([k, t]) => <Chip key={k} on={tab === k} onClick={() => setTab(k)}>{t}</Chip>)}
          </div>
          {tab === "plan" && planBlock}
          {tab === "weather" && weatherBlock}
          {tab === "flies" && fliesBlock}
          {tab === "log" && logBlock}
        </div>
        {wide && (
          <div style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {venueMapBlock}
            {tab !== "weather" && dayIdx === 0 && feed?.now && <NowCard now={feed.now} />}
            {tab !== "weather" && feed?.series && <div style={{ ...panel, padding: 16 }}><Label>Barometer · 4 days</Label><div style={{ marginTop: 10 }}><PressureChart series={feed.series} /></div></div>}
            <SolunarCard sol={sol} moon={moon} />
          </div>
        )}
      </div>
    </>
  );

  /* ---------------- Screens ---------------- */
  let body;
  if (venue) body = venueView;
  else if (screen === "today") body = <Dashboard items={all} feeds={feeds} home={home} radius={radius} onOpen={openVenue} go={go} log={log} favs={favs} loading={!!bulk} />;
  else if (screen === "field") body = <FieldBook book={fieldBook} cloud={cloud} feeds={feeds} home={home} log={log} onSaveLog={saveLog} onOpen={openVenue} openCloud={() => go("settings")} forecastLoading={!!bulk} />;
  else if (screen === "more") body = <><div className="page-heading"><div><p className="eyebrow">YOUR FIELD GUIDE</p><h1>Explore a little further.</h1><p>Maps, river observations, reports and practical seasonal guidance.</p></div></div><div className="more-grid">{[...NAV.filter(n => ["map", "rivers", "reports", "guide"].includes(n[0])), ["settings", "Alerts & sync", Bell]].map(([id, label, Icon]) => <button className="panel more-card" key={id} onClick={() => go(id)}><Icon size={26} /><span>{label}</span><ArrowRight size={18} /></button>)}</div></>;
  else if (screen === "rivers") body = <Rivers home={home} />;
  else if (screen === "reports") body = <Reports cloudKey={cloud.key} openCloud={() => go("settings")} />;
  else if (screen === "settings") body = <CloudSettings cloud={cloud} favs={favs} log={log} />;
  else if (screen === "map") body = (
    <>
      {homeBar}
      {dayPicker}
      <WatersMap items={all} home={home} radius={radius} onOpen={openVenue} height={wide ? "calc(100vh - 210px)" : "calc(100vh - 290px)"} />
      <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Pins show each water's score for the chosen day. Faded pins sit outside your {radius}-mile radius. Tap a pin for details, and use the top-right control to switch between dark, satellite and street maps.</div>
    </>
  );
  else if (screen === "guide") body = <Guide />;
  else if (screen === "log") body = <><div className="page-heading"><div><p className="eyebrow">YOUR OWN BEST EVIDENCE</p><h1>The fishing journal.</h1><p>Build a picture of the waters, flies and conditions that work for you.</p></div><button className="button secondary" onClick={() => go("settings")}><Cloud size={16} />{cloud.key ? cloud.status : "Sync across devices"}</button></div><LogScreen log={log} onDelete={(id) => saveLog(log.filter((x) => x.id !== id))} onOpenVenue={(id) => { setScreen("waters"); openVenue(id); }} /></>;
  else body = wide ? (
    <div style={{ display: "grid", gridTemplateColumns: "440px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
      <div>{hint && <InstallHint onClose={() => { setHint(false); LS.set("tl-hint-off", true); }} />}{homeBar}{liveBar}{dayPicker}{filters}{list}{monthTeaser}{recent}</div>
      <div style={{ position: "sticky", top: 16 }}>
        <WatersMap items={all} home={home} radius={radius} onOpen={openVenue} height="calc(100vh - 110px)" />
      </div>
    </div>
  ) : (
    <>{hint && <InstallHint onClose={() => { setHint(false); LS.set("tl-hint-off", true); }} />}{homeBar}{liveBar}{dayPicker}{filters}{list}{monthTeaser}{recent}</>
  );

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <button className="brand" onClick={() => go("today")} aria-label="Pocket Ghillie overview"><Logo size={34} /><span>POCKET GHILLIE<small>THE ANGLER'S FIELD GUIDE</small></span></button>
      <p className="nav-label">OUT ON THE WATER</p>
      <nav aria-label="Main navigation">{NAV.map(([k, title, Icon]) => <button key={k} className={`nav-item ${screen === k && !venue ? "active" : ""}`} onClick={() => go(k)}><Icon size={19} /><span>{title}</span>{k === "reports" && <span className="nav-count">1</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><Waves size={22} /><p>Less guesswork.<br />More time on the water.</p><span>South East England</span></div><button className={`nav-item ${screen === "settings" ? "active" : ""}`} onClick={() => go("settings")}><Bell size={18} />Alerts & sync</button><p className="sidebar-version">POCKET GHILLIE · FIELD EDITION 04</p></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="topbar-title"><button className="mobile-brand" onClick={() => go("today")}><Logo />POCKET GHILLIE</button><span className="desktop-crumb">Your field guide <span>/</span> {venue ? venue.name : NAV.find(n => n[0] === screen)?.[1] || "Alerts & sync"}</span></div><div className="topbar-actions"><span className="topbar-date">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" })}</span><button className="icon-button" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button><button className="icon-button" aria-label="Alerts and sync" onClick={() => go("settings")}><Bell size={19} /></button></div></header>
      <main id="main" tabIndex="-1" className="main-content">
        {!online && <div className="inline-error">You're offline. Cached forecasts may be out of date; river readings and cloud sync require a connection.</div>}
        {body}
        <footer className="app-footer"><span>POCKET GHILLIE <span>For the days worth getting up for.</span></span><span>Forecasts: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · Model scores, not catch guarantees</span></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{MOBILE_NAV.map(([k, title, Icon]) => <button key={k} className={(screen === k || k === "more" && ["map", "rivers", "reports", "guide", "settings"].includes(screen)) && !venue ? "active" : ""} onClick={() => go(k)}><Icon size={19} /><span>{title}</span></button>)}</nav>
  </div>;
}
