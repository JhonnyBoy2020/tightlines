import React from "react";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline support + "Add to Home Screen" app behaviour (production only)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    try { navigator.serviceWorker.register("/sw.js").catch(() => { /* unavailable in embedded previews */ }); } catch { /* opaque iframe origin */ }
  });
}
