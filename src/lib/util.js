export const TODAY = new Date();
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const hhmm = (d) => (d && !isNaN(d) ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—");
export const dateStr = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const pad2 = (n) => String(n).padStart(2, "0");

export function milesFrom(v, h) {
  const R = 3959, r = (x) => (x * Math.PI) / 180;
  const a = Math.sin(r(v.lat - h.lat) / 2) ** 2 + Math.cos(r(h.lat)) * Math.cos(r(v.lat)) * Math.sin(r(v.lon - h.lon) / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
export function venueStatus(v, date) {
  if (v.season) { const m = date.getMonth() + 1; if (m < v.season[0] || m > v.season[1]) return "Closed for season"; }
  if (v.closed && v.closed.includes(DAYS[date.getDay()])) return `Closed ${DAYS[date.getDay()]}s`;
  return null;
}

export const LS = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
};

export const isIOS = () => typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
export const isStandalone = () => typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

export function directionsUrl(v) {
  const q = encodeURIComponent(`${v.name}, ${v.where}, UK`);
  if (isIOS()) return `https://maps.apple.com/?daddr=${q}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
