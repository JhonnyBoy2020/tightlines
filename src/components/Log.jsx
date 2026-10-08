import React, { useMemo, useState } from "react";
import { C, F, panel, PRESS } from "../theme.js";
import { Label, Stat, Btn } from "./ui.jsx";

const input = { border: `1px solid ${C.line2}`, background: "rgba(255,255,255,0.04)", color: C.text, borderRadius: 10, padding: "11px 12px", fontSize: 16, fontFamily: F.body, outline: "none", width: "100%" };

/* Session form — conditions are captured automatically from the forecast */
export function LogForm({ venue, day, moon, defaultDate, onSave, onCancel, flies, hasLive }) {
  const [f, setF] = useState({ fish: "", best: "", fly: "", line: "", note: "", date: defaultDate });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const cond = hasLive ? {
    press: day.pMean ? Math.round(day.pMean) : null, trend: day.press, water: Math.round(day.result.water), wind: day.wind, dir: day.dir,
    cloud: day.cloud, hi: day.hi, moon: moon ? moon.name : null, source: "Forecast model, not observed on site",
  } : null;
  function save() {
    if (!/^\d+$/.test(f.fish) || Number(f.fish) > 9999) { setError("Enter a whole number of fish from 0 to 9999, including 0 for a blank session."); return; }
    onSave({ id: crypto.randomUUID(), venueId: venue.id, venueName: venue.name, date: f.date, fish: f.fish, best: f.best, fly: f.fly, line: f.line, note: f.note, score: hasLive ? day.result.score : null, cond });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label>New session · {f.date}</Label>
      <input aria-label="Fish caught" type="number" min="0" max="9999" step="1" inputMode="numeric" value={f.fish} onChange={set("fish")} placeholder="Fish caught (number)" style={input} />
      <input aria-label="Best fish" value={f.best} onChange={set("best")} placeholder="Best fish (e.g. 4lb rainbow)" style={input} />
      <input aria-label="Fly that worked" list="tl-flies" value={f.fly} onChange={set("fly")} placeholder="Fly that worked" style={input} />
      <datalist id="tl-flies">{flies.map((x) => <option key={x} value={x} />)}</datalist>
      <input aria-label="Line and depth" value={f.line} onChange={set("line")} placeholder="Line / depth (e.g. Di-3, 10ft)" style={input} />
      <input aria-label="Session notes" value={f.note} onChange={set("note")} placeholder="Notes" style={input} />
      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
        {cond ? `FORECAST SNAPSHOT (NOT OBSERVED): ${cond.press || "—"} hPa · WATER ESTIMATE ~${cond.water}°C · ${cond.dir} ${cond.wind} MPH · ${cond.cloud}% CLOUD` : "No live forecast: sample conditions will not be saved to your journal."}
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={save} style={{ flex: 1, border: "none", cursor: "pointer", background: C.text, color: C.bg, borderRadius: 10, padding: "12px 0", fontWeight: 700 }}>Save</button>
        <button onClick={onCancel} style={{ flex: 1, border: `1px solid ${C.line2}`, cursor: "pointer", background: "transparent", color: C.text, borderRadius: 10, padding: "12px 0", fontWeight: 600 }}>Cancel</button>
      </div>
    </div>
  );
}

export function LogEntry({ l, onDelete, showVenue }) {
  return (
    <div style={{ ...panel, padding: "11px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 13, lineHeight: 1.45, minWidth: 0 }}>
        {showVenue && <><b>{l.venueName}</b> · </>}<b>{l.date}</b> · {l.fish} fish{l.best ? ` · best ${l.best}` : ""}
        {(l.fly || l.line) && <><br /><span style={{ color: C.cyan }}>{[l.fly, l.line].filter(Boolean).join(" · ")}</span></>}
        {l.note ? <><br /><span style={{ color: C.muted }}>{l.note}</span></> : null}
        {l.durationMinutes > 0 && <><br /><span style={{ color: C.muted }}>{l.durationMinutes} minutes fishing · {(Number(l.fish) / (l.durationMinutes / 60)).toFixed(1)} fish/hour · {l.missedTakes || 0} missed takes</span></>}
        {l.cond && <><br /><span style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{l.cond.press ? `${l.cond.press}hPa ${PRESS[l.cond.trend]?.glyph || ""} · ` : ""}{l.cond.water}°C water · {l.cond.dir}{l.cond.wind} · {l.cond.cloud}% cld</span></>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>{l.score == null ? "No forecast" : `model ${l.score}`}</span>
        <button aria-label="Delete session" onClick={() => { if (window.confirm("Delete this session? If connected, this deletion syncs to your other devices.")) onDelete(l.id); }} style={{ border: "none", cursor: "pointer", background: "transparent", color: C.poor, fontSize: 18 }}>×</button>
      </div>
    </div>
  );
}

function toCsv(log) {
  const cols = ["date", "venueName", "fish", "best", "fly", "line", "note", "durationMinutes", "missedTakes", "score", "press", "trend", "water", "wind", "dir", "cloud", "moon"];
  const esc = (v) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rows = log.map((l) => cols.map((c) => esc(l[c] ?? l.cond?.[c])).join(","));
  return [cols.join(","), ...rows].join("\n");
}

/* Whole-log screen with personal insights */
export default function LogScreen({ log, onDelete, onOpenVenue }) {
  const stats = useMemo(() => {
    const n = log.length, fish = log.reduce((a, l) => a + (parseInt(l.fish, 10) || 0), 0);
    const by = (keyFn) => {
      const m = {};
      log.forEach((l) => { const k = keyFn(l); if (!k) return; m[k] = m[k] || { k, s: 0, f: 0 }; m[k].s++; m[k].f += parseInt(l.fish, 10) || 0; });
      return Object.values(m).map((x) => ({ ...x, avg: Math.round((x.f / x.s) * 10) / 10 })).sort((a, b) => b.avg - a.avg || b.s - a.s);
    };
    const blanks = log.filter((l) => !(parseInt(l.fish, 10) > 0)).length;
    // Was the app right? compare score vs catch
    const good = log.filter((l) => l.score != null && l.score >= 7), poor = log.filter((l) => l.score != null && l.score < 4.5);
    const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, l) => a + (parseInt(l.fish, 10) || 0), 0) / arr.length) * 10) / 10 : null);
    return {
      n, fish, avg: n ? Math.round((fish / n) * 10) / 10 : 0, blanks,
      flies: by((l) => l.fly && l.fly.trim()).slice(0, 5), venues: by((l) => l.venueName).slice(0, 5),
      trend: by((l) => l.cond && PRESS[l.cond.trend]?.label), goodAvg: avg(good), poorAvg: avg(poor),
    };
  }, [log]);

  function exportCsv() {
    const blob = new Blob([toCsv(log)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "pocket-ghillie-log.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  if (!log.length) return (
    <div style={{ ...panel, padding: 24, textAlign: "center" }}>
      <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 800 }}>No sessions yet</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>Open a water and tap Log to record a trip. Pocket Ghillie saves the pressure, wind, cloud, water estimate and moon with each session, so over time you'll see what really works for you.</div>
    </div>
  );

  const Bars = ({ rows, unit = "fish/session" }) => {
    const max = Math.max(...rows.map((r) => r.avg), 1);
    return rows.map((r) => (
      <div key={r.k} style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{r.k}</span><span style={{ fontFamily: F.mono, color: C.muted }}>{r.avg} {unit} · {r.s}×</span></div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginTop: 4 }}><div style={{ width: `${(r.avg / max) * 100}%`, height: "100%", background: C.cyan, borderRadius: 3 }} /></div>
      </div>
    ));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 800 }}>Your log</div>
        <Btn onClick={exportCsv}>Export CSV</Btn>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Stat k="Sessions" v={stats.n} />
        <Stat k="Fish" v={stats.fish} />
        <Stat k="Per trip" v={stats.avg} sub={`${stats.blanks} blank${stats.blanks === 1 ? "" : "s"}`} />
      </div>
      {stats.flies.length > 0 && <div style={{ ...panel, padding: 16 }}><Label>Your best flies</Label><Bars rows={stats.flies} /></div>}
      {stats.trend.length > 0 && <div style={{ ...panel, padding: 16 }}><Label>Catch rate by barometer</Label><Bars rows={stats.trend} /></div>}
      {stats.venues.length > 1 && <div style={{ ...panel, padding: 16 }}><Label>Best waters</Label><Bars rows={stats.venues} /></div>}
      {(stats.goodAvg != null || stats.poorAvg != null) && (
        <div style={{ ...panel, padding: 16, fontSize: 14, lineHeight: 1.5 }}>
          <Label>Is the score right for you?</Label>
          <div style={{ marginTop: 8 }}>
            {stats.goodAvg != null && <>On "Go fishing" days you average <b style={{ color: C.go }}>{stats.goodAvg}</b> fish. </>}
            {stats.poorAvg != null && <>On "Stay home" days, <b style={{ color: C.poor }}>{stats.poorAvg}</b>.</>}
          </div>
        </div>
      )}
      <Label style={{ marginTop: 6 }}>All sessions</Label>
      {log.map((l) => <div key={l.id} onDoubleClick={() => onOpenVenue(l.venueId)}><LogEntry l={l} onDelete={onDelete} showVenue /></div>)}
    </div>
  );
}
