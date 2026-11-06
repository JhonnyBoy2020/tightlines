const EA = "https://environment.data.gov.uk/flood-monitoring";
export async function riverEvidence(measureId, fetcher = fetch, now = Date.now()) {
  if (!measureId) return null;
  if (typeof measureId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(measureId)) return { available: false, reason: "Invalid gauge selection." };
  const url = `${EA}/id/measures/${encodeURIComponent(measureId)}`;
  try {
    const read = async link => { const r = await fetcher(link, { signal: AbortSignal.timeout(6000), headers: { Accept: "application/json" } }); if (!r.ok) throw new Error(); return r.json(); };
    const [meta, series] = await Promise.all([read(url), read(`${url}/readings?since=${new Date(now - 48 * 3600000).toISOString()}&_sorted&_limit=300`)]);
    const m = Array.isArray(meta.items) ? meta.items[0] : meta.items;
    if (!m || !["level", "flow"].includes(m.parameter)) throw new Error();
    const rows = (series.items || []).filter(r => Number.isFinite(r.value) && Number.isFinite(Date.parse(r.dateTime)) && Date.parse(r.dateTime) <= now).sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    const latest = rows.at(-1), prior = latest && rows.filter(r => Date.parse(r.dateTime) <= Date.parse(latest.dateTime) - 3600000).at(-1);
    const stale = !latest || now - Date.parse(latest.dateTime) > 2 * 3600000;
    return { available: !!latest && !stale, source: url, measureId, label: m.label || measureId, unit: m.unitName, qualifier: m.qualifier, latest: latest ? { value: latest.value, at: latest.dateTime } : null, prior: prior ? { value: prior.value, at: prior.dateTime } : null, change: latest && prior ? latest.value - prior.value : null, stale, limitation: "User-selected EA gauge, not a measurement of a listed stillwater. Gauge level is relative to datum, not water depth. No safety, normality or flood thresholds inferred." };
  } catch { return { available: false, source: url, measureId, reason: "EA gauge data could not be retrieved. No trend inferred." }; }
}
