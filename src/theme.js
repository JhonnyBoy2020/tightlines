export const C = {
  bg: "var(--bg)", panel: "var(--surface)", panel2: "var(--surface-2)", line: "var(--line)", line2: "var(--line-strong)",
  text: "var(--ink)", muted: "var(--muted)", dim: "var(--muted)",
  cyan: "var(--accent)", cyanBg: "var(--accent-soft)",
  go: "var(--accent)", goBg: "var(--accent-soft)", fair: "var(--amber)", fairBg: "var(--amber-soft)", poor: "var(--danger)", poorBg: "var(--danger-soft)",
};
export const F = {
  display: "'Satoshi', sans-serif",
  body: "'Satoshi', sans-serif",
  mono: "'Satoshi', sans-serif",
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
export const panel = { background: C.panel, borderRadius: 12, border: `1px solid ${C.line}` };
