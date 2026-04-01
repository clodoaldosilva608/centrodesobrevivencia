import { useState, useEffect } from "react";

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastVisit: string;
  todayClaimed: boolean;
}

const STORAGE_KEY = "sh_streak";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const STREAK_REWARDS = [
  { days: 1, xp: 10 },
  { days: 3, xp: 30 },
  { days: 5, xp: 50 },
  { days: 7, xp: 100 },
  { days: 14, xp: 200 },
  { days: 30, xp: 500 },
];

export function useStreak() {
  const [state, setState] = useState<StreakState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { currentStreak: 0, longestStreak: 0, lastVisit: "", todayClaimed: false };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check streak on load
  useEffect(() => {
    const today = getTodayKey();
    if (state.lastVisit === today) return; // Already visited today

    setState((prev) => {
      const yesterday = getYesterdayKey();
      let newStreak = prev.lastVisit === yesterday ? prev.currentStreak + 1 : 1;
      const newLongest = Math.max(newStreak, prev.longestStreak);
      return { currentStreak: newStreak, longestStreak: newLongest, lastVisit: today, todayClaimed: false };
    });
  }, []);

  const claimDailyBonus = (): number => {
    if (state.todayClaimed) return 0;
    const reward = STREAK_REWARDS.reduce((best, r) => (state.currentStreak >= r.days ? r : best), STREAK_REWARDS[0]);
    setState((prev) => ({ ...prev, todayClaimed: true }));
    return reward.xp;
  };

  const nextMilestone = STREAK_REWARDS.find((r) => r.days > state.currentStreak);

  return {
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    todayClaimed: state.todayClaimed,
    claimDailyBonus,
    nextMilestone,
    streakRewards: STREAK_REWARDS,
  };
}
