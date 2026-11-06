import { useEffect, useRef, useState } from "react";
import { api } from "./cloud.js";
import { emptyField, validateField } from "./field.js";

// No new browser storage: explicit cloud checkpoints and portable JSON backups.
export default function useFieldBook(key) {
  const [data, setData] = useState(emptyField);
  const [revision, setRevision] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const generation = useRef(0), current = useRef(data), dirtyRef = useRef(dirty);
  current.current = data; dirtyRef.current = dirty;
  function change(next) {
    setData(old => typeof next === "function" ? next(old) : next);
    dirtyRef.current = true; setDirty(true); setMessage("");
  }
  useEffect(() => {
    const g = ++generation.current;
    setRevision(null); setMessage(""); setBusy(false);
    if (!key) return;
    api("/field", { key }).then(r => {
      if (g !== generation.current) return;
      if (r.data && dirtyRef.current) { setMessage("A saved field book exists. Export this tab's draft before loading it."); return; }
      setRevision(r.revision);
      if (r.data) { setData(validateField(r.data)); setDirty(false); }
    }).catch(e => { if (g === generation.current) setMessage(e.message); });
  }, [key]);
  useEffect(() => {
    const warn = e => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  async function save() {
    const g = generation.current, snapshot = current.current;
    setBusy(true);
    try {
      const r = await api("/field", { key, method: "PUT", body: { revision, data: validateField(snapshot) } });
      if (g !== generation.current) return;
      setRevision(r.revision);
      const unchanged = current.current === snapshot;
      setDirty(!unchanged); dirtyRef.current = !unchanged;
      setMessage(unchanged ? "Field book saved. Load it on another device using the same private key." : "Checkpoint saved. Newer changes still need saving.");
    } catch (e) { if (g === generation.current) setMessage(e.message); }
    finally { if (g === generation.current) setBusy(false); }
  }
  async function load() {
    const g = generation.current; setBusy(true);
    try {
      const r = await api("/field", { key });
      if (g !== generation.current) return;
      setData(r.data ? validateField(r.data) : emptyField()); setRevision(r.revision);
      dirtyRef.current = false; setDirty(false); setMessage("Saved field book loaded.");
    } catch (e) { if (g === generation.current) setMessage(e.message); }
    finally { if (g === generation.current) setBusy(false); }
  }
  return { data, change, save, load, dirty, busy, message, revision };
}
