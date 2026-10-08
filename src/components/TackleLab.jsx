import React, { useEffect, useRef, useState } from "react";
import { Camera, Search, Package, Plus, Check, Ruler, X, Sparkles, Trash2 } from "lucide-react";
import { TACKLE, tackleById } from "../data/tackle.js";
import { api } from "../lib/cloud.js";
import { measurePhoto } from "../lib/measurement.js";

export function PhotoCredit({ tackle: t }) {
  return <p className="photo-credit"><a href={t.photoSource} target="_blank" rel="noreferrer">Photo: {t.author}</a> · {t.licenseUrl ? <a href={t.licenseUrl} target="_blank" rel="noreferrer">{t.license}</a> : t.license} · resized, no pattern alterations. <a href={t.source} target="_blank" rel="noreferrer">Pattern & size reference</a>.</p>;
}
export function TackleCatalogue({ onChoose }) {
  const [query, setQuery] = useState(""), [category, setCategory] = useState("All"), [detail, setDetail] = useState(null);
  const detailRef = useRef(null);
  useEffect(() => { if (detail) { detailRef.current?.scrollIntoView({ block: "start" }); detailRef.current?.focus({ preventScroll: true }); } }, [detail]);
  const items = TACKLE.filter(t => (category === "All" || t.category === category) && `${t.name} ${t.features} ${t.colour}`.toLowerCase().includes(query.toLowerCase()));
  return <section>
    <div className="section-heading"><div><p className="eyebrow">THE VISUAL TACKLE LIBRARY</p><h2>Know what you are tying on.</h2></div><span className="data-pill">6 photographed patterns</span></div>
    <p className="small muted field-spacing">Real photographs of example dressings, not life-size images. A starter library, not every UK pattern. Colours and hook lengths vary; never infer your hook number from a photo.</p>
    <div className="tackle-filters"><label className="field-label"><span><Search size={15} /> Find a pattern</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Try streamer, tail or brown" /></label><label className="field-label">Family<select value={category} onChange={e => setCategory(e.target.value)}>{["All", "Lure / streamer", "Nymph", "Dry fly"].map(c => <option key={c}>{c}</option>)}</select></label></div>
    <div className="tackle-grid">{items.map(t => <article className="panel tackle-card" key={t.id}>
      <button className="tackle-photo" onClick={() => setDetail(t)} aria-label={`Inspect ${t.name}`}><img src={t.image} alt={`${t.name}: ${t.features}`} loading="lazy" /><span>Inspect pattern</span></button>
      <div className="tackle-card-copy"><p className="eyebrow">{t.category}</p><h3>{t.name}</h3><p className="small">{t.features}</p><p className="small muted">{t.sizes}</p><div className="button-row"><button className="button secondary" onClick={() => onChoose(t)}><Plus size={15} />Add to my box</button><button className="text-button" onClick={() => setDetail(t)}>Details</button></div><PhotoCredit tackle={t} /></div>
    </article>)}</div>
    {!items.length && <p className="empty-inline">No photo in this starter library matches. Try a broader search, add a pattern manually, or use the camera.</p>}
    {detail && <div ref={detailRef} className="tackle-detail panel" role="region" aria-label={`${detail.name} details`} tabIndex="-1">
      <div className="section-heading"><h2>{detail.name}</h2><button className="icon-button" aria-label="Close pattern detail" onClick={() => setDetail(null)}><X size={18} /></button></div>
      <img className="tackle-enlarged" src={detail.image} alt={detail.name} /><p>{detail.features}</p><p>{detail.use}</p><p className="small muted">{detail.sizes}. This is a typical range, not the size of your fly or a universal conversion to millimetres.</p><a href={detail.source} target="_blank" rel="noreferrer">Pattern description and size reference</a><PhotoCredit tackle={detail} />
    </div>}
  </section>;
}
export default function TackleLab({ flies, change, cloud, openCloud, session }) {
  const [mode, setMode] = useState("library"), [draft, setDraft] = useState(null), [message, setMessage] = useState(""), [remove, setRemove] = useState(null);
  function choose(t) { setDraft({ name: t.name, colour: t.colour, size: "", quantity: 1, catalogueId: t.id || "", lengthMm: null }); setMessage(""); setMode("box"); }
  function save(e) {
    e.preventDefault();
    if (!draft.name.trim() || flies.length >= 200 || !Number.isInteger(+draft.quantity) || +draft.quantity < 0 || +draft.quantity > 999) { setMessage("Enter a name and whole-number quantity 0–999. The box holds 200 patterns."); return; }
    const item = { id: crypto.randomUUID(), name: draft.name.trim().slice(0, 120), size: draft.size.trim().slice(0, 20), colour: draft.colour.slice(0, 40), quantity: +draft.quantity, ...(draft.catalogueId ? { catalogueId: draft.catalogueId } : {}), ...(draft.lengthMm ? { lengthMm: draft.lengthMm, lengthMethod: "user-calibrated photo estimate" } : {}) };
    change(d => ({ ...d, flies: [...d.flies, item] })); setDraft(null); setMessage("Added to this tab's fly box. Save to cloud or export your field book before closing."); 
  }
  function wear(f) {
    if (!session?.running || session.events.length >= 500) { setMessage("Start or resume a session in the Session tab before selecting your leader. No fly change was recorded."); return; }
    change(d => {
      if (!d.session || !d.session.running || d.session.events.length >= 500) return d;
      const fly = `${f.name}${f.size ? ` #${f.size}` : ""}`.slice(0, 120);
      return { ...d, session: { ...d.session, fly, events: [...d.session.events, { id: crypto.randomUUID(), type: "fly", at: Date.now(), fly }] } };
    });
    setMessage("Fly selected for your running session. Open Session to check your leader and timeline.");
  }
  return <div className="tackle-lab">
    <div className="segmented tackle-modes">{[["library", "Photo library", Search], ["box", `My box (${flies.length})`, Package], ["camera", "Camera & measure", Camera]].map(([id, label, Icon]) => <button key={id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}><Icon size={17} />{label}</button>)}</div>
    {message && <p className="inline-success" role="status">{message}</p>}
    {mode === "library" && <TackleCatalogue onChoose={choose} />}
    {mode === "camera" && <CameraLab cloud={cloud} openCloud={openCloud} onConfirm={value => { setDraft({ ...value, quantity: 1, size: "" }); setMode("box"); }} />}
    {mode === "box" && <>
      <div className="section-heading"><div><p className="eyebrow">YOUR ACTUAL TACKLE</p><h2>Ready for the next cast.</h2></div><button className="button secondary" onClick={() => choose({ name: "", colour: "" })}><Plus size={16} />Add manually</button></div>
      {draft && <form className="panel tackle-edit" onSubmit={save}><h3>Check before adding</h3><p className="small muted">Photo matching is not proof of a pattern or size. Edit the identification and leave hook size blank if unknown.</p><div className="form-grid"><label className="field-label">Pattern name<input required maxLength={120} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label><label className="field-label">Colour<input maxLength={40} value={draft.colour} onChange={e => setDraft({ ...draft, colour: e.target.value })} /></label><label className="field-label">Hook number (if known)<input maxLength={20} placeholder="Unknown, or packet size e.g. 12" value={draft.size} onChange={e => setDraft({ ...draft, size: e.target.value })} /></label><label className="field-label">Quantity<input type="number" min="0" max="999" step="1" value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: e.target.value })} /></label></div>{draft.lengthMm && <p>Photo estimate: {draft.lengthMm} mm between your marks. Not a hook number.</p>}<div className="button-row"><button className="button primary"><Check size={16} />Confirm & add</button><button type="button" className="text-button" onClick={() => setDraft(null)}>Cancel</button></div></form>}
      {!flies.length && !draft && <div className="panel empty-state"><Package size={32} /><h3>Your own box starts here.</h3><p>Choose a photographed pattern or add your own. We will not assume that a suggested fly is one you own.</p><button className="button secondary" onClick={() => setMode("library")}>Browse photos</button></div>}
      <div className="tackle-grid">{flies.map(f => { const t = tackleById(f.catalogueId); return <article className="panel owned-card" key={f.id}>{t ? <img src={t.image} alt={`${f.name}: catalogue example, not your actual fly`} /> : <div className="no-photo"><Camera size={26} /><span>No catalogue photo</span></div>}<div><h3>{f.name}</h3><p className="small muted">{f.size ? `Hook #${f.size}` : "Hook number unknown"} · {f.colour || "Colour not recorded"}{f.lengthMm ? ` · ~${f.lengthMm} mm photo estimate` : ""}</p><label className="field-label">Quantity owned<input type="number" min="0" max="999" value={f.quantity} onChange={e => { const n = +e.target.value; if (Number.isInteger(n) && n >= 0 && n <= 999) change(d => ({ ...d, flies: d.flies.map(x => x.id === f.id ? { ...x, quantity: n } : x) })); }} /></label><div className="button-row"><button className="button secondary" disabled={!f.quantity} onClick={() => wear(f)}>Use in running session</button><button className="icon-button" aria-label={`Remove ${f.name}`} onClick={() => setRemove(f.id)}><Trash2 size={16} /></button></div>{remove === f.id && <div><p>Remove this pattern from your box?</p><button className="text-button" onClick={() => { change(d => ({ ...d, flies: d.flies.filter(x => x.id !== f.id) })); setRemove(null); }}>Confirm removal</button><button className="text-button" onClick={() => setRemove(null)}>Cancel</button></div>}{t && <PhotoCredit tackle={t} />}</div></article>; })}</div>
      <p className="small muted field-spacing">Catalogue photographs illustrate a pattern, not your individual tackle. Quantities do not decrease when you catch a fish. Save a cloud checkpoint below to sync changes.</p>
    </>}
  </div>;
}
function CameraLab({ cloud, openCloud, onConfirm }) {
  const [photo, setPhoto] = useState(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [result, setResult] = useState(null), [consent, setConsent] = useState(false), [points, setPoints] = useState([]), [reference, setReference] = useState(50), [plane, setPlane] = useState(false), [status, setStatus] = useState(null);
  const request = useRef(null), version = useRef(0);
  useEffect(() => { api("/ai/status").then(setStatus).catch(() => setStatus({ enabled: false })); return () => { version.current++; request.current?.abort(); }; }, []);
  const length = photo && plane ? measurePhoto(points, +reference, photo.width, photo.height) : null;
  async function upload(e) {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    const generation = ++version.current; request.current?.abort(); setBusy(false); setError(""); setResult(null); setPhoto(null); setPoints([]); setPlane(false); setConsent(false);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) { setError("Choose a JPEG, PNG or WebP up to 15 MB. If your phone offers HEIC only, export a JPEG first."); return; }
    let url;
    try {
      url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
      const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      let data = c.toDataURL("image/jpeg", .82);
      if (data.length > 1800000) data = c.toDataURL("image/jpeg", .55);
      if (data.length > 1800000) throw new Error("Photo is still too large. Crop closer to the tackle and try again.");
      if (generation === version.current) setPhoto({ data, width: c.width, height: c.height });
    } catch (e) { if (generation === version.current) setError(e.message || "This image could not be read."); }
    finally { if (url) URL.revokeObjectURL(url); }
  }
  async function identify() {
    const generation = version.current; setBusy(true); setError(""); setResult(null); request.current = new AbortController();
    try { const r = await api("/ai/identify", { key: cloud.key, signal: request.current.signal, body: { image: photo.data, consent } }); if (generation === version.current) setResult(r); }
    catch (e) { if (e.name !== "AbortError" && generation === version.current) setError(e.message); }
    finally { if (generation === version.current) setBusy(false); }
  }
  function clear() { version.current++; request.current?.abort(); setPhoto(null); setResult(null); setPoints([]); setConsent(false); setBusy(false); setError(""); }
  return <div className="camera-layout"><section className="panel"><p className="eyebrow"><Camera size={16} /> TACKLE LENS · BETA</p><h2>A closer look at your fly.</h2><p className="small muted">One fly or lure, side-on, on a plain background. Keep hands, faces, addresses and other private details out of the frame. A sharp photo improves identification.</p>
    <div className="button-row field-spacing"><label className="button primary">Take a photo<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={upload} aria-label="Take a tackle photo" /></label><label className="button secondary">Choose a photo<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} aria-label="Choose a tackle photo" /></label>{photo && <button className="text-button" onClick={clear}>Remove photo</button>}</div>
    {!photo && <div className="camera-empty"><Camera size={40} /><h3>Identify. Measure. Confirm.</h3><p>The camera opens only when you choose it. No photo is sent automatically.</p></div>}
    {photo && <><div className="photo-measure" onClick={e => { if (points.length >= 4) return; const b = e.currentTarget.getBoundingClientRect(); setPoints([...points, { x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) }]); }}><img src={photo.data} alt="Your tackle photo; use the coordinate controls below for keyboard measurement" />{points.map((p, i) => <span className={`measure-dot ${i < 2 ? "reference" : ""}`} key={i} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>{i + 1}</span>)}</div><p className="small muted">Photo stays in this tab until you explicitly request AI analysis. It is not saved to your cloud logbook.</p><label className="consent-label"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Send this resized photo to OpenAI for identification. Metadata is removed by re-encoding, but anything visible remains in the image. Provider retention terms apply.</label><button className="button primary" disabled={!cloud.key || !consent || !status?.enabled || busy} onClick={identify}><Sparkles size={16} />{busy ? "Inspecting your photo…" : "Identify with AI"}</button>{!cloud.key && <button className="text-button" onClick={openCloud}>Connect private logbook</button>}{status && !status.enabled && <p className="small warning-text">AI is not configured on this host. Local measurement still works.</p>}<p className="small muted">Photo identification and briefings share the 10-per-logbook / 40-total daily test allowance. Failed provider attempts count.</p></>}
    {error && <p className="inline-error" role="alert">{error}</p>}
    {result && <article className="lens-result"><p className="eyebrow">AI SUGGESTION · REVIEW REQUIRED</p><h3>{result.name}</h3><p>{result.category} · {result.colour}</p><span className="data-pill">{result.confidence} confidence, not a measured probability</span><ul>{result.features.map((f, i) => <li key={i}>{f}</li>)}</ul>{result.alternatives.length > 0 && <p>Other possibilities: {result.alternatives.join("; ")}</p>}<p>{result.uncertainty}</p><p className="small muted">Exact hook number, weight and brand are not established by this analysis.</p><button className="button secondary" onClick={() => onConfirm({ name: result.name, colour: result.colour, catalogueId: result.catalogueId || "", lengthMm: length })}>Review & add to my box</button></article>}
  </section><aside className="panel measure-panel"><p className="eyebrow"><Ruler size={16} /> CALIBRATED PHOTO MEASUREMENT</p><h2>Millimetres, not guesswork.</h2><p>Put a ruler next to the lure, flat on the same surface. Photograph straight down; avoid an angled camera or raised tackle. The app estimates a straight-line distance between your marks.</p><ol><li>Tap two clear ruler marks: points 1 and 2.</li><li>Enter their actual separation in millimetres.</li><li>Tap the two ends you want to measure: points 3 and 4.</li></ol><label className="field-label">Reference distance (mm)<input type="number" min="1" max="1000" step="0.1" value={reference} onChange={e => setReference(e.target.value)} /></label>
    <p className="small muted">{photo ? `Next: ${["reference start", "reference end", "lure start", "lure end", "all four marks placed"][points.length]}` : "Choose a photo to begin."}</p>
    {photo && <><button className="text-button" onClick={() => setPoints([])}>Reset marks</button><details><summary>Keyboard / fine-position controls</summary>{[0, 1, 2, 3].map(i => <div className="coordinate-row" key={i}><b>{i + 1}</b>{["x", "y"].map(axis => <label key={axis}>Point {i + 1} {axis} %<input type="number" min="0" max="100" step=".1" value={points[i] ? Math.round(points[i][axis] * 1000) / 10 : ""} onChange={e => { const n = Number(e.target.value); if (!Number.isFinite(n) || n < 0 || n > 100) return; const next = [...points]; while (next.length <= i) next.push({ x: .5, y: .5 }); next[i] = { ...next[i], [axis]: n / 100 }; setPoints(next); }} /></label>)}</div>)}</details><label className="consent-label"><input type="checkbox" checked={plane} onChange={e => setPlane(e.target.checked)} />The reference and lure are flat in the same plane, with the camera square to them.</label></>}
    <div className="measurement-value">{length == null ? "—" : `~${length}`}<small>mm</small></div><p className="small muted">{length == null ? "Four separated marks, a valid reference and the alignment check are required." : "User-calibrated photo estimate. Perspective, focus, curved materials and mark placement introduce error. Verify with the ruler."}</p>
    {length != null && <button className="button secondary" onClick={() => onConfirm({ name: result?.name || "", colour: result?.colour || "", catalogueId: result?.catalogueId || "", lengthMm: length })}>Add with this estimate</button>}
    <p className="small muted field-spacing">Hook numbering varies with manufacturer and hook style. We never turn millimetres into an exact hook size. Read the packet or compare against the maker's hook chart. <a href="https://www.theessentialfly.com/fly-tying-hook-comparison-chart.html" target="_blank" rel="noreferrer">Hook comparison guidance</a>.</p><a className="small" href="https://developers.openai.com/api/docs/guides/images-vision" target="_blank" rel="noreferrer">AI vision limitations and image processing</a>
  </aside></div>;
}
