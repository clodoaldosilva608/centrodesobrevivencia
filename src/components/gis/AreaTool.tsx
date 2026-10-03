import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-geometryutil";
import { pathLength, type LatLng } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface Props {
  active: boolean;
  points: LatLng[];
  onChange: (pts: LatLng[]) => void;
  onFinish: () => void;
}

const geodesicArea = (pts: LatLng[]): number => {
  if (pts.length < 3) return 0;
  const latlngs = pts.map((p) => L.latLng(p.lat, p.lng));
  // @ts-expect-error plugin
  return Math.abs(L.GeometryUtil.geodesicArea(latlngs));
};

const AreaTool = ({ active, points, onChange, onFinish }: Props) => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
    const layer = layerRef.current;
    return () => { layer.clearLayers(); };
  }, [map]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (points.length === 0) return;
    const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    if (points.length >= 3) {
      L.polygon(latlngs, {
        color: "hsl(var(--primary))", weight: 3,
        fillColor: "hsl(var(--primary))", fillOpacity: 0.2,
      }).addTo(layer);
    } else {
      L.polyline(latlngs, { color: "hsl(var(--primary))", weight: 3, dashArray: "6,6" }).addTo(layer);
    }
    points.forEach((p) => {
      L.circleMarker([p.lat, p.lng], {
        radius: 6, color: "hsl(var(--primary))", fillColor: "hsl(var(--primary))",
        fillOpacity: 1, weight: 2,
      }).addTo(layer);
    });
  }, [points]);

  useEffect(() => {
    if (!active) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      onChange([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    };
    const onDbl = () => { if (points.length >= 3) onFinish(); };
    map.on("click", onClick);
    map.on("dblclick", onDbl);
    map.doubleClickZoom.disable();
    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDbl);
      map.doubleClickZoom.enable();
    };
  }, [active, map, points, onChange, onFinish]);

  if (!active || points.length === 0) return null;
  const area = geodesicArea(points);
  const perim = points.length >= 2
    ? pathLength([...points, points[0]])
    : 0;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[500] bg-background/95 backdrop-blur border border-border rounded-lg shadow-xl px-4 py-3 flex items-center gap-4">
      <div>
        <div className="text-xs text-muted-foreground">Área</div>
        <div className="font-mono font-bold text-lg text-primary">
          {area < 10000 ? `${area.toFixed(0)} m²` : `${(area / 10000).toFixed(3)} ha`}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {(area / 10000).toFixed(4)} ha · {(area / 4046.856).toFixed(4)} acres · perím. {(perim / 1000).toFixed(2)} km
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="secondary" onClick={onFinish} disabled={points.length < 3} aria-label="Concluir">
          <Check size={16} />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onChange([])} aria-label="Limpar">
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export default AreaTool;
