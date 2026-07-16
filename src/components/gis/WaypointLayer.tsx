import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Waypoint } from "@/data/mapTypes";
import { WAYPOINT_TYPES } from "@/data/waypointTypes";

interface Props {
  waypoints: Waypoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
}

const buildIcon = (wp: Waypoint, selected: boolean) => {
  const cfg = WAYPOINT_TYPES[wp.type];
  const border = selected ? "hsl(var(--primary))" : cfg.hex;
  const size = selected ? 36 : 30;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${wp.color};display:flex;align-items:center;justify-content:center;border:${selected ? 3 : 2}px solid ${border};box-shadow:0 2px 8px rgba(0,0,0,.5);font-size:${size * 0.5}px;line-height:1">${cfg.emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const WaypointLayer = ({ waypoints, selectedId, onSelect, onEdit }: Props) => {
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
    for (const wp of waypoints) {
      const selected = wp.id === selectedId;
      const marker = L.marker([wp.lat, wp.lng], { icon: buildIcon(wp, selected) })
        .addTo(layer)
        .bindTooltip(wp.name, { direction: "top", offset: [0, -16] });
      marker.on("click", () => onSelect(wp.id));
      if (onEdit) marker.on("dblclick", (e) => { L.DomEvent.stopPropagation(e); onEdit(wp.id); });
    }
  }, [waypoints, selectedId, onSelect, onEdit]);

  return null;
};

export default WaypointLayer;
