import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import CategoryFilter from "@/components/CategoryFilter";
import { challenges } from "@/data/mockData";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Trophy, Clock, Zap, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";

const Desafios = () => {
  const categories = useMemo(() => [...new Set(challenges.map((c) => c.category))], []);
  const [selected, setSelected] = useState("Todos");
  const [completedIds, setCompletedIds] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem("sh_completed_challenges");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const { profile, addXP, completeChallenge } = useUserProfile();

  const filtered = selected === "Todos" ? challenges : challenges.filter((c) => c.category === selected);

  const handleComplete = (challengeId: number, xp: number, title: string) => {
    if (completedIds.has(challengeId)) return;

    const newCompleted = new Set(completedIds);
    newCompleted.add(challengeId);
    setCompletedIds(newCompleted);
    localStorage.setItem("sh_completed_challenges", JSON.stringify([...newCompleted]));

    addXP(xp);
    completeChallenge();

    toast.success(`🏆 Desafio "${title}" completo! +${xp} XP`, {
      description: `Nível ${profile.level} • ${profile.xp + xp} XP total`,
    });
  };

  return (
    <Layout>
      <Section title="Desafios de Sobrevivência" subtitle="Complete desafios semanais e ganhe XP">
        {/* XP bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mb-8 bg-muted/50 border border-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center gap-1.5 text-foreground font-heading">
              <Star size={14} className="text-primary" /> Nível {profile.level}
            </span>
            <span className="text-muted-foreground">{profile.xp % 500}/{500} XP</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(profile.xp % 500) / 500 * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {completedIds.size} desafios completados • {profile.xp} XP total
          </p>
        </motion.div>

        <CategoryFilter categories={categories} selected={selected} onSelect={setSelected} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {filtered.map((c, i) => {
            const done = completedIds.has(c.id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`bg-gradient-card rounded-lg border p-6 transition-colors ${
                  done ? "border-accent/50 opacity-80" : "border-border hover:border-glow"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    c.difficulty === "Extremo" ? "bg-destructive/30 text-destructive" :
                    c.difficulty === "Difícil" ? "bg-destructive/20 text-destructive" :
                    c.difficulty === "Médio" ? "bg-primary/20 text-primary" :
                    "bg-accent/30 text-accent-foreground"
                  }`}>
                    {c.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-primary">
                    <Zap size={14} />
                    <span className="font-heading text-sm">+{c.xp} XP</span>
                  </div>
                </div>
                <h3 className="font-heading text-xl text-foreground tracking-wide">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>Prazo: {c.deadline}</span>
                  </div>
                  {done ? (
                    <span className="text-accent-foreground text-xs font-semibold px-4 py-2 rounded-md bg-accent/20 flex items-center gap-1">
                      <CheckCircle size={12} /> Concluído
                    </span>
                  ) : (
                    <button
                      onClick={() => handleComplete(c.id, c.xp, c.title)}
                      className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <Trophy size={12} /> Completar Desafio
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">Nenhum desafio encontrado nesta categoria.</p>
        )}
      </Section>
    </Layout>
  );
};

export default Desafios;
