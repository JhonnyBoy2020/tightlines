import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./cloud.js";
export default function useCloud(log, applyLog) {
  const [key, setKey] = useState(""), [status, setStatus] = useState("Not connected"), [error, setError] = useState(""), [syncedAt, setSynced] = useState(null);
  const logRef = useRef(log), applyRef = useRef(applyLog), deletions = useRef(new Set()), busy = useRef(false), generation = useRef(0);
  logRef.current = log; applyRef.current = applyLog;
  const markDeleted = id => { deletions.current.add(String(id)); };
  const sync = useCallback(async (token = key) => {
    if (!token || busy.current) return;
    const run = generation.current; busy.current = true; setStatus("Syncing"); setError("");
    const snapshot = logRef.current, removed = [...deletions.current];
    try {
      const result = await api("/sync", { key: token, body: { entries: snapshot, deleted: removed } });
      if (run !== generation.current) return;
      const tombstones = new Set(result.records.filter(r => r.deleted).map(r => String(r.id)));
      const merged = new Map(result.records.filter(r => !r.deleted).map(r => [String(r.id), r]));
      const sent = new Set(snapshot.map(r => String(r.id)));
      logRef.current.filter(r => !sent.has(String(r.id))).forEach(r => merged.set(String(r.id), r));
      const next = [...merged.values()].filter(r => !tombstones.has(String(r.id)) && !deletions.current.has(String(r.id))).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      if (JSON.stringify(next) !== JSON.stringify(logRef.current)) applyRef.current(next);
      removed.forEach(id => deletions.current.delete(id)); setSynced(result.syncedAt); setStatus("Connected");
    } catch (e) { if (run === generation.current) { setError(e.message); setStatus("Sync paused"); } throw e; }
    finally { busy.current = false; }
  }, [key]);
  async function connect(token) {
    setError(""); await sync(token.trim()); setKey(token.trim());
  }
  async function create() {
    const result = await api("/vault", { body: {} });
    await connect(result.key); return result.key;
  }
  function disconnect() { generation.current++; setKey(""); setStatus("Not connected"); setError(""); }
  useEffect(() => { if (!key) return; const t = setInterval(() => sync().catch(() => {}), 30000); return () => clearInterval(t); }, [key, sync]);
  useEffect(() => { if (!key) return; const t = setTimeout(() => sync().catch(() => {}), 1200); return () => clearTimeout(t); }, [log, key, sync]);
  return { key, status, error, syncedAt, connect, create, disconnect, sync, markDeleted };
}
