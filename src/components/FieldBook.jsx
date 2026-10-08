import React, { useEffect, useMemo, useRef, useState } from "react";
import { Compass, Fish, Timer, Package, Sparkles, ArrowUpRight, Play, Pause, Undo2, Download, Cloud, ShieldCheck, Send, Plus, Minus, Trash2 } from "lucide-react";
import { VENUES } from "../data/venues.js";
import { MONTH_GUIDE } from "../data/guide.js";
import { REPORTS } from "../data/reports.js";
import { api, downloadJSON } from "../lib/cloud.js";
import { elapsedMs, londonDate, rankTrips, validateField } from "../lib/field.js";

const hours = h => `${String(h).padStart(2, "0")}:00`;
const tabs = [["plan", "Trip planner", Compass], ["session", "Session", Timer], ["box", "My fly box", Package], ["coach", "AI coach", Sparkles]];
const dateLabel = date => new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" });

export default function FieldBook({ book, cloud, feeds, home, log, onSaveLog, onOpen, openCloud, forecastLoading }) {
  const [tab, setTab] = useState("plan"), [notice, setNotice] = useState(""), [localError, setLocalError] = useState(""), [restore, setRestore] = useState(null), [loadConfirm, setLoadConfirm] = useState(false), [clock, setClock] = useState(Date.now());
  const { data, change } = book, fileRef = useRef();
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const shortlist = useMemo(() => rankTrips(VENUES, feeds, home, data.plan, clock), [feeds, home, data.plan, clock]);
  const updatePlan = update => change(d => ({ ...d, plan: { ...d.plan, ...update } }));
  async function importFile(e) {
    setLocalError(""); setRestore(null);
    try {
      const file = e.target.files?.[0]; if (!file) return;
      if (file.size > 300000) throw new Error("That file is too large. Choose a TightLines field-book JSON backup.");
      setRestore(validateField(JSON.parse(await file.text()))); setNotice("");
    } catch (error) { setLocalError(error.message); }
    e.target.value = "";
  }
  function start(venueId) {
    if (data.session) { setTab("session"); return; }
    const now = Date.now();
    change(d => ({ ...d, session: { id: crypto.randomUUID(), venueId, startedAt: now, lastStarted: now, elapsed: 0, running: true, fly: "", events: [] } }));
    setTab("session"); setNotice("Session started. Save a cloud checkpoint or export a backup before closing this tab.");
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">FIELD EDITION 04 · TEST RELEASE</p><h1>A better day starts here.</h1><p>Plan with the forecast. Fish with focus. Learn from your own water.</p></div><span className="data-pill"><Compass size={14} /> &nbsp; Plan & fish</span></div>
    <div className="field-intro">
      <div><span className="eyebrow">YOUR PERSONAL FIELD BOOK</span><h2>From the first idea<br />to the final cast.</h2><p>One place for the trip, the flies in your box, and a little informed advice.</p></div>
      <div className="field-intro-stats"><div><b>{data.flies.reduce((n, f) => n + f.quantity, 0)}</b><span>flies in your box</span></div><div><b>{log.length}</b><span>sessions recorded</span></div><div><b>{data.session ? "On" : "Ready"}</b><span>session mode</span></div></div>
    </div>
    <div className="field-tabs" role="tablist" aria-label="Field book tools">{tabs.map(([id, name, Icon]) => <button key={id} role="tab" id={`tab-${id}`} aria-controls="field-panel" aria-selected={tab === id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}><Icon size={18} />{name}{id === "session" && data.session && <span className="live-dot" />}</button>)}</div>
    <section id="field-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === "plan" && <>
        <div className="planner-controls panel">
          <label className="field-label">Fishing day<input type="date" value={data.plan.date} onChange={e => updatePlan({ date: e.target.value || londonDate() })} /></label>
          <label className="field-label">Start (UK time)<select value={data.plan.start} onChange={e => { const start = +e.target.value; updatePlan({ start, end: Math.max(start + 1, data.plan.end) }); }}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hours(h)}</option>)}</select></label>
          <label className="field-label">Finish (UK time)<select value={data.plan.end} onChange={e => updatePlan({ end: +e.target.value })}>{Array.from({ length: 24 - data.plan.start }, (_, i) => i + data.plan.start + 1).map(h => <option key={h} value={h}>{hours(h)}</option>)}</select></label>
          <label className="field-label">Within {data.plan.radius} miles<input aria-label="Travel radius" type="range" min="5" max="150" step="5" value={data.plan.radius} onChange={e => updatePlan({ radius: +e.target.value })} /></label>
          <label className="field-label">Fishing from<select value={data.plan.mode} onChange={e => updatePlan({ mode: e.target.value })}><option value="bank">The bank</option><option value="boat">A boat</option></select></label>
        </div>
        <div className="section-heading"><div><p className="eyebrow">YOUR SHORTLIST</p><h2>{dateLabel(data.plan.date)} · {hours(data.plan.start)}–{hours(data.plan.end)}</h2></div><span className="small muted">From {home.label}</span></div>
        <p className="small muted field-explainer">Fresh forecast coverage only. Distances are straight-line, not driving distances. Known closures and the app's conservative weather/temperature exclusions are removed; remaining waters are not certified safe or open.</p>
        <div className="trip-grid">
          {shortlist.map((x, i) => <article className="panel trip-card" key={x.v.id}>
            <div className="section-heading"><span className="eyebrow">OPTION {String(i + 1).padStart(2, "0")}</span><span className="score-tag">{x.score}<small>/10</small></span></div>
            <h2>{x.v.name}</h2><p className="small muted">{x.v.where} · {x.distance} miles</p>
            <div className="trip-weather"><span>{x.day.hi}°<small>air high</small></span><span>{x.day.wind}<small>mph wind</small></span><span>{x.day.cloud}%<small>cloud</small></span></div>
            <p className="small">Hourly planning index</p><div className="hour-bars" aria-label="Hourly heuristic scores">{x.hours.map(h => <div key={h.h} tabIndex="0" title={`${hours(h.h)}: ${h.score}/10`}><div style={{ height: `${Math.max(4, h.score * 6)}px` }} /><span>{String(h.h).padStart(2, "0")}</span><b>{h.score}</b></div>)}</div>
            <p className="small muted">{x.v.ticket} · confirm access{data.plan.mode === "boat" ? " and boat availability" : ""}.</p>
            <div className="button-row"><button className="button primary" onClick={() => onOpen(x.v.id)}>View water <ArrowUpRight size={15} /></button><button className="button secondary" onClick={() => start(x.v.id)}>{data.session ? "Resume session" : "Start session"}</button></div>
            <a className="text-button" href={x.v.website} target="_blank" rel="noreferrer">Check operator details <ArrowUpRight size={14} /></a>
          </article>)}
        </div>
        {!shortlist.length && <div className="panel empty-state"><Compass size={30} /><h2>{forecastLoading ? "Checking the forecast…" : "No supported shortlist for this selection."}</h2><p>{forecastLoading ? "Fresh readings are on their way. Sample weather will not be used to fill this shortlist." : "Try another day within the forecast, a wider radius or bank fishing. We will not rank sample weather, known closures or excluded conditions as recommendations."}</p></div>}
        <div className="notice-strip compact"><ShieldCheck size={19} /><p>The index is a heuristic, not your chance of catching. Forecasts are not observations. Boat listings are catalogue information, not live booking availability. Check local rules and conditions before travel.</p></div>
        {REPORTS.filter(r => r.type === "closure").map(r => <p key={r.id} className="small muted field-explainer">Excluded notice: <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> · checked {r.checkedAt}; confirm reopening directly.</p>)}
      </>}
      {tab === "session" && <Session session={data.session} flies={data.flies} change={change} start={start} log={log} onSaveLog={onSaveLog} setNotice={setNotice} />}
      {tab === "box" && <FlyInventory flies={data.flies} change={change} month={new Date(data.plan.date + "T12:00:00Z").getUTCMonth()} />}
      {tab === "coach" && <Coach cloud={cloud} openCloud={openCloud} plan={data.plan} shortlist={shortlist} flies={data.flies} log={log} />}
    </section>
    <section className="panel field-save">
      <div><h3><Cloud size={18} /> Keep your field book safe</h3><p className="small muted">{book.dirty ? "Unsaved changes in this tab." : "No unsaved field-book changes."} Cloud checkpoints are manual; offline drafts do not survive closing this tab unless exported. Catch journal storage is separate.</p></div>
      <div className="button-row">
        {cloud.key ? <button className="button primary" disabled={book.busy || book.revision === null} onClick={book.save}>{book.busy ? "Working…" : "Save to cloud"}</button> : <button className="button primary" onClick={openCloud}>Connect private logbook</button>}
        <button className="button secondary" onClick={() => downloadJSON("tightlines-field-book.json", data)}><Download size={15} />Export backup</button>
        <button className="text-button" onClick={() => fileRef.current.click()}>Import backup</button>
        {cloud.key && <button className="text-button" disabled={book.busy} onClick={() => setLoadConfirm(true)}>Load saved copy</button>}
        <input ref={fileRef} hidden type="file" accept=".json,application/json" aria-label="Import field-book backup" onChange={importFile} />
      </div>
      {loadConfirm && <div className="notice-strip compact"><div><p>Loading replaces this tab's field book, including any active session. Export your draft first if you want to keep it.</p><div className="button-row"><button className="button secondary" onClick={() => { book.load(); setLoadConfirm(false); }}>Replace with saved copy</button><button className="text-button" onClick={() => setLoadConfirm(false)}>Cancel</button></div></div></div>}
      {restore && <div className="notice-strip compact"><div><p>Backup contains {restore.flies.length} fly patterns{restore.session ? " and an active session" : ""}. Importing replaces this tab's field book, not the catch journal or cloud copy.</p><div className="button-row"><button className="button secondary" onClick={() => { change(restore); setRestore(null); setNotice("Backup imported. Save to cloud when ready."); }}>Replace with backup</button><button className="text-button" onClick={() => setRestore(null)}>Cancel</button></div></div></div>}
      {cloud.key && book.revision === null && <p className="small muted">A cloud revision is needed before saving. If a saved field book already exists, export this draft first, then choose Load saved copy.</p>}
      {book.message && <p className="inline-success" role="status">{book.message}</p>}
      {notice && <p className="inline-success" role="status">{notice}</p>}
      {localError && <p className="inline-error" role="alert">{localError}</p>}
    </section>
  </>;
}

function Session({ session: s, flies, change, start, log, onSaveLog, setNotice }) {
  const [selected, setSelected] = useState(VENUES[0].id), [fly, setFly] = useState(s?.fly || ""), [now, setNow] = useState(Date.now()), [finishing, setFinishing] = useState(false);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const venue = VENUES.find(v => v.id === s?.venueId), duration = elapsedMs(s, now), fish = s?.events.filter(e => e.type === "catch").length || 0, missed = s?.events.filter(e => e.type === "missed").length || 0;
  function update(fn) { change(d => ({ ...d, session: fn(d.session) })); }
  function event(type) {
    if (!s || s.events.length >= 500) return;
    update(old => ({ ...old, fly: type === "fly" ? fly.trim().slice(0, 120) : old.fly, events: [...old.events, { id: crypto.randomUUID(), type, at: Date.now(), fly: type === "fly" ? fly.trim().slice(0, 120) : old.fly }] }));
  }
  function finish() {
    const durationMinutes = Math.round(elapsedMs(s) / 60000 * 10) / 10;
    const caught = s.events.filter(e => e.type === "catch");
    const used = [...new Set(caught.map(e => e.fly).filter(Boolean))];
    const record = { id: s.id, venueId: venue.id, venueName: venue.name, date: londonDate(new Date(s.startedAt)), fish: String(fish), fly: used.join(", ").slice(0, 120), best: "", line: "", durationMinutes, missedTakes: missed, note: `Timed session: ${durationMinutes} minutes; ${missed} missed takes. ${s.events.filter(e => e.type === "fly").length} fly changes.`, score: null, cond: null };
    if (!log.some(l => l.id === s.id)) onSaveLog([record, ...log]);
    change(d => ({ ...d, session: null })); setFinishing(false);
    setNotice("Session added to your catch journal, including fishing time. Save this field-book checkpoint to clear the active session on your other devices.");
  }
  if (!s) return <div className="session-start panel"><div className="session-start-copy"><Timer size={30} /><h2>Less tapping. More fishing.</h2><p>Record catches, missed takes and fly changes as they happen. Pauses do not count towards fishing effort, and blank sessions matter too.</p><p className="small muted">Session controls record your activity; starting is not a recommendation that conditions or access are suitable.</p></div><div><label className="field-label">Where are you fishing?<select value={selected} onChange={e => setSelected(e.target.value)}>{VENUES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label><button className="button primary" onClick={() => start(selected)}><Play size={17} />Start fishing</button></div></div>;
  return <div className="session-grid">
    <section className="panel session-console"><div className="section-heading"><div><p className="eyebrow">{s.running ? "SESSION RUNNING" : "SESSION PAUSED"}</p><h2>{venue?.name}</h2></div><button className="button secondary" onClick={() => { update(old => ({ ...old, elapsed: elapsedMs(old), lastStarted: Date.now(), running: !old.running })); setNow(Date.now()); }}>{s.running ? <Pause size={17} /> : <Play size={17} />}{s.running ? "Pause" : "Resume"}</button></div>
      <div className="session-clock" aria-label="Fishing duration">{String(Math.floor(duration / 3600000)).padStart(2, "0")}<span>:</span>{String(Math.floor(duration / 60000) % 60).padStart(2, "0")}<small>{String(Math.floor(duration / 1000) % 60).padStart(2, "0")}</small></div>
      <p className="small muted">Active fishing time · pauses excluded</p>
      <div className="session-counts"><div><b>{fish}</b><span>fish landed</span></div><div><b>{missed}</b><span>missed takes</span></div><div><b>{duration >= 60000 ? (fish / (duration / 3600000)).toFixed(1) : "—"}</b><span>fish / hour</span></div></div>
      <div className="session-buttons"><button className="button primary" disabled={!s.running || s.events.length >= 500} onClick={() => event("catch")}><Fish size={23} />Fish landed +1</button><button className="button secondary" disabled={!s.running || s.events.length >= 500} onClick={() => event("missed")}>Missed take +1</button></div>
      <p className="small muted">Current fly: {s.fly || "not recorded"}</p>
      <div className="button-row"><button className="text-button" disabled={!s.events.length} onClick={() => update(old => { const events = old.events.slice(0, -1); return { ...old, events, fly: [...events].reverse().find(e => e.type === "fly")?.fly || "" }; })}><Undo2 size={16} />Undo last event</button><button className="button secondary" onClick={() => setFinishing(true)}>Finish & save journal</button></div>
      {finishing && <div className="notice-strip compact"><div><p>Finish with {fish} fish and {missed} missed takes? A zero-catch trip will be saved as a blank session. No forecast will be presented as an on-site measurement.</p><div className="button-row"><button className="button primary" onClick={finish}>Confirm finish</button><button className="text-button" onClick={() => setFinishing(false)}>Keep fishing</button></div></div></div>}
    </section>
    <aside className="panel"><h2>What is on your leader?</h2><label className="field-label field-spacing">Fly pattern<input value={fly} list="owned-flies" maxLength={120} onChange={e => setFly(e.target.value)} placeholder="Choose or enter a pattern" /><datalist id="owned-flies">{flies.filter(f => f.quantity > 0).map(f => <option key={f.id} value={`${f.name}${f.size ? ` #${f.size}` : ""}`} />)}</datalist></label><button className="button secondary" disabled={!fly.trim() || !s.running || s.events.length >= 500} onClick={() => event("fly")}>Record fly change</button>
      <h3 className="field-spacing">Session timeline</h3><ol className="event-list">{[...s.events].reverse().slice(0, 12).map(e => <li key={e.id}><time>{new Date(e.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}</time><span>{e.type === "catch" ? "Fish landed" : e.type === "missed" ? "Missed take" : "Changed fly"}<small>{e.fly || "Fly not recorded"}</small></span></li>)}</ol>{!s.events.length && <p className="empty-inline">Your first cast is a good place to start.</p>}
    </aside>
  </div>;
}

function FlyInventory({ flies, change, month }) {
  const [draft, setDraft] = useState({ name: "", size: "", colour: "", quantity: 3 }), [error, setError] = useState(""), [remove, setRemove] = useState(null);
  const guide = MONTH_GUIDE[month] || MONTH_GUIDE[0], suggestions = [...guide.flies, ...guide.lures];
  const matching = f => suggestions.some(s => s.toLowerCase().includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(s.split("(")[0].trim().toLowerCase()));
  function add(e) {
    e.preventDefault();
    if (!draft.name.trim() || !Number.isInteger(+draft.quantity) || +draft.quantity < 0 || +draft.quantity > 999 || flies.length >= 200) { setError("Enter a pattern and whole-number quantity from 0 to 999 (up to 200 patterns)."); return; }
    change(d => ({ ...d, flies: [...d.flies, { ...draft, name: draft.name.trim(), quantity: +draft.quantity, id: crypto.randomUUID() }] }));
    setDraft({ name: "", size: "", colour: "", quantity: 3 }); setError("");
  }
  return <div className="inventory-layout"><section className="panel">
    <div className="section-heading"><div><p className="eyebrow">PACK WHAT YOU ACTUALLY OWN</p><h2>Your fly box</h2></div><Package size={24} /></div>
    <p className="small muted">Quantities are yours to manage. A catch does not automatically use up a fly.</p>
    {!flies.length && <div className="empty-state"><Package size={32} /><h3>A good box starts with one fly.</h3><p>Add your patterns, sizes and colours. The coach can then make suggestions from your own tackle rather than an imaginary shopping list.</p></div>}
    {flies.map(f => <div className="inventory-row" key={f.id}><div><strong>{f.name}</strong><small>{[f.size && `Size ${f.size}`, f.colour].filter(Boolean).join(" · ") || "Size / colour not recorded"}</small>{matching(f) && f.quantity > 0 && <span className="data-pill">Seasonal name match</span>}</div><div className="quantity-controls"><button className="icon-button" aria-label={`Use one ${f.name}`} disabled={f.quantity === 0} onClick={() => change(d => ({ ...d, flies: d.flies.map(x => x.id === f.id ? { ...x, quantity: x.quantity - 1 } : x) }))}><Minus size={14} /></button><b>{f.quantity}</b><button className="icon-button" aria-label={`Add one ${f.name}`} disabled={f.quantity >= 999} onClick={() => change(d => ({ ...d, flies: d.flies.map(x => x.id === f.id ? { ...x, quantity: x.quantity + 1 } : x) }))}><Plus size={14} /></button><button className="icon-button" aria-label={`Remove ${f.name}`} onClick={() => setRemove(f.id)}><Trash2 size={14} /></button></div>{remove === f.id && <div className="inventory-confirm"><span>Remove this pattern?</span><button className="text-button" onClick={() => { change(d => ({ ...d, flies: d.flies.filter(x => x.id !== f.id) })); setRemove(null); }}>Remove pattern</button><button className="text-button" onClick={() => setRemove(null)}>Cancel</button></div>}</div>)}
    <p className="small muted field-spacing">Seasonal matches use pattern-name matching against the monthly guide, not live hatch reports or an AI prediction.</p>
  </section><aside><form className="panel" onSubmit={add}><h2>Add a pattern</h2><label className="field-label field-spacing">Pattern name<input value={draft.name} maxLength={120} required onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Diawl Bach" /></label><div className="form-grid"><label className="field-label">Hook size<input value={draft.size} maxLength={20} onChange={e => setDraft({ ...draft, size: e.target.value })} placeholder="12" /></label><label className="field-label">Quantity<input type="number" min="0" max="999" step="1" value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: e.target.value })} /></label></div><label className="field-label">Colour<input value={draft.colour} maxLength={40} onChange={e => setDraft({ ...draft, colour: e.target.value })} placeholder="Black / olive" /></label>{error && <p className="inline-error" role="alert">{error}</p>}<button className="button primary" type="submit"><Plus size={16} />Add to my box</button></form><div className="panel field-spacing"><p className="eyebrow">SEASONAL IDEAS</p><h3 className="field-spacing">{guide.headline}</h3><p className="small muted field-spacing">{suggestions.slice(0, 5).join(" · ")}</p></div></aside></div>;
}

function Coach({ cloud, openCloud, plan, shortlist, flies, log }) {
  const [status, setStatus] = useState(null), [water, setWater] = useState("shortlist"), [question, setQuestion] = useState("Which of these waters best fits my plan, and what should I try first?"), [consent, setConsent] = useState(false), [includeBox, setIncludeBox] = useState(false), [includeJournal, setIncludeJournal] = useState(false), [busy, setBusy] = useState(false), [answer, setAnswer] = useState(null), [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => { api("/ai/status").then(setStatus).catch(() => setStatus({ enabled: false })); return () => controller.current?.abort(); }, []);
  const ids = water === "shortlist" ? shortlist.map(x => x.v.id) : [water];
  async function ask(e) {
    e?.preventDefault(); setBusy(true); setError(""); setAnswer(null);
    controller.current = new AbortController();
    try {
      const result = await api("/ai/brief", { key: cloud.key, signal: controller.current.signal, body: { question, venueIds: ids, date: plan.date, hours: `${hours(plan.start)}–${hours(plan.end)} UK time`, consent, includeInventory: includeBox, inventory: includeBox ? flies : [], includeJournal, journal: includeJournal ? [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20) : [] } });
      setAnswer({ ...result, question, date: plan.date });
    } catch (e) { if (e.name !== "AbortError") setError(e.message); }
    finally { setBusy(false); }
  }
  return <div className="coach-layout"><section className="panel coach-main">
    <div className="section-heading"><div><p className="eyebrow"><Sparkles size={16} /> TIGHTLINES COACH</p><h2>A second pair of eyes on your plan.</h2></div><span className={`data-pill ${status?.enabled ? "" : "warning"}`}>{status === null ? "Checking…" : status.enabled ? "AI connected" : "Not connected here"}</span></div>
    <p className="small muted">Ask about your selected water, the forecast or your own patterns. Every question is standalone; the coach does not browse the web or remember previous conversations.</p>
    <div className="prompt-chips">{["What should I try from my fly box?", "Explain the forecast and any reasons not to go.", "What can my recent journal actually tell us?"].map(p => <button key={p} onClick={() => setQuestion(p)}>{p}</button>)}</div>
    <form onSubmit={ask}>
      <label className="field-label">Evidence to use<select value={water} onChange={e => setWater(e.target.value)}><option value="shortlist">My planner shortlist ({shortlist.length} waters)</option>{VENUES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
      <label className="field-label">Your question<textarea maxLength={1200} required value={question} onChange={e => setQuestion(e.target.value)} /></label>
      <p className="small muted">For {dateLabel(plan.date)} · {hours(plan.start)}–{hours(plan.end)}. Change date and hours in Trip planner.</p>
      <div className="coach-permissions"><label><input type="checkbox" checked={includeBox} onChange={e => setIncludeBox(e.target.checked)} />Include my fly box ({flies.length} patterns)</label><label><input type="checkbox" checked={includeJournal} onChange={e => setIncludeJournal(e.target.checked)} />Include up to 20 recent catches (no notes or photos)</label></div>
      <label className="consent-label"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>Send my question, selected water forecasts and checked optional data to the AI provider for this answer. Do not put secrets or other people's personal information in the question.</span></label>
      {!cloud.key && <p className="small muted">Connect a private logbook to use the coach. A test-preview key is separate from your live-site key.</p>}
      {status && !status.enabled && <p className="inline-error">The interface is ready, but this host has no AI provider connection. No canned answer will be passed off as AI.</p>}
      {!ids.length && <p className="small muted">Your shortlist is empty. Select a specific water above or adjust the trip planner.</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="button-row"><button type="submit" className="button primary" disabled={busy || !cloud.key || !status?.enabled || !consent || !question.trim() || !ids.length}><Send size={16} />{busy ? "Reviewing the evidence…" : "Ask the coach"}</button>{!cloud.key && <button type="button" className="button secondary" onClick={openCloud}>Connect logbook</button>}{busy && <button type="button" className="text-button" onClick={() => controller.current?.abort()}>Stop waiting</button>}</div>
    </form>
    {busy && <p className="small muted" role="status">Fetching a fresh forecast and preparing advice. This may take up to a minute; cancelling stops waiting but may not stop provider processing.</p>}
    {answer && <article className="coach-answer" aria-live="polite"><p className="eyebrow">AI-GENERATED · {dateLabel(answer.date)}</p><h3>{answer.question}</h3>{answer.warnings?.map((w, i) => <p className="inline-error" key={i}>{w}</p>)}<div className="coach-text">{answer.answer}</div><p className="small muted">Included: {answer.inventoryCount} patterns · {answer.journalCount} journal entries. Review advice against the evidence; AI can make mistakes.</p><details className="coach-evidence" open><summary>Evidence supplied to this answer</summary>{answer.sources.map(s => s.url ? <a key={s.id} href={s.url} target="_blank" rel="noreferrer"><span>[{s.id}] {s.title}</span><small>{s.at ? `Data / review time: ${s.at}` : "Catalogue information, not a live check"}</small></a> : <p key={s.id} className="evidence-local">[{s.id}] {s.title}</p>)}</details></article>}
  </section><aside className="panel coach-boundaries"><ShieldCheck size={28} /><p className="eyebrow field-spacing">INFORMED, NOT INFALLIBLE</p><h2>Advice with its working visible.</h2><ul><li><b>Fresh evidence</b><span>Server-fetched forecasts and dated, curated notices. Missing data stays missing.</span></li><li><b>Your choice</b><span>Your journal and inventory are optional. No private logbook key is sent to the model.</span></li><li><b>Clear limits</b><span>No guaranteed catches, invented stocking reports, booking claims or safety assurances.</span></li><li><b>Controlled use</b><span>10 requests per logbook and 40 total per day on this test release. Failed provider attempts count.</span></li></ul><p className="small muted">Answers are not saved by TightLines. Response storage is disabled in the API request, but the provider's own retention and processing terms still apply.</p></aside></div>;
}
