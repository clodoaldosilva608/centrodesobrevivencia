import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import { challenges } from "@/data/mockData";
import { Trophy, Clock, Zap } from "lucide-react";

const Desafios = () => (
  <Layout>
    <Section title="Desafios de Sobrevivência" subtitle="Complete desafios semanais e ganhe XP">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {challenges.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-card rounded-lg border border-border p-6 hover:border-glow transition-colors"
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
              <button className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1">
                <Trophy size={12} /> Aceitar Desafio
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  </Layout>
);

export default Desafios;
