export const C = {
  bg: "#0A0F14", panel: "#111920", panel2: "#162029", line: "rgba(255,255,255,0.08)", line2: "rgba(255,255,255,0.14)",
  text: "#E9EFF3", muted: "#8A98A6", dim: "#5C6A77",
  cyan: "#4FD6C8", cyanBg: "rgba(79,214,200,0.12)",
  go: "#35D07F", goBg: "rgba(53,208,127,0.14)", fair: "#F2B544", fairBg: "rgba(242,181,68,0.14)", poor: "#F0564F", poorBg: "rgba(240,86,79,0.14)",
};
export const F = {
  display: "'SF Pro Display',-apple-system,'Segoe UI',Roboto,sans-serif",
  body: "-apple-system,'SF Pro Text','Segoe UI',Roboto,sans-serif",
  mono: "ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace",
};
export const COL = (k) => ({ go: C.go, fair: C.fair, poor: C.poor }[k] || C.dim);
export const BG = (k) => ({ go: C.goBg, fair: C.fairBg, poor: C.poorBg }[k] || "rgba(255,255,255,0.05)");
export const keyOf = (s) => (s >= 7 ? "go" : s >= 4.5 ? "fair" : "poor");
export const PRESS = {
  falling: { glyph: "↘", label: "falling" },
  "steady-high": { glyph: "▲", label: "static high" },
  steady: { glyph: "→", label: "steady" },
  rising: { glyph: "↗", label: "rising" },
};
export const panel = { background: C.panel, borderRadius: 18, border: `1px solid ${C.line}` };
