import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { ArrowLeft, Heart, Droplets, Zap, TreePine, Flame, Home, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

interface GameState {
  health: number;
  water: number;
  energy: number;
  day: number;
  alive: boolean;
  won: boolean;
  log: string[];
}

interface GameOption {
  label: string;
  icon: React.ReactNode;
  action: (state: GameState) => Partial<GameState> & { message: string };
}

const SCENARIOS: { text: string; options: GameOption[] }[] = [
  {
    text: "Você acordou perdido no meio de uma floresta densa. A noite está chegando e a temperatura está caindo. O que você faz?",
    options: [
      {
        label: "Construir um abrigo",
        icon: <Home size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 20),
          health: Math.min(100, s.health + 5),
          message: "Você construiu um abrigo com galhos e folhas. Está protegido do vento e do frio.",
        }),
      },
      {
        label: "Acender uma fogueira",
        icon: <Flame size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 15),
          health: Math.min(100, s.health + 10),
          message: "Você conseguiu acender fogo usando atrito. O calor aquece seu corpo e afasta animais.",
        }),
      },
      {
        label: "Explorar os arredores",
        icon: <Eye size={16} />,
        action: (s) => {
          const lucky = Math.random() > 0.4;
          return lucky
            ? { energy: Math.max(0, s.energy - 25), water: Math.min(100, s.water + 20), message: "Você encontrou um riacho próximo! Conseguiu beber água fresca." }
            : { energy: Math.max(0, s.energy - 30), health: Math.max(0, s.health - 10), message: "Você se perdeu ainda mais e tropeçou em raízes. Gastou muita energia." };
        },
      },
    ],
  },
  {
    text: "O sol nasceu e você está com sede. Há sinais de um rio ao norte e frutas desconhecidas em uma árvore próxima.",
    options: [
      {
        label: "Ir até o rio",
        icon: <Droplets size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 20),
          water: Math.min(100, s.water + 35),
          message: "Você encontrou o rio e bebeu água filtrada por pedras. Sua sede foi saciada!",
        }),
      },
      {
        label: "Comer as frutas",
        icon: <TreePine size={16} />,
        action: (s) => {
          const safe = Math.random() > 0.3;
          return safe
            ? { energy: Math.min(100, s.energy + 20), message: "As frutas eram comestíveis! Você recuperou energia." }
            : { health: Math.max(0, s.health - 25), message: "As frutas eram levemente tóxicas. Você passou mal." };
        },
      },
      {
        label: "Construir um filtro de água",
        icon: <Droplets size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 15),
          water: Math.min(100, s.water + 25),
          message: "Usando areia, carvão e tecido, você criou um filtro rudimentar e purificou água.",
        }),
      },
    ],
  },
  {
    text: "Você ouviu sons de animais selvagens se aproximando. A noite está caindo novamente.",
    options: [
      {
        label: "Subir em uma árvore",
        icon: <TreePine size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 20),
          health: Math.min(100, s.health + 5),
          message: "De cima da árvore, você está seguro. Os animais passaram embaixo sem te notar.",
        }),
      },
      {
        label: "Manter a fogueira acesa",
        icon: <Flame size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 10),
          message: "O fogo manteve os animais afastados. Você passou a noite em segurança.",
        }),
      },
      {
        label: "Ficar imóvel e silencioso",
        icon: <Eye size={16} />,
        action: (s) => {
          const safe = Math.random() > 0.5;
          return safe
            ? { message: "Os animais não perceberam você e seguiram adiante." }
            : { health: Math.max(0, s.health - 20), message: "Um animal te detectou e você sofreu arranhões fugindo." };
        },
      },
    ],
  },
  {
    text: "Terceiro dia. Você está enfraquecido mas avistou fumaça ao longe — pode ser civilização ou perigo.",
    options: [
      {
        label: "Seguir a fumaça",
        icon: <Eye size={16} />,
        action: (s) => {
          const rescue = Math.random() > 0.3;
          return rescue
            ? { health: 100, water: 100, energy: 100, message: "Era um acampamento de resgate! Você foi salvo! 🎉" }
            : { energy: Math.max(0, s.energy - 30), message: "Era apenas uma queimada natural. Você gastou energia em vão." };
        },
      },
      {
        label: "Criar sinais de fumaça",
        icon: <Flame size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 15),
          message: "Você criou sinais de fumaça. Talvez alguém veja amanhã.",
        }),
      },
      {
        label: "Ficar e fortalecer o abrigo",
        icon: <Home size={16} />,
        action: (s) => ({
          energy: Math.max(0, s.energy - 10),
          health: Math.min(100, s.health + 10),
          message: "Você reforçou seu abrigo e descansou. Suas forças se recuperaram um pouco.",
        }),
      },
    ],
  },
];

const DAYS_TO_WIN = 5;

const SimuladorFloresta = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addXP, playGame } = useUserProfile();

  const [state, setState] = useState<GameState>({
    health: 100,
    water: 80,
    energy: 90,
    day: 1,
    alive: true,
    won: false,
    log: ["Dia 1: Você acorda perdido em uma floresta desconhecida..."],
  });

  const scenarioIndex = Math.min(state.day - 1, SCENARIOS.length - 1);
  const scenario = SCENARIOS[scenarioIndex];

  // Canvas background rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Sky gradient based on time of day
    const isNight = state.day % 2 === 0;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    if (isNight) {
      skyGrad.addColorStop(0, "#0a0e1a");
      skyGrad.addColorStop(1, "#1a2a3a");
    } else {
      skyGrad.addColorStop(0, "#1a3a2a");
      skyGrad.addColorStop(1, "#2a4a3a");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground
    const groundGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    groundGrad.addColorStop(0, "#1a2a1a");
    groundGrad.addColorStop(1, "#0d1a0d");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // Trees
    const drawTree = (x: number, treeH: number, shade: string) => {
      ctx.fillStyle = "#2a1a0a";
      ctx.fillRect(x - 4, h * 0.6 - treeH * 0.3, 8, treeH * 0.3);
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(x - treeH * 0.25, h * 0.6 - treeH * 0.3);
      ctx.lineTo(x, h * 0.6 - treeH);
      ctx.lineTo(x + treeH * 0.25, h * 0.6 - treeH * 0.3);
      ctx.fill();
    };

    for (let i = 0; i < 12; i++) {
      const tx = (w / 12) * i + Math.sin(i * 3) * 20 + 30;
      const th = 60 + Math.sin(i * 2) * 20;
      drawTree(tx, th, i % 2 === 0 ? "#1a4a2a" : "#0d3a1d");
    }

    // Stars at night
    if (isNight) {
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 30; i++) {
        const sx = Math.sin(i * 7.3) * w * 0.5 + w * 0.5;
        const sy = Math.cos(i * 5.1) * h * 0.25 + h * 0.15;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Fire glow if alive
    if (state.alive && state.day > 1) {
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.65, 2, w * 0.5, h * 0.65, 40);
      grad.addColorStop(0, "rgba(255, 140, 0, 0.6)");
      grad.addColorStop(1, "rgba(255, 140, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(w * 0.5 - 40, h * 0.65 - 40, 80, 80);
    }
  }, [state.day, state.alive]);

  const handleChoice = useCallback((option: GameOption) => {
    setState((prev) => {
      if (!prev.alive || prev.won) return prev;

      const result = option.action(prev);
      const newState: GameState = {
        ...prev,
        ...result,
        log: [...prev.log, `Dia ${prev.day}: ${result.message}`],
      };

      // Natural decay
      newState.water = Math.max(0, newState.water - 10);
      newState.energy = Math.max(0, newState.energy - 5);

      // Check death
      if (newState.health <= 0 || newState.water <= 0 || newState.energy <= 0) {
        newState.alive = false;
        newState.log.push("💀 Você não resistiu. Fim da simulação.");
        return newState;
      }

      // Check win (rescued or survived enough days)
      if (result.message.includes("salvo") || newState.day >= DAYS_TO_WIN) {
        newState.won = true;
        newState.log.push("🎉 Parabéns! Você sobreviveu à floresta!");
        return newState;
      }

      newState.day = prev.day + 1;
      return newState;
    });
  }, []);

  // Award XP on game end
  useEffect(() => {
    if (state.won) {
      addXP(200);
      playGame();
      toast.success("🎉 Simulação completa! +200 XP");
    } else if (!state.alive) {
      addXP(50);
      playGame();
      toast.info("Você sobreviveu " + (state.day - 1) + " dias. +50 XP");
    }
  }, [state.won, state.alive]);

  const restart = () => {
    setState({
      health: 100,
      water: 80,
      energy: 90,
      day: 1,
      alive: true,
      won: false,
      log: ["Dia 1: Você acorda perdido em uma floresta desconhecida..."],
    });
  };

  const statBar = (label: string, value: number, icon: React.ReactNode, color: string) => (
    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground font-bold">{value}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <SEO title="Simulador Floresta — Sobreviva 7 Dias" description="Simulador realista em Canvas: gerencie saúde, água e energia para sobreviver na floresta." />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/jogos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Voltar aos jogos
        </Link>

        <h1 className="font-heading text-3xl text-foreground tracking-wider mb-2">Simulador de Sobrevivência na Floresta</h1>
        <p className="text-muted-foreground mb-6">Tome decisões inteligentes para sobreviver {DAYS_TO_WIN} dias na floresta.</p>

        {/* Canvas */}
        <div className="rounded-xl overflow-hidden border border-border mb-6">
          <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto bg-background" />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-6 bg-muted/30 border border-border rounded-lg p-4">
          {statBar("Vida", state.health, <Heart size={14} />, "bg-destructive")}
          {statBar("Água", state.water, <Droplets size={14} />, "bg-blue-500")}
          {statBar("Energia", state.energy, <Zap size={14} />, "bg-primary")}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <span className="text-xs text-muted-foreground">Dia</span>
            <span className="font-heading text-foreground text-lg">{state.day}</span>
          </div>
        </div>

        {/* Scenario & choices */}
        {state.alive && !state.won && (
          <motion.div
            key={state.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-card border border-border rounded-lg p-6 mb-6"
          >
            <p className="text-foreground leading-relaxed mb-5">{scenario.text}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {scenario.options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoice(opt)}
                  className="flex items-center gap-2 bg-muted hover:bg-primary/20 border border-border hover:border-primary/50 text-foreground text-sm px-4 py-3 rounded-lg transition-colors text-left"
                >
                  {opt.icon}
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Game over / win */}
        {(!state.alive || state.won) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center py-10 rounded-lg border ${
              state.won ? "bg-accent/10 border-accent/30" : "bg-destructive/10 border-destructive/30"
            }`}
          >
            <p className="text-4xl mb-3">{state.won ? "🎉" : "💀"}</p>
            <h2 className="font-heading text-2xl text-foreground tracking-wider">
              {state.won ? "Você Sobreviveu!" : "Fim da Jornada"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {state.won ? `Você sobreviveu ${state.day} dias na floresta!` : `Você resistiu ${state.day - 1} dias.`}
            </p>
            <button onClick={restart} className="mt-6 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:opacity-90 transition-opacity">
              Jogar Novamente
            </button>
          </motion.div>
        )}

        {/* Log */}
        <div className="mt-6 bg-muted/30 border border-border rounded-lg p-4 max-h-48 overflow-y-auto">
          <h3 className="font-heading text-sm text-foreground tracking-wide mb-2">Diário de Sobrevivência</h3>
          {state.log.map((entry, i) => (
            <p key={i} className="text-xs text-muted-foreground py-1 border-b border-border/50 last:border-0">
              {entry}
            </p>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SimuladorFloresta;
