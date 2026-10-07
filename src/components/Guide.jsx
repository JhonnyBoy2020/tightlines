import React, { useState, useEffect, useRef } from "react";
import { C, F, panel } from "../theme.js";
import { Label, Chip } from "./ui.jsx";
import { MONTHS, MONTHS_LONG, TODAY } from "../lib/util.js";
import { MONTH_GUIDE, FOOD_CALENDAR, FLIES, PRESSURE_NOTES, SOURCES } from "../data/guide.js";

const Pills = ({ items, tone }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
    {items.map((f) => <span key={f} style={{ background: tone === "lure" ? C.fairBg : C.cyanBg, color: tone === "lure" ? C.fair : C.cyan, borderRadius: 999, padding: "6px 11px", fontSize: 13, fontWeight: 600 }}>{f}</span>)}
  </div>
);

export function MonthCard({ g, compact }) {
  return (
    <div style={{ ...panel, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <Label color={C.cyan}>{MONTHS_LONG[g.m]} · water {g.water}</Label>
      </div>
      <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 800, marginTop: 6, lineHeight: 1.2 }}>{g.headline}</div>
      <div style={{ marginTop: 14 }}>
        <Label>What's biting</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          {g.biting.map((b) => <div key={b} style={{ fontSize: 14, display: "flex", gap: 8 }}><span style={{ color: C.go }}>●</span>{b}</div>)}
        </div>
      </div>
      <div style={{ marginTop: 14 }}><Label>Imitative flies</Label><Pills items={g.flies} /></div>
      <div style={{ marginTop: 12 }}><Label>Lures & attractors</Label><Pills items={g.lures} tone="lure" /></div>
      {!compact && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginTop: 14 }}>
            {[["Line", g.line], ["Depth", g.depth], ["Retrieve", g.retrieve], ["Best time", g.when]].map(([k, v]) => (
              <div key={k}><div style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>{k.toUpperCase()}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, lineHeight: 1.35 }}>{v}</div></div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {g.tips.map((t, i) => <div key={i} style={{ fontSize: 14, lineHeight: 1.45, paddingLeft: 12, borderLeft: `2px solid ${C.line2}` }}>{t}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

function FoodCalendar({ month, onPick }) {
  const shade = (v) => ["rgba(255,255,255,0.03)", "rgba(79,214,200,0.22)", "rgba(79,214,200,0.5)", C.cyan][v];
  return (
    <div style={{ ...panel, padding: "14px 12px" }}>
      <Label>What trout eat — through the year</Label>
      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 2, width: "100%", tableLayout: "fixed" }}>
          <colgroup><col style={{ width: "34%" }} />{MONTHS.map((m) => <col key={m} />)}</colgroup>
          <thead>
            <tr><th />{MONTHS.map((m, i) => <th key={m} onClick={() => onPick(i)} style={{ cursor: "pointer", fontFamily: F.mono, fontSize: 9, fontWeight: 600, color: i === month ? C.cyan : C.dim, paddingBottom: 4 }}>{m[0]}</th>)}</tr>
          </thead>
          <tbody>
            {FOOD_CALENDAR.map((r) => (
              <tr key={r.k}>
                <td style={{ fontSize: 11, color: C.text, paddingRight: 6, lineHeight: 1.2 }}>{r.k}</td>
                {r.v.map((v, i) => <td key={i} title={`${r.k} · ${MONTHS[i]}`} style={{ height: 16, borderRadius: 3, background: shade(v), outline: i === month ? `1px solid ${C.text}` : "none" }} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 10, color: C.muted, fontFamily: F.mono }}>
        {["none", "some", "good", "peak"].map((t, i) => <span key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: shade(i), display: "inline-block" }} />{t}</span>)}
      </div>
    </div>
  );
}

export default function Guide() {
  const [month, setMonth] = useState(TODAY.getMonth());
  const [ftype, setFtype] = useState("All");
  const [q, setQ] = useState("");
  const strip = useRef(null);
  useEffect(() => { const el = strip.current?.children[TODAY.getMonth()]; if (el) strip.current.scrollLeft = el.offsetLeft - 40; }, []);
  const types = ["All", "Imitative", "Emerger / dry", "Dry", "Lure"];
  const flies = FLIES.filter((f) => (ftype === "All" || f.t.startsWith(ftype)) && (!q || (f.n + f.i).toLowerCase().includes(q.toLowerCase())));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 800 }}>Month by month</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Stillwater trout in the South East — what's on the menu and what to tie on.</div>
      </div>
      <div ref={strip} style={{ position: "relative", display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }} className="noscroll">
        {MONTHS.map((m, i) => <Chip key={m} on={month === i} tone={i === TODAY.getMonth() ? C.cyan : undefined} onClick={() => setMonth(i)}>{m}{i === TODAY.getMonth() ? " •" : ""}</Chip>)}
      </div>
      <MonthCard g={MONTH_GUIDE[month]} />
      <FoodCalendar month={month} onPick={setMonth} />

      <div style={{ ...panel, padding: 16 }}>
        <Label>Reading the barometer</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {PRESSURE_NOTES.map((p) => <div key={p.k} style={{ fontSize: 14, lineHeight: 1.45 }}><b style={{ color: C.cyan }}>{p.k}.</b> {p.t}</div>)}
        </div>
      </div>

      <div style={{ ...panel, padding: 16 }}>
        <Label>Fly glossary</Label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search flies…" style={{ marginTop: 10, width: "100%", border: `1px solid ${C.line2}`, background: "rgba(255,255,255,0.04)", color: C.text, borderRadius: 10, padding: "10px 12px", fontSize: 16, outline: "none" }} />
        <div style={{ display: "flex", gap: 5, marginTop: 8, overflowX: "auto" }} className="noscroll">{types.map((t) => <Chip key={t} on={ftype === t} onClick={() => setFtype(t)}>{t}</Chip>)}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
          {flies.map((f) => (
            <div key={f.n} style={{ padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ fontSize: 14 }}>{f.n}</b><span style={{ fontFamily: F.mono, fontSize: 10, color: f.t === "Lure" ? C.fair : C.cyan }}>{f.t.toUpperCase()}</span></div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{f.i}</div>
              <div style={{ fontSize: 13, marginTop: 3 }}>{f.h}</div>
            </div>
          ))}
          {flies.length === 0 && <div style={{ fontSize: 13, color: C.muted, padding: 10 }}>No flies match.</div>}
        </div>
      </div>

      <div style={{ ...panel, padding: 16 }}>
        <Label>Sources</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {SOURCES.map((s) => <a key={s.u} href={s.u} target="_blank" rel="noreferrer" style={{ color: C.cyan, fontSize: 13, textDecoration: "none" }}>{s.t} ↗</a>)}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>Water temperatures are typical ranges for small southern stillwaters; a warm or cold spell can shift a month by two or three weeks. Use the live water estimate on each venue first.</div>
      </div>
    </div>
  );
}
