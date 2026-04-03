import { useState, useEffect, useCallback } from "react";
import type { Waypoint } from "@/data/mapTypes";

const STORAGE_KEY = "sh_waypoints";

export const useWaypoints = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(waypoints));
  }, [waypoints]);

  const addWaypoint = useCallback((lat: number, lng: number, name: string, note: string, color: string) => {
    const wp: Waypoint = {
      id: crypto.randomUUID(),
      lat, lng, name, note, color,
      createdAt: new Date().toISOString(),
    };
    setWaypoints((prev) => [...prev, wp]);
    return wp;
  }, []);

  const removeWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const clearWaypoints = useCallback(() => setWaypoints([]), []);

  return { waypoints, addWaypoint, removeWaypoint, clearWaypoints };
};
