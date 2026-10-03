import { useState, useEffect, useCallback } from "react";
import type { Route } from "@/data/mapTypes";
import type { LatLng } from "@/lib/geo";

const STORAGE_KEY = "sh_routes";

export const useRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Route[]) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  }, [routes]);

  const addRoute = useCallback(
    (data: Omit<Route, "id" | "createdAt"> & Partial<Pick<Route, "id" | "createdAt">>) => {
      const r: Route = {
        id: data.id ?? crypto.randomUUID(),
        name: data.name,
        color: data.color,
        points: data.points,
        notes: data.notes,
        createdAt: data.createdAt ?? new Date().toISOString(),
      };
      setRoutes((prev) => [...prev, r]);
      return r;
    },
    [],
  );

  const updateRoute = useCallback((id: string, patch: Partial<Route>) => {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  /** Altera os pontos e invalida o perfil de elevação em cache. */
  const setPoints = useCallback((id: string, fn: (pts: LatLng[]) => LatLng[]) => {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, points: fn([...r.points]), profile: undefined } : r)));
  }, []);

  const movePoint = useCallback((id: string, i: number, p: LatLng) =>
    setPoints(id, (pts) => { pts[i] = p; return pts; }), [setPoints]);
  const reorderPoint = useCallback((id: string, from: number, to: number) =>
    setPoints(id, (pts) => {
      if (to < 0 || to >= pts.length) return pts;
      const [m] = pts.splice(from, 1); pts.splice(to, 0, m); return pts;
    }), [setPoints]);
  const insertPoint = useCallback((id: string, index: number, p: LatLng) =>
    setPoints(id, (pts) => { pts.splice(index, 0, p); return pts; }), [setPoints]);
  const removePoint = useCallback((id: string, i: number) =>
    setPoints(id, (pts) => { pts.splice(i, 1); return pts; }), [setPoints]);
  const duplicatePoint = useCallback((id: string, i: number) =>
    setPoints(id, (pts) => {
      const a = pts[i], b = pts[i + 1];
      // duplica levemente deslocado (meio do caminho ao próximo, ou pequeno offset)
      const np = b ? { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 } : { lat: a.lat + 0.0005, lng: a.lng + 0.0005 };
      pts.splice(i + 1, 0, np); return pts;
    }), [setPoints]);

  const duplicateRoute = useCallback((id: string) => {
    let copy: Route | null = null;
    setRoutes((prev) => {
      const src = prev.find((r) => r.id === id);
      if (!src) return prev;
      copy = { ...src, id: crypto.randomUUID(), name: `${src.name} (cópia)`, createdAt: new Date().toISOString() };
      return [...prev, copy];
    });
    return copy;
  }, []);

  const removeRoute = useCallback((id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearRoutes = useCallback(() => setRoutes([]), []);

  const mergeRoutes = useCallback((incoming: Route[]) => {
    setRoutes((prev) => [
      ...prev,
      ...incoming.map((r) => ({ ...r, id: crypto.randomUUID() })),
    ]);
    return incoming.length;
  }, []);

  return {
    routes, addRoute, updateRoute, removeRoute, clearRoutes, mergeRoutes, duplicateRoute,
    movePoint, reorderPoint, insertPoint, removePoint, duplicatePoint,
  };
};
