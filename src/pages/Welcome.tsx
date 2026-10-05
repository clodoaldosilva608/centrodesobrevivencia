import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, BookOpen, Gamepad2, Trophy, Flame, MapPin, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const benefits = [
  { icon: Shield, title: "Equipamentos Táticos", desc: "Acesse gear essencial para sobrevivência" },
  { icon: BookOpen, title: "E-books Exclusivos", desc: "Biblioteca completa de conhecimento" },
  { icon: Gamepad2, title: "Jogos & Simuladores", desc: "Teste suas habilidades em cenários reais" },
  { icon: Trophy, title: "Desafios Semanais", desc: "Complete missões e ganhe XP" },
  { icon: MapPin, title: "Mapa Interativo", desc: "Explore pontos de sobrevivência" },
  { icon: Users, title: "Comunidade Ativa", desc: "Conecte-se com outros sobreviventes" },
];

const Welcome = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Bem-vindo ao Survival Hub — Sobrevivência e Bushcraft"
        description="Conheça o Survival Hub: equipamentos táticos, e-books, jogos, mapa interativo e desafios para entusiastas de sobrevivência e bushcraft."
      />
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 border-2 border-primary glow-orange">
            <Flame className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl tracking-widest uppercase text-foreground">
            Survival <span className="text-gradient-survival">Hub</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            O hub definitivo para bushcraft, sobrevivencialismo e aventura.
            Prepare-se para qualquer situação.
          </p>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 max-w-md mx-auto w-full px-2"
        >
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-gradient-card rounded-lg border border-border p-3 text-center"
            >
              <b.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs font-heading text-foreground tracking-wide">{b.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* XP highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-5 py-2"
        >
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-sm text-foreground font-heading tracking-wider">
            Ganhe XP, suba de nível e desbloqueie conquistas!
          </span>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm mx-auto px-4"
        >
          <Button asChild className="flex-1 font-heading tracking-wider uppercase h-12 text-sm">
            <Link to="/">Entrar na Plataforma</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 font-heading tracking-wider uppercase h-12 text-sm border-primary text-primary hover:bg-primary/10">
            <Link to="/perfil">Criar Perfil</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-muted-foreground mt-4 text-center"
        >
          Gratuito • Sem cadastro obrigatório • Comece agora
        </motion.p>

        {/* Brand banner — Aprenda a sobreviver */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-12 w-full max-w-2xl mx-auto px-4"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <img
              src="/cursos/banner-aprenda-sobreviver.webp"
              alt="Aprenda a sobreviver em qualquer situação — Centro de Sobrevivência"
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
