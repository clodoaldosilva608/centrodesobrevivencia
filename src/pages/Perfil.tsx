import { useState } from "react";
import { isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume, playDiscoverSound } from "@/lib/sounds";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDailyMissions } from "@/hooks/useDailyMissions";
import { useStreak } from "@/hooks/useStreak";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { User, Trophy, Gamepad2, Zap, Star, Pencil, Check, Gift, Clock, Flame, History, Volume2, VolumeX, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const BADGE_RARITY: Record<string, { label: string; color: string; border: string; bg: string }> = {
  "first-challenge": { label: "Bronze", color: "text-amber-700", border: "border-amber-600/50", bg: "bg-amber-900/20" },
  explorer:          { label: "Prata", color: "text-slate-300", border: "border-slate-400/50", bg: "bg-slate-700/20" },
  "fire-master":     { label: "Bronze", color: "text-amber-700", border: "border-amber-600/50", bg: "bg-amber-900/20" },
  "shelter-expert":  { label: "Bronze", color: "text-amber-700", border: "border-amber-600/50", bg: "bg-amber-900/20" },
  "water-finder":    { label: "Bronze", color: "text-amber-700", border: "border-amber-600/50", bg: "bg-amber-900/20" },
  "survivor-10":     { label: "Prata", color: "text-slate-300", border: "border-slate-400/50", bg: "bg-slate-700/20" },
  gamer:             { label: "Prata", color: "text-slate-300", border: "border-slate-400/50", bg: "bg-slate-700/20" },
  master:            { label: "Ouro", color: "text-yellow-400", border: "border-yellow-400/50", bg: "bg-yellow-900/20" },
  veteran:           { label: "Ouro", color: "text-yellow-400", border: "border-yellow-400/50", bg: "bg-yellow-900/20" },
  legend:            { label: "Ouro", color: "text-yellow-400", border: "border-yellow-400/50", bg: "bg-yellow-900/20" },
};

const Perfil = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { profile, addXP, completeChallenge, playGame, updateName, xpProgress, currentLevelXP, xpForNextLevel, allAchievements } = useUserProfile();
  const dailyMissions = useDailyMissions();
  const streak = useStreak();
  const { entries, logActivity } = useActivityLog();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [volume, setVolume] = useState(getSoundVolume);

  const toggleSound = (val: boolean) => {
    setSoundOn(val);
    setSoundEnabled(val);
    if (val) playDiscoverSound();
  };
  const saveName = () => { updateName(nameInput); setEditingName(false); logActivity("Alterou o nome do perfil", "✏️"); };

  const handleCompleteMission = (id: string) => {
    const xp = dailyMissions.completeMission(id);
    if (xp > 0) {
      addXP(xp);
      logActivity(`Completou missão diária (+${xp} XP)`, "✅", xp);
      toast.success(`Missão completa! +${xp} XP`);
      setTimeout(() => {
        const bonus = dailyMissions.claimAllCompletedBonus();
        if (bonus > 0) {
          addXP(bonus);
          logActivity(`Bônus de todas as missões (+${bonus} XP)`, "🎉", bonus);
          toast.success(`🎉 Todas as missões completas! +${bonus} XP bônus!`);
        }
      }, 500);
    }
  };

  const handleClaimStreak = () => {
    const xp = streak.claimDailyBonus();
    if (xp > 0) {
      addXP(xp);
      logActivity(`Bônus de streak ${streak.currentStreak} dias (+${xp} XP)`, "🔥", xp);
      toast.success(`🔥 Streak ${streak.currentStreak} dias! +${xp} XP`);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-card rounded-xl border border-border p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full border-4 border-primary object-cover" />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="h-8 w-48" />
                    <Button size="icon" variant="ghost" onClick={saveName}><Check size={16} /></Button>
                  </div>
                ) : (
                  <>
                    <h1 className="font-heading text-2xl text-foreground tracking-wider">{profile.name}</h1>
                    <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                  </>
                )}
              </div>
              <p className="text-primary font-heading text-lg">Nível {profile.level}</p>
              <div className="mt-3 max-w-sm mx-auto md:mx-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{currentLevelXP} / {xpForNextLevel} XP</span>
                  <span>Nível {profile.level + 1}</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary font-heading text-3xl">
              <Zap size={28} />
              <span>{profile.xp} XP</span>
            </div>
          </div>
        </motion.div>

        {/* Stats + Streak */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Nível", value: profile.level, icon: Star },
            { label: "XP Total", value: profile.xp, icon: Zap },
            { label: "Desafios", value: profile.challengesCompleted, icon: Trophy },
            { label: "Jogos", value: profile.gamesPlayed, icon: Gamepad2 },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-card rounded-lg border border-border p-4 text-center">
              <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
          {/* Streak card */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-card rounded-lg border border-primary/30 p-4 text-center relative overflow-hidden">
            <Flame className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-heading text-foreground">{streak.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Streak (dias)</p>
            {!streak.todayClaimed && streak.currentStreak > 0 && (
              <Button size="sm" className="mt-2 h-6 text-[10px]" onClick={handleClaimStreak}>
                Resgatar XP
              </Button>
            )}
            {streak.todayClaimed && <p className="text-[10px] text-primary mt-1">✅ Resgatado</p>}
          </motion.div>
        </div>

        {/* Daily Missions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <h2 className="font-heading text-xl text-foreground tracking-wider">Missões Diárias</h2>
            </div>
            <span className="text-xs text-muted-foreground">{dailyMissions.completedCount}/{dailyMissions.totalMissions} completas</span>
          </div>
          <Progress value={(dailyMissions.completedCount / dailyMissions.totalMissions) * 100} className="h-2 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dailyMissions.missions.map((m) => (
              <motion.div key={m.id} whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${m.completed ? "border-primary/40 bg-primary/5 opacity-70" : "border-border hover:border-primary/30"}`}>
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                {m.completed ? (
                  <Check size={16} className="text-primary shrink-0" />
                ) : (
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-7" onClick={() => handleCompleteMission(m.id)}>
                    +{m.xpReward} XP
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
          {dailyMissions.allCompleted && !dailyMissions.allBonusClaimed && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 text-center">
              <Button onClick={() => { const b = dailyMissions.claimAllCompletedBonus(); if (b > 0) { addXP(b); logActivity(`Bônus missões diárias (+${b} XP)`, "🎁", b); toast.success(`🎉 +${b} XP bônus!`); } }} className="gap-2">
                <Gift size={16} /> Resgatar Bônus +{dailyMissions.bonusXP} XP
              </Button>
            </motion.div>
          )}
          {dailyMissions.allBonusClaimed && (
            <p className="text-center text-xs text-primary mt-3">✅ Todas as missões completas! Volte amanhã para novas missões.</p>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <h2 className="font-heading text-xl text-foreground tracking-wider mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={() => { addXP(100); completeChallenge(); logActivity("Completou um desafio (+100 XP)", "🏆", 100); }}>
              <Trophy size={14} className="mr-1" /> Completar Desafio (+100 XP)
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { addXP(50); playGame(); logActivity("Jogou um jogo (+50 XP)", "🎮", 50); }}>
              <Gamepad2 size={14} className="mr-1" /> Jogar Jogo (+50 XP)
            </Button>
            <Button size="sm" variant="outline" onClick={() => { addXP(25); logActivity("Ganhou XP bônus (+25 XP)", "⚡", 25); }}>
              <Zap size={14} className="mr-1" /> Ganhar 25 XP
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <h2 className="font-heading text-xl text-foreground tracking-wider mb-4">⚙️ Configurações</h2>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              {soundOn ? <Volume2 size={20} className="text-primary" /> : <VolumeX size={20} className="text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium text-foreground">Sons de Feedback</p>
                <p className="text-xs text-muted-foreground">Tocar sons ao descobrir pontos, conquistas e marcos</p>
              </div>
            </div>
            <Switch checked={soundOn} onCheckedChange={toggleSound} />
          </div>
          {soundOn && (
            <div className="flex items-center gap-4 p-3 rounded-lg border border-border/50 mt-3">
              <VolumeX size={16} className="text-muted-foreground shrink-0" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={5}
                onValueChange={([v]) => { const nv = v / 100; setVolume(nv); setSoundVolume(nv); }}
                onValueCommit={() => playDiscoverSound()}
                className="flex-1"
              />
              <Volume2 size={16} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(volume * 100)}%</span>
            </div>
          )}

          {/* Conta */}
          <div className="mt-4 pt-4 border-t border-border/50">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Logado como <span className="text-primary font-medium">{user.email}</span></p>
                  <p className="text-xs text-muted-foreground">via {user.provider === "google" ? "Google" : "E-mail"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </div>
            ) : (
              <a href="/login" className="text-sm text-primary hover:underline">Fazer login →</a>
            )}
          </div>
        </div>

        {/* Activity History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <History size={20} className="text-primary" />
            <h2 className="font-heading text-xl text-foreground tracking-wider">Atividades Recentes</h2>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada ainda. Complete missões e desafios!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {entries.slice(0, 15).map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 hover:border-border transition-colors">
                  <span className="text-lg">{e.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{e.action}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTime(e.timestamp)}</p>
                  </div>
                  {e.xp && <span className="text-xs text-primary font-heading shrink-0">+{e.xp} XP</span>}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Badges / Medals */}
        <div className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <h2 className="font-heading text-xl text-foreground tracking-wider mb-4">
            🎖️ Medalhas ({profile.achievements.length} / {allAchievements.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {allAchievements.map((ach) => {
              const unlocked = profile.achievements.find((a) => a.id === ach.id);
              const rarity = BADGE_RARITY[ach.id] || { label: "Bronze", color: "text-amber-700", border: "border-amber-600/50", bg: "bg-amber-900/20" };
              return (
                <motion.div key={ach.id} whileHover={unlocked ? { scale: 1.1, rotate: 3 } : {}}
                  className={`relative flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
                    unlocked ? `${rarity.border} ${rarity.bg}` : "border-border/30 bg-muted/10 opacity-40 grayscale"
                  }`}>
                  <span className="text-3xl mb-1">{ach.icon}</span>
                  <p className="text-[10px] font-semibold text-foreground leading-tight">{ach.title}</p>
                  <span className={`text-[9px] font-bold mt-1 ${rarity.color}`}>{rarity.label}</span>
                  {unlocked && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check size={10} className="text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Achievements List */}
        <div className="bg-gradient-card rounded-xl border border-border p-6">
          <h2 className="font-heading text-xl text-foreground tracking-wider mb-4">
            Conquistas ({profile.achievements.length} / {allAchievements.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allAchievements.map((ach) => {
              const unlocked = profile.achievements.find((a) => a.id === ach.id);
              return (
                <motion.div key={ach.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${unlocked ? "border-primary/50 bg-primary/5" : "border-border/50 opacity-50"}`}>
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{ach.title}</p>
                    <p className="text-xs text-muted-foreground">{ach.description}</p>
                  </div>
                  {unlocked && <Check size={16} className="text-primary ml-auto" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Perfil;
