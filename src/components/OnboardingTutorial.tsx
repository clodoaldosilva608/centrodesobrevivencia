import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, BookOpen, Gamepad2, Trophy, MapPin, Users, Flame, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sh_onboarding_done";

const steps = [
  {
    icon: Flame,
    title: "Bem-vindo ao Survival Hub!",
    description: "Sua plataforma completa de sobrevivencialismo, bushcraft e aventura. Vamos fazer um tour rápido!",
    emoji: "🔥",
  },
  {
    icon: Shield,
    title: "Equipamentos Táticos",
    description: "Explore uma curadoria de 30+ equipamentos essenciais para sobrevivência, com reviews detalhados e links de compra.",
    emoji: "🎒",
  },
  {
    icon: BookOpen,
    title: "Biblioteca de E-books",
    description: "Acesse 20+ e-books sobre primeiros socorros, navegação, purificação de água e muito mais.",
    emoji: "📚",
  },
  {
    icon: Gamepad2,
    title: "Jogos & Simuladores",
    description: "Teste suas habilidades no Simulador de Sobrevivência na Floresta e outros jogos interativos.",
    emoji: "🎮",
  },
  {
    icon: Trophy,
    title: "Desafios & XP",
    description: "Complete 50+ desafios, ganhe XP, suba de nível e desbloqueie conquistas exclusivas!",
    emoji: "🏆",
  },
  {
    icon: MapPin,
    title: "Mapa Interativo",
    description: "Explore pontos de interesse, descubra abrigos, fontes de água e áreas de risco no mapa de sobrevivência.",
    emoji: "🗺️",
  },
  {
    icon: Users,
    title: "Comunidade Ativa",
    description: "Conecte-se com outros sobreviventes, compartilhe experiências e suba no ranking!",
    emoji: "💬",
  },
];

const OnboardingTutorial = () => {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
        >
          {/* Close */}
          <button onClick={finish} aria-label="Fechar tutorial de boas-vindas" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary"
          >
            <Icon className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Emoji */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-3xl mb-2"
          >
            {current.emoji}
          </motion.p>

          {/* Text */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-heading text-xl text-foreground text-center tracking-wider mb-2"
          >
            {current.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-muted-foreground text-center leading-relaxed"
          >
            {current.description}
          </motion.p>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft size={14} /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {step + 1} / {steps.length}
            </span>
            <Button size="sm" onClick={next} className="gap-1">
              {step === steps.length - 1 ? "Começar!" : "Próximo"} <ChevronRight size={14} />
            </Button>
          </div>

          {/* Skip */}
          {step < steps.length - 1 && (
            <button onClick={finish} className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Pular tutorial
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTutorial;
