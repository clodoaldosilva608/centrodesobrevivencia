import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Trophy, Gamepad2, Zap, Star, Pencil, Check } from "lucide-react";

const Perfil = () => {
  const { profile, addXP, completeChallenge, playGame, updateName, xpProgress, currentLevelXP, xpForNextLevel, allAchievements } = useUserProfile();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const saveName = () => {
    updateName(nameInput);
    setEditingName(false);
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        </div>

        {/* Quick Actions (for testing) */}
        <div className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <h2 className="font-heading text-xl text-foreground tracking-wider mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={() => { addXP(100); completeChallenge(); }}>
              <Trophy size={14} className="mr-1" /> Completar Desafio (+100 XP)
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { addXP(50); playGame(); }}>
              <Gamepad2 size={14} className="mr-1" /> Jogar Jogo (+50 XP)
            </Button>
            <Button size="sm" variant="outline" onClick={() => addXP(25)}>
              <Zap size={14} className="mr-1" /> Ganhar 25 XP
            </Button>
          </div>
        </div>

        {/* Achievements */}
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
