// Tiny Leaflet map showing one property pin and its nearby station pins,
// with distance polylines. No react-leaflet — direct Leaflet for minimal deps.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyStation } from "@/hooks/use-transport";

interface Props {
  lat: number;
  lng: number;
  label?: string;
  stations: NearbyStation[];
  height?: number;
  maxStations?: number;
}

const KIND_COLOR: Record<NearbyStation["kind"], string> = {
  rail: "hsl(var(--brand))",
  tube: "hsl(var(--accent))",
  tram: "hsl(var(--success))",
};

function pinIcon(color: string, label: string) {
  const html = `<div style="
    background:${color};color:white;border-radius:50%;
    width:22px;height:22px;display:flex;align-items:center;justify-content:center;
    font:600 11px system-ui;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);
  ">${label}</div>`;
  return L.divIcon({ html, className: "", iconSize: [22, 22], iconAnchor: [11, 11] });
}

export default function PropertyStationsMap({
  lat, lng, label, stations, height = 220, maxStations = 5,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
    L.control.attribution({ prefix: false, position: "bottomright" })
      .addAttribution("&copy; OSM").addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    // wipe overlay layers (keep tile layer)
    map.eachLayer((layer) => { if (!(layer instanceof L.TileLayer)) map.removeLayer(layer); });

    const home = L.marker([lat, lng], { icon: pinIcon("hsl(var(--brand))", "🏠"), title: label ?? "Property" }).addTo(map);
    if (label) home.bindTooltip(label, { direction: "top", offset: [0, -10] });

    const points: L.LatLngExpression[] = [[lat, lng]];
    stations.slice(0, maxStations).forEach((s, i) => {
      // Prefer real coords from the API; fall back to a fan around the property.
      let pos: L.LatLngExpression;
      if (s.lat != null && s.lng != null) {
        pos = [s.lat, s.lng];
      } else {
        const angle = (i / Math.max(1, Math.min(maxStations, stations.length))) * Math.PI * 2;
        const dLat = (s.distanceM * Math.cos(angle)) / 111111;
        const dLng = (s.distanceM * Math.sin(angle)) / (111111 * Math.cos((lat * Math.PI) / 180));
        pos = [lat + dLat, lng + dLng];
      }
      points.push(pos);
      const m = L.marker(pos, { icon: pinIcon(KIND_COLOR[s.kind], String(i + 1)) }).addTo(map);
      m.bindTooltip(
        `<strong>${s.name}</strong><br/>${s.kind === "tube" ? "Tube/Metro" : s.kind === "tram" ? "Tram" : "Rail"} · ${(s.distanceM/1000).toFixed(2)} km · ${s.walkMin} min walk${s.lines.length ? `<br/><em>${s.lines.slice(0,3).join(" · ")}</em>` : ""}`,
        { direction: "top" },
      );
      L.polyline([[lat, lng], pos], {
        color: KIND_COLOR[s.kind], weight: 2, opacity: 0.6, dashArray: "4 4",
      }).addTo(map);
    });

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [20, 20], maxZoom: 15 });
    } else {
      map.setView([lat, lng], 14);
    }
    setTimeout(() => map.invalidateSize(), 0);
  }, [lat, lng, label, stations, maxStations]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Map of ${label ?? "property"} and ${stations.length} nearby stations`}
      style={{ height }}
      className="w-full rounded-md overflow-hidden border bg-muted"
    />
  );
}
