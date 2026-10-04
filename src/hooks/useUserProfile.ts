import { useState, useEffect, useCallback, useRef } from "react";
import { useAchievementNotification } from "@/contexts/AchievementNotifContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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
  // Map achievements
  { id: "map-first", title: "Primeiro Passo", description: "Descubra seu primeiro ponto no mapa", icon: "📍" },
  { id: "map-5", title: "Cartógrafo Iniciante", description: "Descubra 5 pontos no mapa", icon: "🗺️" },
  { id: "map-explorer", title: "Explorador Completo", description: "Descubra todos os pontos do mapa", icon: "🌍" },
  { id: "map-water-expert", title: "Rastreador de Água", description: "Descubra todos os pontos de água", icon: "🌊" },
  { id: "map-danger-master", title: "Mestre do Perigo", description: "Descubra todas as zonas de perigo", icon: "☠️" },
  { id: "map-waypoint", title: "Marcador de Trilha", description: "Crie seu primeiro waypoint", icon: "🚩" },
  { id: "map-event-survivor", title: "Sobrevivente de Eventos", description: "Sobreviva a 3 eventos aleatórios", icon: "⚡" },
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
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  let notifContext: { notify: (a: Achievement) => void } | null = null;
  try { notifContext = useAchievementNotification(); } catch { /* outside provider */ }
  const notifyRef = useRef(notifContext?.notify);
  notifyRef.current = notifContext?.notify;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Carregar perfil do Supabase quando o user estiver autenticado
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: dbProfile, error } = await supabase
          .from("profiles")
          .select("xp, level, streak_days")
          .eq("id", user.id)
          .maybeSingle();
        if (error) {
          console.warn("[useUserProfile] load from DB:", error.message);
          return;
        }
        if (cancelled || !dbProfile) return;
        setProfile((prev) => ({
          ...prev,
          // Override local com dados do banco (que é source-of-truth)
          name: user.name || prev.name,
          avatar: user.avatar || prev.avatar,
          xp: dbProfile.xp ?? prev.xp,
          level: dbProfile.level ?? prev.level,
        }));
      } catch (e) {
        console.warn("[useUserProfile] DB sync failed:", (e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, user?.name, user?.avatar]);

  const notifyNew = useCallback((prev: Achievement[], next: Achievement[]) => {
    const newOnes = next.filter((a) => !prev.find((p) => p.id === a.id));
    newOnes.forEach((a) => notifyRef.current?.(a));
  }, []);

  const addXP = useCallback((amount: number) => {
    setProfile((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = calcLevel(newXP);
      let newAchievements = [...prev.achievements];

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

      notifyNew(prev.achievements, newAchievements);
      // Persistir XP no Supabase se logado
      if (user?.id) {
        supabase
          .from("profiles")
          .update({ xp: newXP, level: newLevel })
          .eq("id", user.id)
          .then(({ error }) => {
            if (error) console.warn("[useUserProfile] addXP DB:", error.message);
          });
        // Log de atividade
        if (amount > 0) {
          supabase
            .from("activity_log")
            .insert({
              user_id: user.id,
              activity_type: "xp_gain",
              description: `+${amount} XP`,
              xp_awarded: amount,
            })
            .then(() => {});
        }
      }
      return { ...prev, xp: newXP, level: newLevel, achievements: newAchievements };
    });
  }, [notifyNew, user?.id]);

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

      notifyNew(prev.achievements, newAchievements);
      return { ...prev, challengesCompleted: completed, achievements: newAchievements };
    });
  }, [notifyNew]);

  const playGame = useCallback(() => {
    setProfile((prev) => {
      const played = prev.gamesPlayed + 1;
      let newAchievements = [...prev.achievements];

      if (played >= 5 && !newAchievements.find((a) => a.id === "gamer")) {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === "gamer")!;
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      notifyNew(prev.achievements, newAchievements);
      return { ...prev, gamesPlayed: played, achievements: newAchievements };
    });
  }, [notifyNew]);

  const updateName = useCallback((name: string) => {
    setProfile((prev) => ({ ...prev, name }));
    // Persistir no Supabase se o user estiver logado
    if (user?.id) {
      supabase
        .from("profiles")
        .update({ full_name: name, username: name })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) {
            console.warn("[useUserProfile] updateName DB:", error.message);
          }
        });
    }
  }, [user?.id]);

  const checkMapAchievements = useCallback((discoveredCount: number, totalPoints: number, waterDiscovered: number, totalWater: number, dangerDiscovered: number, totalDanger: number) => {
    setProfile((prev) => {
      let newAchievements = [...prev.achievements];
      const tryUnlock = (id: string) => {
        if (!newAchievements.find((a) => a.id === id)) {
          const ach = ACHIEVEMENTS_LIST.find((a) => a.id === id)!;
          if (ach) newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
        }
      };
      if (discoveredCount >= 1) tryUnlock("map-first");
      if (discoveredCount >= 5) tryUnlock("map-5");
      if (discoveredCount >= totalPoints && totalPoints > 0) tryUnlock("map-explorer");
      if (waterDiscovered >= totalWater && totalWater > 0) tryUnlock("map-water-expert");
      if (dangerDiscovered >= totalDanger && totalDanger > 0) tryUnlock("map-danger-master");
      notifyNew(prev.achievements, newAchievements);
      return newAchievements.length !== prev.achievements.length ? { ...prev, achievements: newAchievements } : prev;
    });
  }, [notifyNew]);

  const unlockAchievement = useCallback((id: string) => {
    setProfile((prev) => {
      if (prev.achievements.find((a) => a.id === id)) return prev;
      const ach = ACHIEVEMENTS_LIST.find((a) => a.id === id);
      if (!ach) return prev;
      const newAchievements = [...prev.achievements, { ...ach, unlockedAt: new Date().toISOString() }];
      notifyNew(prev.achievements, newAchievements);
      return { ...prev, achievements: newAchievements };
    });
  }, [notifyNew]);

  const xpForNextLevel = XP_PER_LEVEL;
  const currentLevelXP = profile.xp % XP_PER_LEVEL;
  const xpProgress = (currentLevelXP / xpForNextLevel) * 100;

  return {
    profile,
    addXP,
    completeChallenge,
    playGame,
    updateName,
    checkMapAchievements,
    unlockAchievement,
    xpProgress,
    currentLevelXP,
    xpForNextLevel,
    allAchievements: ACHIEVEMENTS_LIST,
  };
}
