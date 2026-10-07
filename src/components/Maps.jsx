import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { C, COL } from "../theme.js";

const TILES = {
  dark: { name: "Dark", url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", attr: "Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors", maxZoom: 16 },
  sat: { name: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Imagery &copy; Esri, Maxar, Earthstar Geographics" },
  osm: { name: "Streets", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
};

function Layers({ initial = "dark" }) {
  return (
    <LayersControl position="topright">
      {Object.entries(TILES).map(([k, t]) => (
        <LayersControl.BaseLayer key={k} name={t.name} checked={k === initial}>
          <TileLayer url={t.url} attribution={t.attr} maxNativeZoom={t.maxZoom || 19} maxZoom={19} />
        </LayersControl.BaseLayer>
      ))}
    </LayersControl>
  );
}

const pin = (label, color, faded) => L.divIcon({
  className: "tl-pin",
  html: `<div style="background:${color};opacity:${faded ? 0.45 : 1}" class="tl-pin-b">${label}</div>`,
  iconSize: [34, 24], iconAnchor: [17, 12], popupAnchor: [0, -12],
});
const homeIcon = L.divIcon({ className: "tl-pin", html: `<div class="tl-home">◎</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });

function FitRadius({ home, radius }) {
  const map = useMap();
  useEffect(() => {
    const b = L.latLng(home.lat, home.lon).toBounds(radius * 1609.34 * 2);
    map.fitBounds(b, { padding: [10, 10] });
  }, [home.lat, home.lon, radius, map]);
  return null;
}
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/* Overview map of all waters, coloured by the selected day's score */
export function WatersMap({ items, home, radius, onOpen, height = 420, initial = "osm" }) {
  const markers = useMemo(() => items.map((x) => {
    const st = x.sel.status;
    if (!x.live && !st) return { ...x, icon: pin("·", C.dim, true) };
    const color = st ? C.dim : COL(x.sel.result.colorKey);
    return { ...x, icon: pin(st ? "✕" : Math.round(x.sel.result.score), color, x.dist > radius) };
  }), [items, radius]);
  return (
    <div className="tl-map" style={{ height, borderRadius: 18, overflow: "hidden", border: `1px solid ${C.line}` }}>
      <MapContainer center={[home.lat, home.lon]} zoom={9} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <Layers initial={initial} />
        <FitRadius home={home} radius={radius} />
        <InvalidateOnResize />
        <Circle center={[home.lat, home.lon]} radius={radius * 1609.34} pathOptions={{ color: C.cyan, weight: 1, fillOpacity: 0.04, dashArray: "4 6" }} />
        <Marker position={[home.lat, home.lon]} icon={homeIcon} />
        {markers.map((x) => (
          <Marker key={x.v.id} position={[x.v.lat, x.v.lon]} icon={x.icon}>
            <Popup>
              <div className="tl-pop">
                <b>{x.v.name}</b>
                <div>{x.v.where} · {x.dist} mi</div>
                <div style={{ color: x.sel.status || !x.live ? C.muted : COL(x.sel.result.colorKey), fontWeight: 700 }}>{x.sel.status || (x.live ? `${x.sel.result.score}/10 · ${x.sel.result.verdict}` : "Forecast unavailable. Open to retry.")}</div>
                <button onClick={() => onOpen(x.v.id)}>Open forecast →</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/* Single venue map: satellite by default so you can read the banks, inflows and bays */
export function VenueMap({ venue, windDeg, height = 240 }) {
  const icon = useMemo(() => pin("●", C.cyan), []);
  return (
    <div className="tl-map" style={{ height, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}`, position: "relative" }}>
      <MapContainer center={[venue.lat, venue.lon]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <Layers initial="sat" />
        <InvalidateOnResize />
        <Marker position={[venue.lat, venue.lon]} icon={icon} />
      </MapContainer>
      {windDeg != null && (
        <div style={{ position: "absolute", left: 10, bottom: 10, zIndex: 500, background: "rgba(10,15,20,0.8)", borderRadius: 10, padding: "6px 8px", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text }}>
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: `rotate(${windDeg + 180}deg)` }}><path d="M12 2 L17 14 L12 11 L7 14 Z" fill={C.cyan} /></svg>
          wind blows this way
        </div>
      )}
    </div>
  );
}
