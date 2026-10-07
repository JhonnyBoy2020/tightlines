// Credentials stay in memory, not URLs. Re-enter the private key after reopening.
export const API = import.meta.env.VITE_API_BASE || "/.netlify/functions/api";
export async function api(path, { key, body, method, signal } = {}) {
  const res = await fetch(API + path, {
    method: method || (body ? "POST" : "GET"), signal,
    headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  let json;
  try { json = await res.json(); } catch { throw new Error("Cloud service is unavailable on this host. Your local log is unchanged."); }
  if (!res.ok) throw new Error(json.error || `Service unavailable (${res.status})`);
  return json;
}
export const validSource = value => {
  try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
};
export function downloadJSON(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
