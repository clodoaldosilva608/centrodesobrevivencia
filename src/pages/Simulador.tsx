import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { TreePine, Droplets, Flame, Compass, Heart, Skull } from "lucide-react";

interface GameState {
  scenario: string;
  health: number;
  water: number;
  energy: number;
  day: number;
  options: { label: string; icon: any; result: string; healthDelta: number; waterDelta: number; energyDelta: number }[];
  ended: boolean;
}

const initialState: GameState = {
  scenario: "Você acordou no meio de uma floresta densa. Está anoitecendo e a temperatura está caindo. Você tem apenas uma faca e um cantil vazio. O que você faz?",
  health: 100,
  water: 30,
  energy: 70,
  day: 1,
  ended: false,
  options: [
    { label: "Procurar água", icon: Droplets, result: "Você encontrou um riacho próximo e encheu seu cantil!", healthDelta: 0, waterDelta: 40, energyDelta: -15 },
    { label: "Construir abrigo", icon: TreePine, result: "Você construiu um abrigo com galhos e folhas. Está protegido!", healthDelta: 10, waterDelta: -10, energyDelta: -25 },
    { label: "Acender fogo", icon: Flame, result: "Usando sua faca e pedras, você conseguiu fazer fogo!", healthDelta: 5, waterDelta: -5, energyDelta: -20 },
    { label: "Explorar território", icon: Compass, result: "Você encontrou uma trilha que pode levar à civilização.", healthDelta: -10, waterDelta: -15, energyDelta: -30 },
  ],
};

const scenarios = [
  {
    scenario: "O sol nasceu e você ouviu sons de animais por perto. Seu estômago ronca de fome. O que você faz?",
    options: [
      { label: "Caçar animais", icon: Compass, result: "Você conseguiu capturar um coelho! Comida garantida.", healthDelta: 15, waterDelta: -10, energyDelta: -20 },
      { label: "Coletar frutos", icon: TreePine, result: "Encontrou frutas silvestres comestíveis!", healthDelta: 10, waterDelta: 5, energyDelta: -10 },
      { label: "Procurar água", icon: Droplets, result: "Encontrou uma nascente de água limpa!", healthDelta: 5, waterDelta: 50, energyDelta: -15 },
      { label: "Seguir a trilha", icon: Compass, result: "A trilha parece levar a uma estrada. Mas é longe...", healthDelta: -15, waterDelta: -20, energyDelta: -35 },
    ],
  },
  {
    scenario: "Uma tempestade se aproxima. Relâmpagos cortam o céu. Você precisa agir rápido!",
    options: [
      { label: "Reforçar abrigo", icon: TreePine, result: "Seu abrigo resistiu à tempestade!", healthDelta: 5, waterDelta: 10, energyDelta: -20 },
      { label: "Coletar água da chuva", icon: Droplets, result: "Você coletou litros de água fresca!", healthDelta: 0, waterDelta: 60, energyDelta: -10 },
      { label: "Procurar caverna", icon: Compass, result: "Encontrou uma caverna segura!", healthDelta: 10, waterDelta: 0, energyDelta: -25 },
      { label: "Ficar onde está", icon: Flame, result: "A chuva apagou seu fogo. Você está molhado e com frio.", healthDelta: -20, waterDelta: 15, energyDelta: -15 },
    ],
  },
];

const Simulador = () => {
  const [state, setState] = useState<GameState>(initialState);
  const [message, setMessage] = useState<string | null>(null);

  const handleChoice = (option: GameState["options"][0]) => {
    const newHealth = Math.max(0, Math.min(100, state.health + option.healthDelta));
    const newWater = Math.max(0, Math.min(100, state.water + option.waterDelta));
    const newEnergy = Math.max(0, Math.min(100, state.energy + option.energyDelta));
    const newDay = state.day + 1;
    const ended = newHealth <= 0 || newEnergy <= 0 || newWater <= 0;

    setMessage(option.result);

    setTimeout(() => {
      if (ended) {
        setState({ ...state, health: newHealth, water: newWater, energy: newEnergy, day: newDay, ended: true, scenario: newHealth <= 0 ? "Você não resistiu... Sua saúde chegou a zero." : newWater <= 0 ? "Você morreu de desidratação..." : "Você ficou sem energia para continuar...", options: [] });
      } else {
        const nextScenario = scenarios[(newDay - 2) % scenarios.length];
        setState({ ...nextScenario, health: newHealth, water: newWater, energy: newEnergy, day: newDay, ended: false });
      }
      setMessage(null);
    }, 2000);
  };

  const reset = () => {
    setState(initialState);
    setMessage(null);
  };

  const StatBar = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
    <div className="flex items-center gap-2">
      <Icon size={16} className={color} />
      <span className="text-xs text-muted-foreground w-16">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color === "text-destructive" ? "bg-destructive" : color === "text-primary" ? "bg-primary" : "bg-accent"}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-heading text-3xl text-foreground tracking-wider text-center uppercase mb-2">Simulador de Sobrevivência</h1>
        <p className="text-center text-muted-foreground mb-8">Suas decisões determinam seu destino</p>

        <div className="bg-gradient-card rounded-lg border border-border p-6 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="font-heading text-sm text-primary">Dia {state.day}</span>
            {state.ended && <span className="text-destructive font-heading text-sm flex items-center gap-1"><Skull size={14} /> Fim de Jogo</span>}
          </div>
          <StatBar label="Saúde" value={state.health} icon={Heart} color="text-destructive" />
          <StatBar label="Água" value={state.water} icon={Droplets} color="text-primary" />
          <StatBar label="Energia" value={state.energy} icon={Flame} color="text-accent-foreground" />
        </div>

        <div className="bg-gradient-card rounded-lg border border-border p-6">
          <AnimatePresence mode="wait">
            {message ? (
              <motion.p key="msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-foreground py-8 text-lg">
                {message}
              </motion.p>
            ) : (
              <motion.div key="scenario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-foreground leading-relaxed mb-6">{state.scenario}</p>
                {!state.ended ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.options.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => handleChoice(opt)}
                        className="flex items-center gap-3 bg-muted hover:bg-primary/10 hover:border-primary border border-border rounded-lg p-4 transition-colors text-left"
                      >
                        <opt.icon size={20} className="text-primary shrink-0" />
                        <span className="text-sm text-foreground font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button onClick={reset} className="w-full bg-primary text-primary-foreground font-heading tracking-wider uppercase py-3 rounded-md hover:opacity-90 transition-opacity">
                    Tentar Novamente
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default Simulador;
