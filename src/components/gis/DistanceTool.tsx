import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { haversine, formatDistance, type LatLng, pathLength } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface Props {
  active: boolean;
  unit: "metric" | "nautical";
  onPathChange: (pts: LatLng[]) => void;
  points: LatLng[];
  onFinish: () => void;
}

const DistanceTool = ({ active, unit, onPathChange, points, onFinish }: Props) => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
    const layer = layerRef.current;
    return () => { layer.clearLayers(); };
  }, [map]);

  // Redesenha ao mudar pontos
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (points.length === 0) return;
    const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    L.polyline(latlngs, { color: "hsl(var(--primary))", weight: 4, opacity: 0.9 }).addTo(layer);
    points.forEach((p, i) => {
      L.circleMarker([p.lat, p.lng], {
        radius: 6, color: "hsl(var(--primary))", fillColor: "hsl(var(--primary))",
        fillOpacity: 1, weight: 2,
      }).addTo(layer).bindTooltip(`${i + 1}`, { permanent: false });
    });
    // Rótulos por segmento
    for (let i = 1; i < points.length; i++) {
      const d = haversine(points[i - 1], points[i]);
      const mid: [number, number] = [
        (points[i - 1].lat + points[i].lat) / 2,
        (points[i - 1].lng + points[i].lng) / 2,
      ];
      L.marker(mid, {
        interactive: false,
        icon: L.divIcon({
          className: "",
          html: `<div style="background:hsl(var(--background));color:hsl(var(--foreground));padding:2px 6px;border-radius:6px;border:1px solid hsl(var(--primary));font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)">${formatDistance(d, unit === "nautical")}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }).addTo(layer);
    }
  }, [points, unit]);

  useEffect(() => {
    if (!active) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      onPathChange([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    };
    const onDbl = () => { if (points.length >= 2) onFinish(); };
    map.on("click", onClick);
    map.on("dblclick", onDbl);
    map.doubleClickZoom.disable();
    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDbl);
      map.doubleClickZoom.enable();
    };
  }, [active, map, points, onPathChange, onFinish]);

  if (!active || points.length === 0) return null;
  const total = pathLength(points);

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[500] bg-background/95 backdrop-blur border border-border rounded-lg shadow-xl px-4 py-3 flex items-center gap-4">
      <div>
        <div className="text-xs text-muted-foreground">Distância total</div>
        <div className="font-mono font-bold text-lg text-primary">
          {formatDistance(total, unit === "nautical")}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {(total).toFixed(0)} m · {(total / 1000).toFixed(3)} km · {(total / 1852).toFixed(3)} NM
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="secondary" onClick={onFinish} disabled={points.length < 2} aria-label="Concluir">
          <Check size={16} />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPathChange([])} aria-label="Limpar">
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export default DistanceTool;
