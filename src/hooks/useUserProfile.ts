import { useState, useEffect, useCallback } from "react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  xp: number;
  level: number;
  challengesCompleted: number;
  gamesPlayed: number;
  achievements: Achievement[];
  joinedAt: string;
}

const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: "first-challenge", title: "Primeiro Desafio", description: "Complete seu primeiro desafio", icon: "🏆" },
  { id: "explorer", title: "Explorador Iniciante", description: "Complete 5 desafios", icon: "🧭" },
  { id: "fire-master", title: "Mestre do Fogo", description: "Complete 3 desafios de fogo", icon: "🔥" },
  { id: "shelter-expert", title: "Especialista em Abrigo", description: "Complete 3 desafios de abrigo", icon: "🏕️" },
  { id: "water-finder", title: "Caçador de Água", description: "Complete 3 desafios de água", icon: "💧" },
  { id: "survivor-10", title: "Sobrevivente Dedicado", description: "Complete 10 desafios", icon: "⭐" },
  { id: "gamer", title: "Jogador Nato", description: "Jogue 5 jogos", icon: "🎮" },
  { id: "master", title: "Mestre da Sobrevivência", description: "Alcance o nível 10", icon: "👑" },
  { id: "veteran", title: "Veterano", description: "Alcance o nível 20", icon: "🎖️" },
  { id: "legend", title: "Lenda da Selva", description: "Alcance o nível 50", icon: "🌟" },
];

const XP_PER_LEVEL = 500;

function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Sobrevivente",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  xp: 0,
  level: 1,
  challengesCompleted: 0,
  gamesPlayed: 0,
  achievements: [],
  joinedAt: new Date().toISOString(),
};

const STORAGE_KEY = "sh_user_profile";

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const addXP = useCallback((amount: number) => {
    setProfile((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = calcLevel(newXP);
      let newAchievements = [...prev.achievements];

      // Check level achievements
      if (newLevel >= 10 && !newAchievements.find((a) => a.id === "master")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "master")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }
      if (newLevel >= 20 && !newAchievements.find((a) => a.id === "veteran")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "veteran")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }
      if (newLevel >= 50 && !newAchievements.find((a) => a.id === "legend")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "legend")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      return { ...prev, xp: newXP, level: newLevel, achievements: newAchievements };
    });
  }, []);

  const completeChallenge = useCallback(() => {
    setProfile((prev) => {
      const completed = prev.challengesCompleted + 1;
      let newAchievements = [...prev.achievements];

      if (completed === 1 && !newAchievements.find((a) => a.id === "first-challenge")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "first-challenge")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }
      if (completed >= 5 && !newAchievements.find((a) => a.id === "explorer")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "explorer")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }
      if (completed >= 10 && !newAchievements.find((a) => a.id === "survivor-10")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "survivor-10")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      return { ...prev, challengesCompleted: completed, achievements: newAchievements };
    });
  }, []);

  const playGame = useCallback(() => {
    setProfile((prev) => {
      const played = prev.gamesPlayed + 1;
      let newAchievements = [...prev.achievements];

      if (played >= 5 && !newAchievements.find((a) => a.id === "gamer")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "gamer")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      return { ...prev, gamesPlayed: played, achievements: newAchievements };
    });
  }, []);

  const updateName = useCallback((name: string) => {
    setProfile((prev) => ({ ...prev, name }));
  }, []);

  const xpForNextLevel = XP_PER_LEVEL;
  const currentLevelXP = profile.xp % XP_PER_LEVEL;
  const xpProgress = (currentLevelXP / xpForNextLevel) * 100;

  return {
    profile,
    addXP,
    completeChallenge,
    playGame,
    updateName,
    xpProgress,
    currentLevelXP,
    xpForNextLevel,
    allAchievements: ACHIEVEMENTS_LIST,
  };
}
