import React from "react";
import { C, F, panel } from "../theme.js";
import { Label, Stat } from "./ui.jsx";
import { hhmm, pad2 } from "../lib/util.js";
import { wx } from "../lib/weather.js";

const tendText = (t3) => (t3 <= -1.5 ? "falling fast" : t3 <= -0.5 ? "falling" : t3 >= 1.5 ? "rising fast" : t3 >= 0.5 ? "rising" : "steady");
const tendCol = (t3) => (t3 <= -0.5 ? C.go : t3 >= 1.5 ? C.fair : C.text);

/* Pressure trace: 24h back → 72h ahead, with "now" marker and the 1021 hPa high-pressure line */
export function PressureChart({ series }) {
  if (!series || series.length < 6) return null;
  const W = 400, H = 120, pl = 34, pr = 8, pt = 10, pb = 20;
  const ps = series.map((s) => s.p);
  const lo = Math.floor(Math.min(...ps, 1005) - 1), hi = Math.ceil(Math.max(...ps, 1024) + 1);
  const x = (i) => pl + (i / (series.length - 1)) * (W - pl - pr);
  const y = (p) => pt + (1 - (p - lo) / (hi - lo)) * (H - pt - pb);
  const nowI = Math.min(24, series.length - 1);
  const path = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(s.p).toFixed(1)}`).join(" ");
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const dayMarks = series.map((s, i) => ({ i, t: s.t })).filter((s) => s.t.endsWith("T00:00"));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} role="img" aria-label="Pressure trend chart">
      {ticks.map((t) => <g key={t}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke={C.line} /><text x={pl - 4} y={y(t) + 3} textAnchor="end" fontSize="9" fill={C.dim} fontFamily={F.mono}>{t}</text></g>)}
      {1021 > lo && 1021 < hi && <g><line x1={pl} x2={W - pr} y1={y(1021)} y2={y(1021)} stroke={C.fair} strokeDasharray="3 4" opacity="0.6" /><text x={W - pr} y={y(1021) - 3} textAnchor="end" fontSize="8" fill={C.fair} fontFamily={F.mono}>HIGH 1021</text></g>}
      {dayMarks.map((d) => <g key={d.i}><line x1={x(d.i)} x2={x(d.i)} y1={pt} y2={H - pb} stroke={C.line} /><text x={x(d.i) + 3} y={H - 6} fontSize="9" fill={C.dim} fontFamily={F.mono}>{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date(d.t).getDay()]}</text></g>)}
      <path d={path} fill="none" stroke={C.cyan} strokeWidth="1.8" />
      <line x1={x(nowI)} x2={x(nowI)} y1={pt} y2={H - pb} stroke={C.text} strokeDasharray="2 3" />
      <circle cx={x(nowI)} cy={y(series[nowI].p)} r="4" fill={C.cyan} stroke={C.bg} strokeWidth="2" />
      <text x={x(nowI) + 5} y={pt + 8} fontSize="9" fill={C.text} fontFamily={F.mono}>NOW</text>
    </svg>
  );
}

export function NowCard({ now }) {
  if (!now) return null;
  const w = wx(now.code);
  return (
    <div style={{ ...panel, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Label color={C.cyan}>Right now</Label>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: C.muted }}>{w.g} {w.t}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 10 }}>
        <Stat k="Pressure hPa" v={Math.round(now.press)} sub={`${now.t3 > 0 ? "+" : ""}${now.t3} in 3h · ${tendText(now.t3)}`} accent={tendCol(now.t3)} />
        <Stat k="Air" v={`${Math.round(now.temp)}°C`} sub={`feels ${Math.round(now.feels)}°`} />
        <Stat k="Wind" v={`${now.dir} ${Math.round(now.wind)}`} sub={`gusts ${Math.round(now.gust)} mph`} />
        <Stat k="24h hPa" v={`${now.t24 > 0 ? "+" : ""}${now.t24}`} sub={now.t24 <= -4 ? "front coming through" : now.t24 >= 4 ? "high building" : "settled"} />
        <Stat k="Humidity" v={`${Math.round(now.hum)}%`} sub={`dew point ${Math.round(now.dew)}°`} />
        <Stat k="Cloud" v={`${Math.round(now.cloud)}%`} sub={`rain chance ${Math.round(now.pop)}%`} />
        <Stat k="UV" v={now.uv.toFixed(1)} sub={now.uv >= 5 ? "high — fish deep" : now.uv >= 3 ? "moderate" : "low"} />
        <Stat k="Visibility" v={`${now.vis} km`} sub={now.vis < 1 ? "fog" : now.vis < 5 ? "murky" : "clear"} />
        <Stat k="Air–dew gap" v={`${Math.round(now.temp - now.dew)}°`} sub={now.temp - now.dew <= 2 ? "mist likely" : "dry air"} />
      </div>
    </div>
  );
}

export function SolunarCard({ sol, moon }) {
  if (!sol) return null;
  const stars = "★".repeat(sol.rating) + "☆".repeat(3 - sol.rating);
  return (
    <div style={{ ...panel, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Label>Solunar periods</Label>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: C.fair }}>{stars}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
        {sol.periods.map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 10px", borderRadius: 10, background: p.kind === "major" ? "rgba(242,181,68,0.12)" : "rgba(255,255,255,0.04)" }}>
            <span><b style={{ color: p.kind === "major" ? C.fair : C.text }}>{p.kind === "major" ? "Major" : "Minor"}</b> · {p.label}</span>
            <span style={{ fontFamily: F.mono }}>{hhmm(p.start)}–{hhmm(p.end)}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
        {moon.glyph} {moon.name}, {moon.illum}% lit{sol.nearSyzygy ? " — new/full moon strengthens the periods" : ""}{sol.overlapsLight ? ". A period lines up with sunrise or sunset — prime time" : ""}. Solunar theory is a light nudge in the hourly index, not a rule.
      </div>
    </div>
  );
}

export function HourlyTable({ day, from = 5, to = 21 }) {
  const H = day.hourly;
  if (!H) return <div style={{ ...panel, padding: 16, fontSize: 13, color: C.muted }}>Hourly detail appears once the live feed loads.</div>;
  const rows = [];
  for (let h = from; h <= to; h++) rows.push(h);
  const th = { fontFamily: F.mono, fontSize: 9, color: C.dim, fontWeight: 600, textAlign: "right", padding: "0 4px 6px", letterSpacing: "0.08em" };
  const td = { fontFamily: F.mono, fontSize: 11, textAlign: "right", padding: "5px 3px", borderTop: `1px solid ${C.line}`, whiteSpace: "nowrap" };
  return (
    <div style={{ ...panel, padding: "14px 10px" }}>
      <Label style={{ padding: "0 6px" }}>Hour by hour</Label>
      <div style={{ overflowX: "auto", marginTop: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 320 }}>
          <thead><tr>{["", "", "°C", "WIND·G", "CLD", "RAIN", "hPa", "3H"].map((t, i) => <th key={i} style={{ ...th, textAlign: i < 2 ? "left" : "right" }}>{t}</th>)}</tr></thead>
          <tbody>
            {rows.map((h) => {
              const w = wx(H.code[h]), t = H.tend[h];
              return (
                <tr key={h}>
                  <td style={{ ...td, textAlign: "left", color: C.muted }}>{pad2(h)}</td>
                  <td style={{ ...td, textAlign: "left" }} title={w.t}>{w.g}</td>
                  <td style={td}>{Math.round(H.temp[h])}</td>
                  <td style={td}><span style={{ display: "inline-block", transform: `rotate(${H.deg[h] + 180}deg)`, color: C.cyan }}>↑</span> {Math.round(H.wind[h])}<span style={{ color: H.gust[h] > 30 ? C.poor : C.dim }}>·{Math.round(H.gust[h])}</span></td>
                  <td style={td}>{Math.round(H.cloud[h])}</td>
                  <td style={{ ...td, color: H.pop[h] >= 60 ? C.fair : C.text }}>{Math.round(H.pop[h])}%</td>
                  <td style={td}>{Math.round(H.press[h])}</td>
                  <td style={{ ...td, color: t <= -0.5 ? C.go : t >= 1.5 ? C.fair : C.muted }}>{t > 0 ? "+" : ""}{t}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
