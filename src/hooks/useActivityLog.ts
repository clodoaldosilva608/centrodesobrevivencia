import { useState, useEffect, useCallback } from "react";

export interface ActivityEntry {
  id: string;
  action: string;
  icon: string;
  xp?: number;
  timestamp: string;
}

const STORAGE_KEY = "sh_activity_log";
const MAX_ENTRIES = 30;

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const logActivity = useCallback((action: string, icon: string, xp?: number) => {
    setEntries((prev) => {
      const entry: ActivityEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        action,
        icon,
        xp,
        timestamp: new Date().toISOString(),
      };
      return [entry, ...prev].slice(0, MAX_ENTRIES);
    });
  }, []);

  return { entries, logActivity };
}
