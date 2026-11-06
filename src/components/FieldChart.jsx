import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function FieldChart({ data, unit = "", color = "var(--accent)", height = 210, label = "Time series", domain = ["auto", "auto"] }) {
  if (!data?.length) return <div className="chart-empty">No readings to plot. Refresh the feed to try again.</div>;
  function exportData() {
    const rows = [["Time", label, "Unit"], ...data.map(d => [d.full || d.label, d.value, unit])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `pocket-ghillie-${label.toLowerCase().replaceAll(" ", "-")}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const decimals = unit.startsWith("m") && unit !== "mph" && unit !== "mm" ? 3 : 1;
  return <><div className="field-chart" role="img" aria-label={label} style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -15 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4" />
        <XAxis dataKey="label" minTickGap={44} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={68} tickFormatter={v => Number(v).toFixed(decimals === 3 ? 3 : Math.abs(v) < 10 ? 1 : 0)} />
        <Tooltip contentStyle={{ background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 8 }} labelFormatter={(_, payload) => payload?.[0]?.payload?.full || ""} formatter={v => [`${Number(v).toFixed(decimals)} ${unit}`, label]} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.09} isAnimationActive={false} connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div><details className="chart-data"><summary>Read or export chart data</summary><button className="text-button" onClick={exportData}>Download full series (CSV)</button><table><caption>Latest 12 values</caption><thead><tr><th scope="col">Time</th><th scope="col">{label}</th></tr></thead><tbody>{data.slice(-12).map((d, i) => <tr key={i}><td>{d.full || d.label}</td><td>{Number(d.value).toFixed(decimals)} {unit}</td></tr>)}</tbody></table></details></>;
}
