import React from "react";
import { C, F, COL, keyOf, panel } from "../theme.js";
import { hhmm } from "../lib/util.js";

export const Label = ({ children, color, style }) => <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: color || C.muted, textTransform: "uppercase", letterSpacing: "0.14em", ...style }}>{children}</div>;

export const Chip = ({ on, onClick, children, tone, disabled, title }) => (
  <button title={title} disabled={disabled} onClick={onClick} style={{ border: `1px solid ${on ? "transparent" : C.line2}`, cursor: disabled ? "default" : "pointer", borderRadius: 999, padding: "8px 13px", fontFamily: F.body, fontWeight: 600, fontSize: 13, background: on ? (tone || C.text) : "transparent", color: on ? C.bg : C.text, whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1, flexShrink: 0 }}>{children}</button>
);

export const SourceTag = ({ live }) => (
  <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: live ? C.cyan : C.dim, background: live ? C.cyanBg : "rgba(255,255,255,0.05)", borderRadius: 999, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
    {live && <span style={{ width: 6, height: 6, borderRadius: 999, background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />}{live ? "LIVE" : "SAMPLE"}
  </span>
);

export const Panel = ({ children, style, ...rest }) => <div style={{ ...panel, padding: 16, ...style }} {...rest}>{children}</div>;

export function ScoreRing({ score, colorKey, size = 96 }) {
  const r = (size - 12) / 2, circ = 2 * Math.PI * r, fg = COL(colorKey);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score ${score} out of 10`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fg} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 10) * circ} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ filter: `drop-shadow(0 0 6px ${fg})` }} />
      <text x="50%" y="50%" dy="0.12em" textAnchor="middle" fontFamily={F.mono} fontWeight="700" fontSize={size * 0.32} fill={C.text}>{score}</text>
      <text x="50%" y="50%" dy="1.7em" textAnchor="middle" fontFamily={F.mono} fontSize={size * 0.1} fill={C.muted}>/10</text>
    </svg>
  );
}

export function DayStrip({ week, activeIdx, onPick }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {week.map((d, i) => {
        const active = i === activeIdx, st = d.status;
        return (
          <button key={i} onClick={() => onPick(i)} style={{ flex: 1, minWidth: 0, border: `1px solid ${active ? C.cyan : C.line}`, cursor: "pointer", background: active ? C.panel2 : "transparent", borderRadius: 12, padding: "8px 0 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: st ? 0.45 : 1 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: active ? C.cyan : C.muted }}>{i === 0 ? "TODAY" : d.label.toUpperCase()}</span>
            <span style={{ width: 26, height: 26, borderRadius: 999, background: st ? C.dim : COL(d.result.colorKey), color: C.bg, fontFamily: F.mono, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{st ? "✕" : Math.round(d.result.score)}</span>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>{d.thunder ? "⚡" : `${d.hi}°`}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Sparkline({ week, activeIdx, onPick }) {
  const W = 400, H = 54, pad = 16, step = (W - pad * 2) / (week.length - 1);
  const pts = week.map((d, i) => [pad + i * step, H - 8 - (d.result.score / 10) * (H - 16)]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 54, display: "block" }}>
      <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={C.cyan} stopOpacity="0.3" /><stop offset="1" stopColor={C.cyan} stopOpacity="0" /></linearGradient></defs>
      <path d={`${path} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`} fill="url(#sg)" />
      <path d={path} fill="none" stroke={C.cyan} strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === activeIdx ? 6 : 3.5} fill={COL(week[i].result.colorKey)} stroke={C.panel} strokeWidth="2" style={{ cursor: "pointer" }} onClick={() => onPick(i)} />)}
    </svg>
  );
}

export function HourlyChart({ hours, win, sun }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 72 }}>
        {hours.map((x) => {
          const inWin = x.h >= win.start && x.h < win.end;
          return (
            <div key={x.h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-end", height: "100%" }}>
              {x.solunar > 0 && <div title={x.solunar === 1 ? "Solunar major" : "Solunar minor"} style={{ height: 3, marginBottom: 2, borderRadius: 2, background: x.solunar === 1 ? C.fair : "rgba(242,181,68,0.45)" }} />}
              <div title={`${x.h}:00 — ${x.night ? "dark" : x.score}`} style={{ height: x.night ? 4 : `${Math.max(6, x.score * 6.2)}px`, background: x.night ? "rgba(255,255,255,0.08)" : COL(keyOf(x.score)), opacity: x.night ? 1 : inWin ? 1 : 0.45, borderRadius: 3, boxShadow: inWin ? `0 0 8px ${COL(keyOf(x.score))}` : "none" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: F.mono, fontSize: 9, color: C.dim }}>
        <span>00</span><span>☀ {hhmm(sun.rise)}</span><span>12</span><span>{hhmm(sun.set)} ☾</span><span>24</span>
      </div>
    </div>
  );
}

export function Stat({ k, v, sub, accent }) {
  return (
    <div style={{ ...panel, padding: "10px 12px", flex: 1, minWidth: 0 }}>
      <Label>{k}</Label>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, color: accent || C.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export const Btn = ({ children, onClick, primary, style, disabled, href }) => {
  const st = { border: primary ? "none" : `1px solid ${C.line}`, cursor: disabled ? "default" : "pointer", background: primary ? C.cyan : "rgba(255,255,255,0.06)", color: primary ? C.bg : C.text, borderRadius: 12, padding: "11px 14px", fontFamily: F.body, fontWeight: 700, fontSize: 13, textDecoration: "none", textAlign: "center", opacity: disabled ? 0.6 : 1, display: "inline-block", ...style };
  if (href) return <a href={href} target={href.startsWith("tel") ? undefined : "_blank"} rel="noreferrer" style={st}>{children}</a>;
  return <button disabled={disabled} onClick={onClick} style={st}>{children}</button>;
};
