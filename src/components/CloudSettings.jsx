import React, { useEffect, useState } from "react";
import { Cloud, Bell, KeyRound, Download, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { api, downloadJSON } from "../lib/cloud.js";
import { VENUES } from "../data/venues.js";
import { isIOS, isStandalone } from "../lib/util.js";

export default function CloudSettings({ cloud, favs, log }) {
  const [input, setInput] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState(""), [health, setHealth] = useState(null), [publicKey, setPublicKey] = useState(""), [threshold, setThreshold] = useState(8), [waters, setWaters] = useState(favs.length ? favs.slice(0, 5) : ["thornwood"]), [sub, setSub] = useState(null), [subscribed, setSubscribed] = useState(false), [reveal, setReveal] = useState(false), [consent, setConsent] = useState(false);
  const supported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  useEffect(() => { api("/health").then(setHealth).catch(() => setHealth(null)); }, []);
  useEffect(() => {
    if (cloud.key) api("/push-key", { key: cloud.key }).then(d => setPublicKey(d.publicKey)).catch(e => setError(e.message));
    else { setPublicKey(""); setSubscribed(false); }
  }, [cloud.key]);
  useEffect(() => { if (supported) navigator.serviceWorker.getRegistration().then(r => r?.pushManager.getSubscription()).then(s => { if (s) setSub(s); }).catch(() => {}); }, [supported]);
  async function action(fn) { setBusy(true); setError(""); setMessage(""); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  function bytes(s) { const b = atob((s + "=".repeat((4 - s.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, c => c.charCodeAt(0)); }
  async function enable() {
    if (!supported) throw new Error("Push notifications are not available in this browser.");
    if (isIOS() && !isStandalone()) throw new Error("On iPhone, add this site to the Home Screen, open its icon, and enable alerts there.");
    // Must remain directly under the user's click for Safari's permission gesture.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission was not granted. You can change it in browser or iPhone settings.");
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(publicKey) });
    setSub(subscription);
    const result = await api("/subscription", { key: cloud.key, body: { subscription: subscription.toJSON(), threshold: Number(threshold), venues: waters } });
    setSubscribed(true); setMessage(result.scheduled ? "Alerts enabled on this device. Checked hourly, 06:00–21:00 UK, at most once per water each day." : "Device registered. This is a preview: scheduled score alerts will not run until an approved production release. You can send a test notification.");
  }
  async function disable() {
    if (sub) { await api("/subscription", { key: cloud.key, method: "DELETE", body: { endpoint: sub.endpoint } }); await sub.unsubscribe(); }
    setSub(null); setSubscribed(false); setMessage("Alerts disabled on this device.");
  }
  return <div>
    <div className="page-heading"><div><p className="eyebrow">YOUR PRIVATE FISHING COMPANION</p><h1>Connected, on your terms.</h1><p>One logbook across devices. Timely alerts for the waters you care about.</p></div><span className="data-pill">{health ? health.storage : "Cloud connection unavailable"}</span></div>
    <div className="settings-grid">
      <section className="panel settings-card"><Cloud size={26} /><h2>Your log, everywhere.</h2><p>Use a private logbook key on your iPhone and computer to sync sessions and saved reports. No email address is required.</p>
        <div className="connection-status"><span className={`live-dot ${cloud.key ? "" : "off"}`} />{cloud.status}{cloud.syncedAt && <small>Last sync {new Date(cloud.syncedAt).toLocaleTimeString("en-GB")}</small>}</div>
        {!cloud.key ? <><label className="consent-label"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>Connect my {log.length} local sessions to server storage. Anyone with my key can read or change this logbook; I will keep it private.</span></label><button className="button primary" disabled={busy || !consent || !health} onClick={() => action(async () => { const key = await cloud.create(); setInput(key); setReveal(true); setMessage("Logbook created. Save the private key before closing this page; it cannot be recovered for you."); })}><KeyRound size={17} /> Create a private logbook</button><div className="or-rule">or connect an existing logbook</div><form onSubmit={e => { e.preventDefault(); action(async () => { await cloud.connect(input); setMessage("Connected. Keep this page open for automatic sync every 30 seconds."); }); }}><label className="field-label">Private logbook key<input type="password" autoComplete="off" required value={input} onChange={e => setInput(e.target.value)} placeholder="Paste your key from the other device" /></label><button className="button secondary" disabled={busy || !consent || !health}>Connect this device</button></form></> : <>
          <div className="key-box"><div className="section-heading"><strong>Keep your key safe</strong><button className="text-button" onClick={() => setReveal(!reveal)}>{reveal ? "Hide" : "Reveal"}</button></div>{reveal ? <code>{cloud.key}</code> : <p>•••• •••• •••• •••• ••••</p>}<button className="text-button" onClick={() => downloadJSON("tightlines-private-logbook-key.json", { warning: "PRIVATE: grants access to your entire logbook. Do not share publicly.", host: window.location.host, key: cloud.key })}><Download size={15} /> Download private key</button></div>
          <div className="button-row"><button className="button primary" disabled={busy} onClick={() => action(() => cloud.sync())}>Sync now</button><button className="button secondary" onClick={cloud.disconnect}>Disconnect</button></div>
        </>}
        <p className="small muted">The key stays in memory: re-enter it after reopening the app. Local records remain on this browser through the existing local log. Preview and production logbooks are separate. Export your log before moving hosts.</p>
        <button className="text-button" onClick={() => downloadJSON("tightlines-journal-backup.json", { version: 3, exportedAt: new Date().toISOString(), entries: log })}><Download size={15} /> Export journal backup</button>
      </section>
      <section className="panel settings-card"><Bell size={26} /><h2>Know when to go.</h2><p>Choose a minimum conditions score and up to five waters. No marketing, no alerts for sample data or known closures.</p><div className="notice-strip compact"><ShieldCheck size={19} /><p>{health?.scheduled ? "Hourly checks. Quiet hours 21:00–06:00 UK." : "Test environment: scheduled delivery is off. Registration and a user-requested test can be checked here."}</p></div>
        <label className="field-label">Notify me at {Number(threshold).toFixed(1)} / 10 or higher<input aria-label="Alert score threshold" type="range" min="5" max="10" step="0.5" value={threshold} onChange={e => setThreshold(Number(e.target.value))} /></label>
        <fieldset className="waters-select"><legend>Your waters ({waters.length}/5)</legend>{VENUES.map(v => <label key={v.id}><input type="checkbox" checked={waters.includes(v.id)} disabled={!waters.includes(v.id) && waters.length >= 5} onChange={e => setWaters(e.target.checked ? [...waters, v.id] : waters.filter(id => id !== v.id))} />{v.name}</label>)}</fieldset>
        <div className="button-row"><button className="button primary" disabled={busy || !cloud.key || !publicKey || !supported || !waters.length} onClick={() => action(enable)}><Bell size={16} /> {subscribed ? "Update alerts" : "Enable on this device"}</button>{sub && cloud.key && <button className="button secondary" disabled={busy} onClick={() => action(disable)}>Disable</button>}</div>
        {sub && cloud.key && <button className="text-button" disabled={busy} onClick={() => action(async () => { await api("/push-test", { key: cloud.key, body: { endpoint: sub.endpoint } }); setMessage("Test sent to this device's push provider. Check your notifications."); })}>Send a test notification</button>}
        {!cloud.key && <p className="small warning-text">Connect a private logbook first.</p>}{!supported && <p className="small warning-text">This browser or embedded preview does not support push. Open the Netlify test site directly.</p>}
        <p className="small muted">On iPhone, use iOS 16.4 or later: Share → Add to Home Screen, then open the app icon. Tap Enable to grant permission. <a href="https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/" target="_blank" rel="noreferrer">Apple WebKit guidance</a>.</p>
        <p className="small muted">A high score is not a safety signal or a promise of fish. Alerts are suppressed for forecast thunder, strong gusts, warm-water estimates and known closures. Delivery depends on your browser and push provider.</p>
      </section>
    </div>
    {(error || cloud.error) && <p className="inline-error" role="alert">{error || cloud.error}</p>}{message && <p className="inline-success" role="status">{message}</p>}
  </div>;
}
