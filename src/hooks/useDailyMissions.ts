import { useState, useEffect, useCallback } from "react";

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  completed: boolean;
}

interface DailyMissionsState {
  missions: DailyMission[];
  lastReset: string;
  allCompletedBonusClaimed: boolean;
}

const MISSION_POOL: Omit<DailyMission, "completed">[] = [
  { id: "explore-map", title: "Explorar o Mapa", description: "Visite o mapa de sobrevivência", icon: "🗺️", xpReward: 30 },
  { id: "complete-challenge", title: "Desafio Diário", description: "Complete 1 desafio", icon: "🏆", xpReward: 50 },
  { id: "play-game", title: "Jogador do Dia", description: "Jogue 1 jogo ou simulador", icon: "🎮", xpReward: 40 },
  { id: "read-ebook", title: "Leitor Ávido", description: "Leia um e-book", icon: "📖", xpReward: 25 },
  { id: "community-post", title: "Socializar", description: "Publique na comunidade", icon: "💬", xpReward: 20 },
  { id: "check-equipment", title: "Revisar Equipamento", description: "Visite a página de equipamentos", icon: "🎒", xpReward: 15 },
  { id: "earn-xp", title: "Acumular XP", description: "Ganhe pelo menos 100 XP hoje", icon: "⚡", xpReward: 35 },
  { id: "visit-profile", title: "Checagem Pessoal", description: "Visite seu perfil", icon: "👤", xpReward: 10 },
];

const BONUS_XP = 150;
const STORAGE_KEY = "sh_daily_missions";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pickDailyMissions(): DailyMission[] {
  // Seed based on day for consistent daily selection
  const day = getTodayKey();
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = ((hash << 5) - hash + day.charCodeAt(i)) | 0;
  const shuffled = [...MISSION_POOL].sort((a, b) => {
    const ha = ((hash * 31 + a.id.charCodeAt(0)) | 0) & 0x7fffffff;
    const hb = ((hash * 31 + b.id.charCodeAt(0)) | 0) & 0x7fffffff;
    return ha - hb;
  });
  return shuffled.slice(0, 4).map((m) => ({ ...m, completed: false }));
}

export function useDailyMissions() {
  const [state, setState] = useState<DailyMissionsState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DailyMissionsState;
        if (parsed.lastReset === getTodayKey()) return parsed;
      }
    } catch {}
    return { missions: pickDailyMissions(), lastReset: getTodayKey(), allCompletedBonusClaimed: false };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check for daily reset
  useEffect(() => {
    if (state.lastReset !== getTodayKey()) {
      setState({ missions: pickDailyMissions(), lastReset: getTodayKey(), allCompletedBonusClaimed: false });
    }
  }, [state.lastReset]);

  const completeMission = useCallback((id: string): number => {
    let xpEarned = 0;
    setState((prev) => {
      const mission = prev.missions.find((m) => m.id === id);
      if (!mission || mission.completed) return prev;
      xpEarned = mission.xpReward;
      const updated = prev.missions.map((m) => m.id === id ? { ...m, completed: true } : m);
      return { ...prev, missions: updated };
    });
    return xpEarned;
  }, []);

  const claimAllCompletedBonus = useCallback((): number => {
    let bonus = 0;
    setState((prev) => {
      if (prev.allCompletedBonusClaimed) return prev;
      if (!prev.missions.every((m) => m.completed)) return prev;
      bonus = BONUS_XP;
      return { ...prev, allCompletedBonusClaimed: true };
    });
    return bonus;
  }, []);

  const allCompleted = state.missions.every((m) => m.completed);
  const completedCount = state.missions.filter((m) => m.completed).length;

  return {
    missions: state.missions,
    completeMission,
    claimAllCompletedBonus,
    allCompleted,
    allBonusClaimed: state.allCompletedBonusClaimed,
    completedCount,
    totalMissions: state.missions.length,
    bonusXP: BONUS_XP,
  };
}
