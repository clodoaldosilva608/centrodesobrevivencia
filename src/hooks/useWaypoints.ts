import { useState, useEffect, useCallback } from "react";
import type { Waypoint, WaypointType } from "@/data/mapTypes";

const STORAGE_KEY = "sh_waypoints";

const migrate = (wp: Partial<Waypoint> & { id: string; lat: number; lng: number; name: string }): Waypoint => ({
  id: wp.id,
  lat: wp.lat,
  lng: wp.lng,
  name: wp.name,
  note: wp.note ?? "",
  color: wp.color ?? "#F97316",
  type: (wp.type as WaypointType) ?? "generico",
  createdAt: wp.createdAt ?? new Date().toISOString(),
});

export const useWaypoints = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const arr = JSON.parse(saved) as Waypoint[];
      return Array.isArray(arr) ? arr.map(migrate) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(waypoints));
  }, [waypoints]);

  const addWaypoint = useCallback(
    (data: Omit<Waypoint, "id" | "createdAt"> & Partial<Pick<Waypoint, "id" | "createdAt">>) => {
      const wp: Waypoint = {
        id: data.id ?? crypto.randomUUID(),
        lat: data.lat,
        lng: data.lng,
        name: data.name,
        note: data.note ?? "",
        color: data.color,
        type: data.type,
        createdAt: data.createdAt ?? new Date().toISOString(),
      };
      setWaypoints((prev) => [...prev, wp]);
      return wp;
    },
    [],
  );

  const updateWaypoint = useCallback((id: string, patch: Partial<Waypoint>) => {
    setWaypoints((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const removeWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const clearWaypoints = useCallback(() => setWaypoints([]), []);

  const mergeWaypoints = useCallback((incoming: Waypoint[]) => {
    setWaypoints((prev) => {
      const out = [...prev];
      let added = 0;
      for (const w of incoming) {
        const dup = out.some(
          (x) =>
            Math.abs(x.lat - w.lat) < 1e-5 &&
            Math.abs(x.lng - w.lng) < 1e-5 &&
            x.name.trim().toLowerCase() === w.name.trim().toLowerCase(),
        );
        if (dup) continue;
        out.push({ ...w, id: crypto.randomUUID() });
        added++;
      }
      return out;
    });
    return incoming.length;
  }, []);

  return { waypoints, addWaypoint, updateWaypoint, removeWaypoint, clearWaypoints, mergeWaypoints };
};
