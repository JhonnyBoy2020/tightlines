import React, { useMemo, useState } from "react";
import { ArrowUpRight, ArrowRight, Wind, Gauge, CloudSun, Sunrise, Fish, Waves, MapPin, ShieldAlert, Bookmark, Check, CircleHelp } from "lucide-react";
import FieldChart from "./FieldChart.jsx";
import { WatersMap } from "./Maps.jsx";
import { MONTH_GUIDE } from "../data/guide.js";
import { REPORTS } from "../data/reports.js";
import { sunTimes } from "../lib/astro.js";
import { hhmm } from "../lib/util.js";

export default function Dashboard({ items, feeds, home, radius, onOpen, go, log, favs, loading }) {
  const [selected, setSelected] = useState("thornwood");
  const [metric, setMetric] = useState("press");
  const [checks, setChecks] = useState([]);
  const focus = items.find(x => x.v.id === selected) || items[0];
  const f = feeds[focus?.v.id], d = focus?.sel, now = f?.now;
  const eligible = items.filter(x => x.live && !x.sel.status && !x.sel.thunder && x.sel.gust < 35 && x.dist <= radius).sort((a, b) => b.sel.result.score - a.sel.result.score);
  const best = eligible[0];
  const guide = MONTH_GUIDE[new Date().getMonth()];
  const sun = focus && sunTimes(new Date(), focus.v.lat, focus.v.lon);
  const metrics = { press: { title: "Pressure", unit: "hPa", key: "press" }, wind: { title: "Wind", unit: "mph", key: "wind" }, temp: { title: "Air temperature", unit: "°C", key: "temp" }, rain: { title: "Rainfall", unit: "mm", key: "rain" } };
  const chart = useMemo(() => !f ? [] : f.week.slice(0, 3).flatMap(day => (day.hourly?.[metric] || []).map((value, h) => ({ value, label: h === 0 ? day.date.toLocaleDateString("en-GB", { weekday: "short" }) : `${String(h).padStart(2, "0")}:00`, full: `${day.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} ${String(h).padStart(2, "0")}:00 UK` }))), [f, metric]);
  const tripChecklist = ["Rod licence & fishery permission", "Check opening and catch limits", "Weather, safe access & lifejacket", "Barbless hooks, net & thermometer"];
  return <div className="dashboard">
    <div className="page-heading"><div><p className="eyebrow"><span className="live-dot" /> THE WATER IS CALLING</p><h1>A better day on the water.</h1><p>Read the conditions. Choose your water. Make every cast count.</p></div><button className="button secondary" onClick={() => go("waters")}><MapPin size={16} /> {home.label}</button></div>
    <div className="dashboard-top">
      <section className="landscape-hero">
        <img src="./lakeside.webp" alt="" />
        <div className="hero-shade" />
        <div className="hero-copy"><span className="hero-badge">YOUR NEXT SESSION</span><h2>{best ? best.v.name : "Find a little stillness."}</h2><p>{best ? `${best.dist} miles from ${home.label}. ${best.sel.result.tip}` : loading ? "Bringing together forecasts for your local waters." : "Explore the waters near you. Live scores appear when the weather feed is available."}</p><button className="button cream" onClick={() => best ? onOpen(best.v.id) : go("waters")}>{best ? "Plan this session" : "Explore waters"}<ArrowUpRight size={18} /></button></div>
        {best && <div className="hero-score"><b>{best.sel.result.score}<small>/10</small></b><span>CONDITIONS INDEX</span><span>Heuristic, not catch odds</span></div>}
        <span className="image-note">Illustrative landscape</span>
      </section>
      <section className="panel seasonal-card"><div className="section-heading"><span className="eyebrow">THE SEASONAL EDIT</span><Fish size={19} /></div><h2>{new Date().toLocaleDateString("en-GB", { month: "long" })} on the fly.</h2><p>{guide.headline}</p><div className="season-fly">{guide.lures?.[0] || guide.flies?.[0]}</div><p className="small">A seasonal starting point, not a live catch report. Check the fishery's permitted methods.</p><button className="text-button" onClick={() => go("guide")}>Open the fly guide <ArrowRight size={16} /></button></section>
    </div>
    <div className="section-heading conditions-heading"><div><h2>Read the water</h2><span className="small muted">Forecast model, not an on-site sensor · {f ? `fetched ${hhmm(f.at)} UK` : "awaiting live data"}</span></div><label className="inline-label"><span className="sr-only">Forecast water</span><select aria-label="Forecast water" value={focus?.v.id || ""} onChange={e => setSelected(e.target.value)}>{items.map(x => <option key={x.v.id} value={x.v.id}>{x.v.name}</option>)}</select></label></div>
    <div className="metrics-row">
      {[{ icon: Gauge, label: "ATMOSPHERIC PRESSURE", value: now ? Math.round(now.press) : "—", unit: "hPa", sub: now ? `${now.t3 > 0 ? "+" : ""}${now.t3} hPa over 3h` : "Live feed required" }, { icon: Wind, label: "WIND & GUSTS", value: now ? Math.round(now.wind) : "—", unit: "mph", sub: now ? `${now.dir} · gusts ${Math.round(now.gust)} mph` : "Live feed required" }, { icon: CloudSun, label: "AIR TEMPERATURE", value: now ? Math.round(now.temp) : "—", unit: "°C", sub: now ? `${Math.round(now.cloud)}% cloud · ${Math.round(now.pop)}% rain chance` : "No sample values shown" }, { icon: Sunrise, label: "LAST LIGHT", value: sun ? hhmm(sun.set) : "—", unit: "", sub: "UK time · check fishery closing time" }].map(m => <section className="metric" key={m.label}><div className="section-heading"><span className="eyebrow">{m.label}</span><m.icon size={18} /></div><div className="metric-number">{m.value}<small>{m.unit}</small></div><p>{m.sub}</p></section>)}
    </div>
    <div className="dashboard-middle">
      <section className="panel forecast-panel"><div className="section-heading"><div><p className="eyebrow">LOOK AHEAD</p><h2>72-hour conditions</h2></div><span className="data-pill">{f ? "Open-Meteo forecast" : "Feed unavailable"}</span></div><div className="segmented">{Object.entries(metrics).map(([key, m]) => <button className={metric === key ? "active" : ""} key={key} onClick={() => setMetric(key)}>{m.title}</button>)}</div><FieldChart data={chart} unit={metrics[metric].unit} label={metrics[metric].title} /><p className="chart-caption"><CircleHelp size={14} /> Drag or hover to inspect. Pressure patterns are context, not a reliable prediction of bites.</p></section>
      <section className="panel map-panel"><div className="section-heading"><div><p className="eyebrow">A CHANGE OF SCENERY</p><h2>Your local waters</h2></div><button className="icon-button" aria-label="Open full map" onClick={() => go("map")}><ArrowUpRight size={20} /></button></div><WatersMap items={items} home={home} radius={radius} onOpen={onOpen} height={257} initial="osm" /><div className="map-caption"><MapPin size={14} /> {items.filter(x => x.dist <= radius).length} waters within {radius} miles <button onClick={() => go("waters")}>Explore all <ArrowRight size={14} /></button></div></section>
    </div>
    <div className="dashboard-bottom">
      <section className="panel shortlist"><div className="section-heading"><div><p className="eyebrow">WORTH A LOOK</p><h2>Today's shortlist</h2></div><button className="text-button" onClick={() => go("waters")}>All waters <ArrowRight size={15} /></button></div>{eligible.slice(0, 3).map((x, i) => <button className="shortlist-row" key={x.v.id} onClick={() => onOpen(x.v.id)}><span className="row-index">0{i + 1}</span><span className="shortlist-name"><strong>{x.v.name}</strong><small>{x.dist} mi · {x.v.where}{favs.includes(x.v.id) ? " · Saved" : ""}</small></span><span className="score-tag">{x.sel.result.score}<small>/10</small></span><ArrowUpRight size={17} /></button>)}{!eligible.length && <p className="empty-inline">No current forecast qualifies for the shortlist. Explore all waters and check access directly with the fishery.</p>}<p className="small muted">Forecast score only. Water temperature is estimated; access must be confirmed.</p></section>
      <section className="panel checklist"><p className="eyebrow">BEFORE YOU GO</p><h2>A little preparation.</h2>{tripChecklist.map((t, i) => <label key={t}><input type="checkbox" checked={checks.includes(i)} onChange={e => setChecks(e.target.checked ? [...checks, i] : checks.filter(n => n !== i))} /><span>{t}</span></label>)}<p className="small muted">{checks.length}/4 checked for this visit</p></section>
    </div>
    <aside className="notice-strip"><ShieldAlert size={21} /><div><strong>Hanningfield: check before you travel</strong><p>Operator reports a temporary closure due to low water. Checked 7 October 2026; reopening not confirmed.</p></div><button className="text-button" onClick={() => go("reports")}>View notice <ArrowRight size={16} /></button></aside>
    <div className="journal-nudge"><Bookmark size={18} /><span>{log.length ? `${log.length} sessions in your journal. Keep learning from the days that worked.` : "Your best fishing advice will come from your own journal."}</span><button className="text-button" onClick={() => go("log")}>Open journal <ArrowRight size={16} /></button></div>
  </div>;
}
