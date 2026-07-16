import { useState, useEffect, useCallback } from "react";
import type { Route } from "@/data/mapTypes";

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

  return { routes, addRoute, removeRoute, clearRoutes, mergeRoutes };
};
