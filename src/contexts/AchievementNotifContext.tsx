import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import AchievementNotification from "@/components/AchievementNotification";
import type { Achievement } from "@/hooks/useUserProfile";

interface AchievementNotifContextType {
  notify: (achievement: Achievement) => void;
}

const AchievementNotifContext = createContext<AchievementNotifContextType>({ notify: () => {} });

export const useAchievementNotification = () => useContext(AchievementNotifContext);

export const AchievementNotifProvider = ({ children }: { children: ReactNode }) => {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);

  const notify = useCallback((ach: Achievement) => {
    setCurrent((prev) => {
      if (prev) {
        setQueue((q) => [...q, ach]);
        return prev;
      }
      return ach;
    });
  }, []);

  const dismiss = useCallback(() => {
    setCurrent(null);
    setTimeout(() => {
      setQueue((q) => {
        if (q.length > 0) {
          const [next, ...rest] = q;
          setCurrent(next);
          return rest;
        }
        return q;
      });
    }, 300);
  }, []);

  return (
    <AchievementNotifContext.Provider value={{ notify }}>
      {children}
      <AchievementNotification achievement={current} onDismiss={dismiss} />
    </AchievementNotifContext.Provider>
  );
};
