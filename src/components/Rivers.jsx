import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Waves, ExternalLink, AlertTriangle } from "lucide-react";
import { api } from "../lib/cloud.js";
import { milesFrom } from "../lib/util.js";
import FieldChart from "./FieldChart.jsx";
const stamp = value => value ? new Date(value).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " UK" : "No reading";
export default function Rivers({ home, onUseGauge, selectedGauge }) {
  const [stations, setStations] = useState([]), [selected, setSelected] = useState(""), [measureId, setMeasure] = useState(""), [readings, setReadings] = useState([]), [query, setQuery] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(false), [traceBusy, setTraceBusy] = useState(false), [reload, refresh] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController(); setLoading(true); setError(""); setReadings([]); setSelected(""); setMeasure(""); setStations([]);
    api(`/rivers?lat=${home.lat}&lon=${home.lon}`, { signal: ctrl.signal }).then(data => {
      const list = data.items.sort((a, b) => milesFrom({ lat: a.lat, lon: a.lon }, home) - milesFrom({ lat: b.lat, lon: b.lon }, home));
      setStations(list); const first = list.find(s => s.measures.length); setSelected(first?.id || ""); setMeasure(first?.measures[0]?.id || "");
    }).catch(e => { if (!ctrl.signal.aborted) setError(e.message); }).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [home.lat, home.lon, reload]);
  useEffect(() => {
    if (!measureId) return; const ctrl = new AbortController(); setTraceBusy(true); setReadings([]); setError("");
    api(`/readings?measure=${encodeURIComponent(measureId)}`, { signal: ctrl.signal }).then(data => setReadings(data.items)).catch(e => { if (!ctrl.signal.aborted) setError(e.message); }).finally(() => { if (!ctrl.signal.aborted) setTraceBusy(false); });
    return () => ctrl.abort();
  }, [measureId, reload]);
  const station = stations.find(s => s.id === selected), measure = station?.measures.find(m => m.id === measureId);
  const latest = readings.at(-1) || measure?.latest, stale = latest && Date.now() - new Date(latest.dateTime) > 2 * 3600000;
  const prior = readings.filter(r => new Date(r.dateTime) <= new Date(latest?.dateTime) - 3600000).at(-1);
  const delta = latest && prior ? latest.value - prior.value : null;
  const rows = useMemo(() => readings.map(r => ({ value: r.value, label: new Date(r.dateTime).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" }), full: stamp(r.dateTime) })), [readings]);
  return <div>
    <div className="page-heading"><div><p className="eyebrow">ENVIRONMENT AGENCY · ENGLAND</p><h1>Follow the flow.</h1><p>Nearby monitoring stations around {home.label}. Not a measurement of your chosen fishery.</p></div><button className="button secondary" onClick={() => refresh(n => n + 1)} disabled={loading || traceBusy}><RefreshCw size={16} /> Refresh</button></div>
    <div className="notice-strip"><AlertTriangle size={20} /><div><strong>River level is not a safety assessment.</strong><p>Readings can be delayed. Never use a gauge to decide that wading is safe; check local conditions and official flood warnings.</p></div><a className="text-button" href="https://check-for-flooding.service.gov.uk/" target="_blank" rel="noreferrer">Flood warnings <ExternalLink size={16} /></a></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="river-layout">
      <section className="panel station-panel"><label className="field-label">Find a station<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Station or river name" /></label><p className="small muted">Within approximately 35 km · {stations.length} stations</p>
        <div className="station-list">{loading ? <div className="skeleton-block" aria-label="Loading stations" /> : stations.filter(s => `${s.label} ${s.river}`.toLowerCase().includes(query.toLowerCase())).map(s => <button key={s.id} className={`station-row ${selected === s.id ? "active" : ""}`} onClick={() => { setSelected(s.id); setMeasure(s.measures[0]?.id || ""); setReadings([]); }}><Waves size={17} /><span><strong>{s.label}</strong><small>{s.river} · {milesFrom({ lat: s.lat, lon: s.lon }, home)} mi</small></span></button>)}</div>
        {!loading && !stations.length && <p>No station data returned. Try Refresh or change your home area in Explore waters.</p>}
      </section>
      <section className="panel river-detail"><p className="eyebrow">GAUGE DETAIL</p><h2>{station?.label || "Choose a station"}</h2><p className="muted">{station?.river || "Real readings, with no sample fallback."}</p>
        {station && <label className="field-label">Measurement<select value={measureId} onChange={e => setMeasure(e.target.value)}>{station.measures.map(m => <option key={m.id} value={m.id}>{m.qualifier} · {m.unit}</option>)}</select></label>}
        {measure && <button className="button secondary field-spacing" onClick={() => onUseGauge({ measureId: measure.id, label: `${station.label} · ${measure.qualifier}` })}>{selectedGauge?.measureId === measure.id ? "Selected for AI briefing" : "Use this gauge in my AI briefing"}</button>}
        {selectedGauge && <button className="text-button" onClick={() => onUseGauge(null)}>Remove gauge from briefing</button>}
        <div className="river-metrics"><div><span className="eyebrow">LATEST LEVEL</span><div className="metric-number">{latest ? Number(latest.value).toFixed(3) : "—"}<small>{measure?.unit}</small></div></div><div><span className="eyebrow">CHANGE SINCE {prior ? stamp(prior.dateTime) : "PRIOR READING"}</span><div className="metric-number">{delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(3)}`}<small>{measure?.unit}</small></div></div></div>
        <p className={`small ${stale ? "warning-text" : "muted"}`}>{stale ? "Delayed: " : ""}Observed {stamp(latest?.dateTime)}{stale ? ". More than two hours old." : ""}</p>
        {traceBusy ? <div className="skeleton-block" /> : <FieldChart data={rows} unit={measure?.unit || "m"} label="Gauge level" height={280} />}
        <p className="small muted">Last 48 hours where supplied. Gauge height is relative to its datum, not river depth. No “safe”, “normal” or flood threshold is inferred.</p>
        {measure && <a className="text-button" href={`https://environment.data.gov.uk/flood-monitoring/id/measures/${measure.id}`} target="_blank" rel="noreferrer">Inspect original measurement <ExternalLink size={15} /></a>}
      </section>
    </div>
    <p className="source-footer">This uses Environment Agency flood and river level data from the real-time data API (Beta). <a href="https://environment.data.gov.uk/flood-monitoring/doc/reference" target="_blank" rel="noreferrer">API documentation</a> · <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noreferrer">Open Government Licence v3.0</a>. Not a UK-wide gauge service.</p>
  </div>;
}
