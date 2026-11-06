import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { api } from "../lib/cloud.js";
import { rankTrips } from "../lib/field.js";
import { VENUES } from "../data/venues.js";
export const emptyIntelligence = () => ({ options: { water: "shortlist", inventory: false, journal: false, reports: false, session: false, consent: false }, result: null });

export default function Intelligence({ book, cloud, feeds, home, log, river, state, setState, openCloud, openTackle, openRivers }) {
  const [status, setStatus] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [now, setNow] = useState(Date.now());
  const ctrl = useRef(null);
  useEffect(() => { api("/ai/status").then(setStatus).catch(() => setStatus({ enabled: false })); const t = setInterval(() => setNow(Date.now()), 60000); return () => { clearInterval(t); ctrl.current?.abort(); }; }, []);
  const { options: o } = state, { plan, flies, session } = book.data;
  const shortlist = useMemo(() => rankTrips(VENUES, feeds, home, plan, now), [feeds, home, plan, now]);
  const ids = o.water === "shortlist" ? shortlist.map(x => x.v.id) : [o.water];
  const input = { venueIds: ids, date: plan.date, plan, hours: `${plan.start}:00–${plan.end}:00 UK`, consent: o.consent, includeInventory: o.inventory, inventory: o.inventory ? flies : [], includeJournal: o.journal, journal: o.journal ? [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20) : [], includeSavedReports: o.reports, includeSession: o.session, session: o.session && session ? { venueId: session.venueId, fly: session.fly, running: session.running, catches: session.events.filter(e => e.type === "catch").length, missed: session.events.filter(e => e.type === "missed").length } : null, measureId: river?.measureId || null };
  // Kept only in memory; never sent as a key or shown in the interface.
  const fingerprint = JSON.stringify([cloud.key, input]);
  const result = state.result?.fingerprint === fingerprint ? state.result : null;
  const stale = result && now - Date.parse(result.createdAt) > 15 * 60000;
  function option(key, value) { setState(s => ({ ...s, options: { ...s.options, [key]: value } })); }
  async function generate() {
    setBusy(true); setError(""); ctrl.current = new AbortController();
    try {
      const r = await api("/ai/brief", { key: cloud.key, signal: ctrl.current.signal, body: { ...input, question: "Prepare my whole-app fishing briefing from the supplied evidence. Use short sections: Where to go; When to fish; What to tie on; What the data is telling us; Before you leave. Compare only supplied waters. Connect hourly planning, forecasts, daylight, moon limitations, notices, selected gauge and any opted-in personal data. Be explicit about missing data and checks; don't invent ownership, recent stocking, causal catch patterns or safe conditions." } });
      if (!ctrl.current.signal.aborted) setState(s => ({ ...s, result: { ...r, fingerprint } }));
      setNow(Date.now());
    } catch (e) { if (e.name !== "AbortError") setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="panel intelligence">
    <div className="section-heading"><div><p className="eyebrow"><Sparkles size={17} /> YOUR POCKET GHILLIE</p><h2>One briefing. The bigger picture.</h2></div><span className={`data-pill ${status?.enabled ? "" : "warning"}`}>{status == null ? "Checking AI…" : status.enabled ? "AI connected" : "AI unavailable"}</span></div>
    <p className="small muted">Connect the evidence before your next cast. One on-demand briefing is shared between Overview and Trip planner; no paid AI requests run automatically.</p>
    <div className="evidence-strip"><span>Fresh forecasts</span><span>Hourly planning</span><span>Daylight & moon</span><span>Dated notices</span><span>{river ? "Selected EA gauge" : "No gauge selected"}</span><span>Seasonal guide</span></div>
    <div className="intelligence-controls"><label className="field-label">Waters to review<select value={o.water} onChange={e => option("water", e.target.value)}><option value="shortlist">My planner shortlist ({shortlist.length} waters)</option>{VENUES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label><div className="brief-plan"><Clock size={16} /><span>{plan.date} · {String(plan.start).padStart(2, "0")}:00–{String(plan.end).padStart(2, "0")}:00 UK<br /><small>{plan.mode} fishing · change your plan in Plan & fish</small></span></div></div>
    <details className="brief-options"><summary>Choose which personal data to include</summary><div className="brief-checks">{[["inventory", `My fly box (${flies.length} patterns)`], ["journal", "Up to 20 recent journal entries, no notes or photos"], ["reports", "Up to 10 saved reports for these waters"], ["session", "My current session and fly selection"]].map(([id, label]) => <label key={id}><input type="checkbox" checked={o[id]} onChange={e => option(id, e.target.checked)} />{label}</label>)}</div><p className="small muted">Saved reports are user-entered and not independently verified. Sparse catch history cannot prove what caused a catch.</p></details>
    {river && <p className="small muted">Gauge: {river.label}. It is not a measurement of your fishery. <button className="text-button" onClick={openRivers}>Change gauge</button></p>}
    <label className="consent-label"><input type="checkbox" checked={o.consent} onChange={e => option("consent", e.target.checked)} />Send this plan, selected-water evidence and the personal data I checked to OpenAI to generate a briefing.</label>
    <div className="button-row"><button className="button primary" disabled={busy || !status?.enabled || !cloud.key || !o.consent || !ids.length} onClick={generate}><Sparkles size={16} />{busy ? "Connecting the evidence…" : result ? "Refresh my briefing" : "Generate my briefing"}</button>{!cloud.key && <button className="button secondary" onClick={openCloud}>Connect private logbook</button>}<button className="text-button" onClick={openTackle}>Explore tackle photos <ArrowRight size={15} /></button></div>
    {!ids.length && <p className="small warning-text">No eligible shortlist. Choose a specific water for an explanation, or adjust your plan. Missing or unsafe forecasts are not silently filled in.</p>}
    {busy && <p className="small muted" role="status">Fetching current evidence. This can take up to a minute. Navigating away stops waiting but may not stop provider processing.</p>}
    {error && <p className="inline-error" role="alert">{error}</p>}
    {state.result && !result && <p className="small muted">Your inputs or privacy choices changed. Generate a new briefing for this selection.</p>}
    {result && <article className="briefing-result"><p className="eyebrow">AI-GENERATED · {new Date(result.createdAt).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" })} UK</p>{stale && <p className="inline-error">This briefing is over 15 minutes old. Refresh before relying on changing conditions.</p>}{result.warnings.map((w, i) => <p className="inline-error" key={i}>{w}</p>)}<div className="coach-text">{result.answer}</div><p className="small muted">Included: {result.inventoryCount} patterns · {result.journalCount} journal entries · {result.reportCount || 0} saved reports{result.sessionIncluded ? " · current session" : ""}. Advice is not automatically saved.</p><details className="coach-evidence"><summary>Inspect the evidence and timestamps</summary>{result.sources.map(s => s.url ? <a key={s.id} href={s.url} target="_blank" rel="noreferrer"><span>[{s.id}] {s.title}</span><small>{s.at || "Catalogue / source reference, not a live check"}</small></a> : <p key={s.id}>[{s.id}] {s.title}</p>)}</details></article>}
    <p className="small muted field-spacing"><ShieldCheck size={14} /> 10 requests per logbook and 40 total per day, shared with camera and coach. AI advises; it does not change scores, override warnings, book fishing or certify safety.</p>
  </section>;
}
