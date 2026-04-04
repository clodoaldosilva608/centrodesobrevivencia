import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useStreak } from "@/hooks/useStreak";
import { useDailyMissions } from "@/hooks/useDailyMissions";
import { BarChart3, TrendingUp, Trophy, Clock, Flame, Target, Zap, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const Estatisticas = () => {
  const { profile, xpProgress, currentLevelXP, xpForNextLevel } = useUserProfile();
  const { entries } = useActivityLog();
  const streak = useStreak();
  const dailyMissions = useDailyMissions();

  // XP per day (last 7 days)
  const xpPerDay = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
      days[key] = 0;
    }
    entries.forEach((e) => {
      if (!e.xp) return;
      const d = new Date(e.timestamp);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff > 6) return;
      const key = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
      if (key in days) days[key] += e.xp;
    });
    return Object.entries(days).map(([name, xp]) => ({ name, xp }));
  }, [entries]);

  // Activities by type
  const activityBreakdown = useMemo(() => {
    const cats: Record<string, number> = { "Desafios": 0, "Jogos": 0, "Missões": 0, "Outros": 0 };
    entries.forEach((e) => {
      if (e.action.includes("desafio") || e.action.includes("Desafio")) cats["Desafios"]++;
      else if (e.action.includes("jogo") || e.action.includes("Jogo")) cats["Jogos"]++;
      else if (e.action.includes("missão") || e.action.includes("Missão")) cats["Missões"]++;
      else cats["Outros"]++;
    });
    return Object.entries(cats).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const pieColors = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#8b5cf6"];

  const chartConfig = {
    xp: { label: "XP", color: "hsl(var(--primary))" },
  };

  const totalXPFromActivities = entries.reduce((s, e) => s + (e.xp || 0), 0);
  const avgXPPerDay = xpPerDay.length > 0 ? Math.round(totalXPFromActivities / 7) : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground tracking-wider text-center uppercase mb-2">
            📊 Estatísticas
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Acompanhe seu progresso e desempenho na plataforma
          </p>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "XP Total", value: profile.xp.toLocaleString(), icon: Zap, color: "text-primary" },
            { label: "Nível", value: profile.level, icon: TrendingUp, color: "text-primary" },
            { label: "Desafios", value: profile.challengesCompleted, icon: Trophy, color: "text-primary" },
            { label: "Streak", value: `${streak.currentStreak} dias`, icon: Flame, color: "text-primary" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-card rounded-xl border border-border p-4 text-center">
              <s.icon className={`h-6 w-6 ${s.color} mx-auto mb-2`} />
              <p className="text-2xl font-heading text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* XP Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-primary" />
            <h2 className="font-heading text-lg text-foreground">Progresso de Nível</h2>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Nível {profile.level}</span>
            <span>{currentLevelXP} / {xpForNextLevel} XP</span>
            <span>Nível {profile.level + 1}</span>
          </div>
          <Progress value={xpProgress} className="h-3 mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            Faltam <span className="text-primary font-bold">{xpForNextLevel - currentLevelXP} XP</span> para o próximo nível
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* XP Per Day Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                <h2 className="font-heading text-lg text-foreground">XP por Dia</h2>
              </div>
              <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
            </div>
            <div className="h-52">
              <ChartContainer config={chartConfig}>
                <BarChart data={xpPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="xp" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Média: <span className="text-primary font-bold">{avgXPPerDay} XP/dia</span>
            </p>
          </motion.div>

          {/* Activity Breakdown */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-primary" />
              <h2 className="font-heading text-lg text-foreground">Atividades por Tipo</h2>
            </div>
            {activityBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Nenhuma atividade registrada ainda. Complete desafios e missões!
              </p>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activityBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={70} innerRadius={35} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                      {activityBreakdown.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Stats Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-xl border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-primary" />
            <h2 className="font-heading text-lg text-foreground">Resumo Geral</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total de Atividades", value: entries.length },
              { label: "Conquistas", value: `${profile.achievements.length}` },
              { label: "Jogos Jogados", value: profile.gamesPlayed },
              { label: "Missões Hoje", value: `${dailyMissions.completedCount}/${dailyMissions.totalMissions}` },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-lg border border-border/50 bg-muted/20">
                <p className="text-xl font-heading text-foreground">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent XP Gains */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="font-heading text-lg text-foreground">Últimos Ganhos de XP</h2>
          </div>
          {entries.filter((e) => e.xp).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum XP registrado ainda.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.filter((e) => e.xp).slice(0, 10).map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                  <span className="text-lg">{e.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{e.action}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(e.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm text-primary font-heading">+{e.xp} XP</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Estatisticas;
