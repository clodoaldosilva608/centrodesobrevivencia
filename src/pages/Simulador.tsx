import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useActivityLog } from "@/hooks/useActivityLog";
import {
  Heart, Droplets, Flame, Utensils, Thermometer, Brain,
  Backpack, Skull, Trophy, Sun, Moon, Map as MapIcon,
  Trees, Mountain, Waves, Compass, ArrowRight, RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  playXPSound, playDiscoverSound, playAchievementSound, playCompletionSound,
} from "@/lib/sounds";

/* ------------------------------------------------------------------ *
 *  TYPES
 * ------------------------------------------------------------------ */

type BiomeId = "floresta" | "deserto" | "montanha" | "selva" | "costa";
type Phase = "start" | "playing" | "result" | "event" | "dead" | "victory";

interface Stats {
  health: number;
  hydration: number;
  energy: number;
  hunger: number;
  warmth: number;
  morale: number;
}
type StatKey = keyof Stats;
type StatChanges = Partial<Stats>;

interface Option {
  label: string;
  icon: string; // emoji
  resultText: string;
  resultImage?: string; // Unsplash URL for result
  statChanges: StatChanges;
  itemFound?: string;
  itemLost?: string;
  xpReward?: number;
}

interface Scenario {
  id: string;
  biome: BiomeId;
  time: "day" | "night";
  backgroundImage: string; // Unsplash URL
  text: string;
  options: Option[];
}

interface RandomEvent {
  id: string;
  biome: BiomeId | "any";
  text: string;
  image: string;
  effect: StatChanges;
  itemFound?: string;
}

interface Biome {
  id: BiomeId;
  name: string;
  emoji: string;
  blurb: string;
  image: string;
}

interface Difficulty {
  id: string;
  label: string;
  emoji: string;
  daysToWin: number;
  start: Stats;
  decay: StatChanges;
  xp: number;
  desc: string;
}

interface DeathInfo {
  cause: string;
  day: number;
  stats: Stats;
}

/* ------------------------------------------------------------------ *
 *  STATIC DATA
 * ------------------------------------------------------------------ */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&h=800&fit=crop&auto=format&q=70`;

const ITEMS: Record<string, { name: string; emoji: string }> = {
  faca: { name: "Faca", emoji: "🔪" },
  cantil: { name: "Cantil", emoji: "🫗" },
  isqueiro: { name: "Isqueiro", emoji: "🔥" },
  corda: { name: "Corda", emoji: "🪢" },
  bandagem: { name: "Bandagem", emoji: "🩹" },
  peixe: { name: "Peixe", emoji: "🐟" },
  frutas: { name: "Frutas", emoji: "🫐" },
  mapa: { name: "Mapa", emoji: "🗺️" },
  radio: { name: "Rádio", emoji: "📻" },
  comida: { name: "Comida", emoji: "🍖" },
  lanterna: { name: "Lanterna", emoji: "🔦" },
  cobertor: { name: "Cobertor", emoji: "🧣" },
  anzol: { name: "Anzol", emoji: "🪝" },
  agua: { name: "Água", emoji: "💧" },
  kit: { name: "Kit Médico", emoji: "📦" },
};

const STAT_CONFIG: { key: StatKey; label: string; icon: LucideIcon; text: string; bar: string }[] = [
  { key: "health", label: "Saúde", icon: Heart, text: "text-rose-500", bar: "bg-rose-500" },
  { key: "hydration", label: "Hidratação", icon: Droplets, text: "text-teal-400", bar: "bg-teal-500" },
  { key: "energy", label: "Energia", icon: Flame, text: "text-amber-500", bar: "bg-amber-500" },
  { key: "hunger", label: "Nutrição", icon: Utensils, text: "text-orange-500", bar: "bg-orange-500" },
  { key: "warmth", label: "Calor", icon: Thermometer, text: "text-red-500", bar: "bg-red-500" },
  { key: "morale", label: "Moral", icon: Brain, text: "text-fuchsia-500", bar: "bg-fuchsia-500" },
];

const BIOMES: Biome[] = [
  {
    id: "floresta",
    name: "Floresta",
    emoji: "🌲",
    blurb: "Sombra, riachos e madeira — mas predadores espreitam nas sombras.",
    image: U("1448375240586-88270c653f25"),
  },
  {
    id: "deserto",
    name: "Deserto",
    emoji: "🏜️",
    blurb: "Sol escaldante de dia, frio cortante à noite. Água quase inexistente.",
    image: U("1503561272887-c827f0b3e2e9"),
  },
  {
    id: "montanha",
    name: "Montanha",
    emoji: "⛰️",
    blurb: "Ar rarefeito, frio extremo e terreno traiçoeiro nas alturas.",
    image: U("1464822759473-e30ad3d0ee54"),
  },
  {
    id: "selva",
    name: "Selva",
    emoji: "🌴",
    blurb: "Umidade opressiva, insetos, cobras e predadores silenciosos.",
    image: U("1441974234615-d0d5e1f0c5c7"),
  },
  {
    id: "costa",
    name: "Costa",
    emoji: "🌊",
    blurb: "Maré, peixes e sal — oportunidade e perigo lado a lado.",
    image: U("1507525428034-b723cd880d80"),
  },
];

const BIOME_ICON: Record<BiomeId, LucideIcon> = {
  floresta: Trees,
  deserto: Sun,
  montanha: Mountain,
  selva: Trees,
  costa: Waves,
};

const BIOME_GRADIENT: Record<BiomeId, { day: string; night: string }> = {
  floresta: {
    day: "bg-gradient-to-br from-emerald-800 via-green-700 to-emerald-950",
    night: "bg-gradient-to-br from-slate-900 via-emerald-950 to-black",
  },
  deserto: {
    day: "bg-gradient-to-br from-amber-300 via-orange-400 to-amber-500",
    night: "bg-gradient-to-br from-slate-900 via-stone-800 to-black",
  },
  montanha: {
    day: "bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800",
    night: "bg-gradient-to-br from-slate-950 via-slate-800 to-black",
  },
  selva: {
    day: "bg-gradient-to-br from-green-800 via-emerald-700 to-teal-900",
    night: "bg-gradient-to-br from-emerald-950 via-green-950 to-black",
  },
  costa: {
    day: "bg-gradient-to-br from-teal-500 via-cyan-400 to-amber-200",
    night: "bg-gradient-to-br from-slate-950 via-teal-950 to-black",
  },
};

const full = (n: number): Stats => ({
  health: n, hydration: n, energy: n, hunger: n, warmth: n, morale: n,
});

const DIFFICULTIES: Difficulty[] = [
  { id: "facil", label: "Fácil", emoji: "🌱", daysToWin: 5, start: full(90), decay: { hunger: -8, hydration: -12, energy: -14, warmth: -5, morale: -3 }, xp: 100, desc: "5 dias · decaimento leve" },
  { id: "medio", label: "Médio", emoji: "⚔️", daysToWin: 7, start: full(75), decay: { hunger: -10, hydration: -15, energy: -16, warmth: -7, morale: -5 }, xp: 200, desc: "7 dias · decaimento moderado" },
  { id: "dificil", label: "Difícil", emoji: "🔥", daysToWin: 7, start: full(60), decay: { hunger: -12, hydration: -18, energy: -18, warmth: -9, morale: -7 }, xp: 350, desc: "7 dias · decaimento alto" },
  { id: "extremo", label: "Extremo", emoji: "💀", daysToWin: 7, start: full(45), decay: { hunger: -14, hydration: -22, energy: -22, warmth: -12, morale: -10 }, xp: 500, desc: "7 dias · decaimento brutal" },
];

/* ------------------------------------------------------------------ *
 *  SCENARIOS (15+ — 3 per biome, day/night mix)
 * ------------------------------------------------------------------ */

const SCENARIOS: Scenario[] = [
  /* ---------- FLORESTA ---------- */
  {
    id: "flor-d1",
    biome: "floresta", time: "day",
    backgroundImage: U("1448375240586-88270c653f25"),
    text: "Você desperta sob a copa densa de uma floresta. O canto de pássaros quebra o silêncio, mas sua garganta está seca e o estômago ronca de fome.",
    options: [
      { label: "Seguir o som da água", icon: "💧", resultText: "Você encontra um riacho cristalino e mata a sede.", statChanges: { hydration: 25, energy: -10 }, itemFound: "agua" },
      { label: "Coletar frutos silvestres", icon: "🫐", resultText: "Frutas vermelhas maduras saciam sua fome.", statChanges: { hunger: 22, energy: -5 }, itemFound: "frutas" },
      { label: "Construir um abrigo", icon: "🏕️", resultText: "Galhos e folhas formam um abrigo improvisado que protege do vento.", statChanges: { warmth: 10, morale: 5, energy: -18 } },
      { label: "Examinar pegadas próximas", icon: "🧭", resultText: "Você reconhece pegadas recentes — podem ser de animais ou de outra pessoa.", statChanges: { energy: -12, morale: 3 }, xpReward: 15 },
    ],
  },
  {
    id: "flor-d2",
    biome: "floresta", time: "day",
    backgroundImage: U("1469474988025-13e5b54c7d28"),
    text: "Uma clareira se abre à sua frente. Raios de sol aquecem o chão coberto de folhas. Há uma árvore caída e sinais de atividade recente.",
    options: [
      { label: "Reunir lenha seca", icon: "🪵", resultText: "Você junta gravetos secos para uma fogueira futura.", statChanges: { energy: -8, warmth: 4 } },
      { label: "Caçar um coelho", icon: "🍖", resultText: "Uma armadilha rústica captura um coelho — comida garantida.", statChanges: { hunger: 25, energy: -20, morale: -2 }, itemFound: "comida" },
      { label: "Fazer corda de fibra", icon: "🪢", resultText: "Fibras de casca de árvore viram uma corda resistente.", statChanges: { energy: -12 }, itemFound: "corda" },
      { label: "Mapear marcos naturais", icon: "🗺️", resultText: "Você traça um mapa mental dos arredores.", statChanges: { energy: -8, morale: 4 }, itemFound: "mapa", xpReward: 20 },
    ],
  },
  {
    id: "flor-n1",
    biome: "floresta", time: "night",
    backgroundImage: U("1502082553048-f6f5dc0cab80"),
    text: "A noite tombou sobre a floresta. Sombras dançam entre as árvores e o frio se intensifica. Um coro de uivos distantes levanta os pelos da nuca.",
    options: [
      { label: "Acender uma fogueira", icon: "🔥", resultText: "Fagulhas voam. O calor do fogo afasta o medo e os predadores.", statChanges: { warmth: 25, morale: 12, energy: -12 }, itemFound: "isqueiro" },
      { label: "Reforçar o abrigo", icon: "🏕️", resultText: "Você bloqueia as frestas contra o vento noturno.", statChanges: { warmth: 12, energy: -14 } },
      { label: "Montar guarda", icon: "👂", resultText: "Você passa a noite em alerta. O cansaço pesa, mas nada te alcança.", statChanges: { energy: -18, morale: -3, health: -3 } },
      { label: "Tentar descansar", icon: "🌙", resultText: "Um sono leve restaura suas forças, embora o frio te alcance.", statChanges: { energy: 25, warmth: -8 } },
    ],
  },

  /* ---------- DESERTO ---------- */
  {
    id: "des-d1",
    biome: "deserto", time: "day",
    backgroundImage: U("1503561272887-c827f0b3e2e9"),
    text: "O sol pune sem piedade. Areia em todas as direções, o horizonte tremendo de calor. Sua língua racha e a cabeça dói.",
    options: [
      { label: "Improvisar véu contra o sol", icon: "🧣", resultText: "Você cobre a cabeça e sente alívio imediato do calor.", statChanges: { warmth: -12, energy: -8, hydration: -5 }, itemFound: "cobertor" },
      { label: "Buscar sombra nas rochas", icon: "🪨", resultText: "Uma formação rochosa oferece sombra preciosa.", statChanges: { energy: -12, warmth: -15, morale: 3 } },
      { label: "Cavar por umidade", icon: "🕳️", resultText: "Na base de uma dune você encontra areia úmida e lambe gotas preciosas.", statChanges: { energy: -20, hydration: 15 } },
      { label: "Marchar contra o calor", icon: "🚶", resultText: "Você avança resolutamente, gastando energia e água.", statChanges: { energy: -18, hydration: -12, warmth: 10 } },
    ],
  },
  {
    id: "des-n1",
    biome: "deserto", time: "night",
    backgroundImage: U("1419241417788-66ec5232f798"),
    text: "O deserto à noite é outro mundo. O calor esvai e um frio cortante toma conta. Estrelas cobrem o céu num espetáculo frio.",
    options: [
      { label: "Envolver-se no cobertor", icon: "🧣", resultText: "O cobertor retém o calor corporal contra o frio noturno.", statChanges: { warmth: 20, energy: -5 } },
      { label: "Acender fogueira noturna", icon: "🔥", resultText: "Pequenas chamas aquecem o acampamento improvisado.", statChanges: { warmth: 25, morale: 8, energy: -10 } },
      { label: "Navegar pelas estrelas", icon: "🧭", resultText: "Você orienta-se pela Ursa Maior, ganhando confiança.", statChanges: { energy: -12, morale: 5 }, xpReward: 15 },
      { label: "Dormir sob as estrelas", icon: "😴", resultText: "O descanso restaura o corpo, mas o frio penetra nos ossos.", statChanges: { energy: 25, warmth: -12 } },
    ],
  },
  {
    id: "des-n2",
    biome: "deserto", time: "night",
    backgroundImage: U("1451188503445-1ce0e5805e9f"),
    text: "Um vento frio sopra areia fina pelo ar. Você precisa agir antes que o frio minore suas forças e o sono congele a vontade.",
    options: [
      { label: "Abrasigar-se atrás de rochas", icon: "🪨", resultText: "Você esconde-se do vento atrás de uma formação.", statChanges: { warmth: 15, energy: -8 } },
      { label: "Construir barreira de areia", icon: "🏕️", resultText: "Um muro de areia bloqueia o vento gelado.", statChanges: { warmth: 10, energy: -15 } },
      { label: "Marchar para se aquecer", icon: "🚶", resultText: "O movimento aquece, mas consome energia e água.", statChanges: { warmth: 12, energy: -20, hydration: -8 } },
      { label: "Procurar restos enterrados", icon: "🔦", resultText: "Sob a areia, você encontra uma fogueira antiga e um isqueiro!", statChanges: { energy: -10, morale: 5 }, itemFound: "isqueiro", xpReward: 10 },
    ],
  },

  /* ---------- MONTANHA ---------- */
  {
    id: "mon-d1",
    biome: "montanha", time: "day",
    backgroundImage: U("1464822759473-e30ad3d0ee54"),
    text: "Ar rarefeito enche seus pulmões. Picos nevados cercam você e o solo é pedregento e íngreme. A altitude dói na cabeça.",
    options: [
      { label: "Escalar até um ponto alto", icon: "🧗", resultText: "Do topo, você avista um vale promissor ao longe.", statChanges: { energy: -25, morale: 8 }, xpReward: 20 },
      { label: "Procurar combustível entre pedras", icon: "🪵", resultText: "Entre pedras, restos de uma corda abandonada.", statChanges: { energy: -10 }, itemFound: "corda" },
      { label: "Derreter neve para beber", icon: "❄️", resultText: "Você derrete neve no cantil, hidratando o corpo.", statChanges: { hydration: 30, warmth: -8, energy: -8 }, itemFound: "agua" },
      { label: "Descer a encosta com cuidado", icon: "🥾", resultText: "Você desce com passos cautelosos por terreno íngreme.", statChanges: { energy: -15, health: -2 } },
    ],
  },
  {
    id: "mon-d2",
    biome: "montanha", time: "day",
    backgroundImage: U("1486870591958-9b5d0d0c0c0c"),
    text: "Uma trilha serpenteia pela encosta. Sinais de deslizamento recente estão por toda parte — pedras soltas, terra revolvida.",
    options: [
      { label: "Seguir a trilha", icon: "🚶", resultText: "A trilha leva a uma passagem mais segura entre os picos.", statChanges: { energy: -18, morale: 5 } },
      { label: "Buscar abrigo em caverna", icon: "🕳️", resultText: "Uma caverna rasa abriga restos de um viajante anterior.", statChanges: { warmth: 8, energy: -12 }, itemFound: "bandagem" },
      { label: "Mapear a rota na pedra", icon: "🗺️", resultText: "Você risca um mapa rudimentar na pedra.", statChanges: { energy: -8, morale: 4 }, itemFound: "mapa", xpReward: 20 },
      { label: "Caçar uma marmota", icon: "🍖", resultText: "Uma marmota cai na sua armadilha de pedras.", statChanges: { hunger: 22, energy: -22 } },
    ],
  },
  {
    id: "mon-n1",
    biome: "montanha", time: "night",
    backgroundImage: U("1518818412203-8f4d0c0c0c0c"),
    text: "A montanha à noite é brutalmente fria. O vento uiva entre os penhascos e a temperatura cai perigosamente abaixo de zero.",
    options: [
      { label: "Acender fogueira abrigada", icon: "🔥", resultText: "Entre rochas, você protege as chamas do vento.", statChanges: { warmth: 30, morale: 10, energy: -12 } },
      { label: "Enrolar-se no cobertor", icon: "🧣", resultText: "Você se enrola, tremendo, mas aguenta a noite.", statChanges: { warmth: 18, energy: -5 } },
      { label: "Bloquear a entrada da caverna", icon: "🪨", resultText: "Pedras formam uma barreira contra o vento cortante.", statChanges: { warmth: 12, energy: -14 } },
      { label: "Aguentar a noite acordado", icon: "🥶", resultText: "Você treme a noite toda, mal resistindo ao frio extremo.", statChanges: { energy: -22, warmth: -10, health: -3 } },
    ],
  },

  /* ---------- SELVA ---------- */
  {
    id: "sel-d1",
    biome: "selva", time: "day",
    backgroundImage: U("1542295669481-5e9eb5a3a3a3"),
    text: "Umidade esmaga seus sentidos. Insetos zunem ao redor, o ar é espesso e quente. Cipós e folhas gigantes bloqueiam a visão.",
    options: [
      { label: "Coletar água das folhas", icon: "💧", resultText: "Você espreme orvalho de folhas largas.", statChanges: { hydration: 20, energy: -8 } },
      { label: "Coletar frutas da selva", icon: "🫐", resultText: "Frutas coloridas saciam, mas uma estava levemente tóxica.", statChanges: { hunger: 18, energy: -6, health: -3 }, itemFound: "frutas" },
      { label: "Abrir trilha com facão", icon: "🌿", resultText: "Você corta a vegetação, abrindo caminho difícil.", statChanges: { energy: -22, morale: 3 } },
      { label: "Lama contra os mosquitos", icon: "🩹", resultText: "Lama seca sobre a pele afasta os mosquitos vorazes.", statChanges: { health: 5, energy: -10, morale: 3 } },
    ],
  },
  {
    id: "sel-n1",
    biome: "selva", time: "night",
    backgroundImage: U("1502082553048-f6f5dc0cab80"),
    text: "A selva à noite fervilha. Rugidos distantes, estalos de galhos, olhos brilham na escuridão densa. O ar permanece pesado e quente.",
    options: [
      { label: "Acender fogueira defensiva", icon: "🔥", resultText: "O fogo forma um anel de proteção contra a vida noturna.", statChanges: { warmth: 20, morale: 12, energy: -12 } },
      { label: "Subir numa árvore", icon: "🌴", resultText: "Você se abriga na copa, longe do chão perigoso.", statChanges: { energy: -18, morale: -2 } },
      { label: "Permanecer imóvel e silencioso", icon: "👂", resultText: "Você espera a noite passar. Predadores farejam perto.", statChanges: { energy: -14, morale: -5, health: -2 } },
      { label: "Cercar abrigo com espinhos", icon: "🌵", resultText: "Uma barreira de espinhos cerca seu abrigo.", statChanges: { warmth: 10, energy: -16 } },
    ],
  },
  {
    id: "sel-n2",
    biome: "selva", time: "night",
    backgroundImage: U("1428539852277"),
    text: "Uma tempestade tropical explode. Chuva torrencial, ventos fortes, raios cortam o céu. Você precisa agir rápido antes de ser varrido.",
    options: [
      { label: "Coletar água da chuva", icon: "🪣", resultText: "Você aproveita cada gota da tempestade.", statChanges: { hydration: 40, energy: -8 }, itemFound: "agua" },
      { label: "Reforçar o abrigo", icon: "🏕️", resultText: "Você segura o abrigo contra o vento com fibras e pedras.", statChanges: { warmth: 8, energy: -18, morale: 4 } },
      { label: "Buscar cavidade na rocha", icon: "🕳️", resultText: "Uma fenda na pedra abriga você da chuva torrencial.", statChanges: { warmth: 12, energy: -16 } },
      { label: "Proteger as brasas", icon: "🔥", resultText: "Você cobre as brasas com folhas grandes para reacender depois.", statChanges: { warmth: 6, energy: -12 }, itemFound: "isqueiro" },
    ],
  },

  /* ---------- COSTA ---------- */
  {
    id: "cos-d1",
    biome: "costa", time: "day",
    backgroundImage: U("1507525428034-b723cd880d80"),
    text: "Ondas quebram numa praia vasta. Sal no ar, gaivotas gritam. Destroços de madeira e plástico espalhados pela areia.",
    options: [
      { label: "Pescar com anzol improvisado", icon: "🎣", resultText: "Um peixe morde! Comida fresca garantida.", statChanges: { hunger: 25, energy: -18 }, itemFound: "peixe" },
      { label: "Dessalinizar água do mar", icon: "💧", resultText: "Você evapora e condensa água salgada — lento mas vital.", statChanges: { hydration: 15, energy: -20 } },
      { label: "Procurar destroços úteis", icon: "🪵", resultText: "Madeira de naufrágio e cordas encalhadas.", statChanges: { energy: -12, morale: 3 }, itemFound: "corda", xpReward: 15 },
      { label: "Construir abrigo de palmeira", icon: "🏖️", resultText: "Folhas de palmeira formam um abrigo arejado.", statChanges: { warmth: 5, energy: -14 } },
    ],
  },
  {
    id: "cos-d2",
    biome: "costa", time: "day",
    backgroundImage: U("1505142468610-2b2d0c0c0c0c"),
    text: "Você vê pegadas na areia — humanas, recentes. Podem ser de salvadores ou de outra pessoa perdida como você.",
    options: [
      { label: "Gritar por socorro", icon: "📣", resultText: "Você grita até a garganta doer. Sem resposta visível, mas não desiste.", statChanges: { energy: -10, morale: 4 } },
      { label: "Seguir as pegadas", icon: "🚶", resultText: "As pegadas levam a um acampamento abandonado com suprimentos.", statChanges: { energy: -20, morale: 6 }, itemFound: "kit", xpReward: 25 },
      { label: "Procurar sinais de civilização", icon: "📻", resultText: "Entre os destroços, um rádio danificado — talvez funcione.", statChanges: { energy: -12, morale: 4 }, itemFound: "radio" },
      { label: "Acender fogueira de sinalização", icon: "🔥", resultText: "Coluna de fumaça sobe — sinal visível por quilômetros!", statChanges: { warmth: 5, energy: -14, morale: 10 }, xpReward: 30 },
    ],
  },
  {
    id: "cos-n1",
    biome: "costa", time: "night",
    backgroundImage: U("1518818412203-8f4d0c0c0c0c"),
    text: "A maré subiu. A praia encolheu. O mar ruge escuro e o vento salgado corta a pele.",
    options: [
      { label: "Manter a fogueira acesa", icon: "🔥", resultText: "Você alimenta o fogo contra o vento salgado.", statChanges: { warmth: 20, morale: 8, energy: -12 } },
      { label: "Recuar para terreno alto", icon: "🪨", resultText: "Você foge da maré subindo para as rochas.", statChanges: { warmth: 8, energy: -16, morale: 3 } },
      { label: "Pescar à luz do fogo", icon: "🎣", resultText: "Peixes atraídos pela luz mordem seu anzol.", statChanges: { hunger: 18, energy: -16 }, itemFound: "peixe" },
      { label: "Coletar caranguejos nas pedras", icon: "🦀", resultText: "Caranguejos nas pedras viram ceia improvisada.", statChanges: { hunger: 12, energy: -12, health: -1 } },
    ],
  },
];

/* ------------------------------------------------------------------ *
 *  RANDOM EVENTS (14)
 * ------------------------------------------------------------------ */

const RANDOM_EVENTS: RandomEvent[] = [
  { id: "ev-wolf", biome: "any", text: "Um rugido corta o silêncio! Um predador avança pelas sombras e te ataca antes de fugir.", image: U("1561654967-3a8e6c0c0c0c"), effect: { health: -15, morale: -10, energy: -5 } },
  { id: "ev-rain", biome: "any", text: "Uma chuva inesperada cai dos céus! Você estica o rosto para a água fresca.", image: U("1428539852277"), effect: { hydration: 25, warmth: -8 } },
  { id: "ev-cold", biome: "any", text: "Uma rajada de frio polar atinge a região. Seus ossos tremem.", image: U("1451188503445-1ce0e5805e9f"), effect: { warmth: -20, health: -5 } },
  { id: "ev-heat", biome: "deserto", text: "O calor do meio-dia fica insuportável. Você sente a água evaporando do corpo.", image: U("1503561272887-c827f0b3e2e9"), effect: { hydration: -15, warmth: 15 } },
  { id: "ev-berries", biome: "any", text: "Você tropeça num arbusto cheio de frutas maduras!", image: U("1502082553048-f6f5dc0cab80"), effect: { hunger: 22 }, itemFound: "frutas" },
  { id: "ev-snake", biome: "any", text: "Uma cobra pica sua perna! Dor e pânico tomam conta.", image: U("1441974234615-d0d5e1f0c5c7"), effect: { health: -12, morale: -8 } },
  { id: "ev-wanderer", biome: "any", text: "Um andarilho aparece! Ele compartilha comida e histórias antes de seguir viagem.", image: U("1469474988025-13e5b54c7d28"), effect: { hunger: 15, morale: 15, energy: 5 }, itemFound: "comida" },
  { id: "ev-ankle", biome: "any", text: "Você torce o tornozelo numa raiz escondida. A dor dificulta cada passo.", image: U("1448375240586-88270c653f25"), effect: { energy: -15, health: -5 } },
  { id: "ev-spring", biome: "any", text: "Você encontra uma nascente escondida entre as pedras!", image: U("1464822759473-e30ad3d0ee54"), effect: { hydration: 30, morale: 5 }, itemFound: "agua" },
  { id: "ev-mosquito", biome: "selva", text: "Um enxame de mosquitos ataca feroz! Você mal consegue respirar entre as picadas.", image: U("1542295669481-5e9eb5a3a3a3"), effect: { health: -6, morale: -10 } },
  { id: "ev-sunrise", biome: "any", text: "Um nascer de sol deslumbrante aquece sua alma e renova a esperança.", image: U("1507525428034-b723cd880d80"), effect: { morale: 15, warmth: 5 } },
  { id: "ev-cache", biome: "any", text: "Você descobre um cache de suprimentos enterrado por um sobrevivente anterior!", image: U("1469474988025-13e5b54c7d28"), effect: { morale: 10 }, itemFound: "kit" },
  { id: "ev-eagle", biome: "any", text: "Uma águia empurra um peixe perto de você — presente inesperado dos céus.", image: U("1507525428034-b723cd880d80"), effect: { hunger: 18 }, itemFound: "peixe" },
  { id: "ev-fox", biome: "any", text: "Uma raposa curiosa fuça seu acampamento e foge com parte da sua comida.", image: U("1441974234615-d0d5e1f0c5c7"), effect: { hunger: -10 } },
];

/* ------------------------------------------------------------------ *
 *  HELPERS
 * ------------------------------------------------------------------ */

const clampStats = (s: Stats): Stats => {
  const c = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return { health: c(s.health), hydration: c(s.hydration), energy: c(s.energy), hunger: c(s.hunger), warmth: c(s.warmth), morale: c(s.morale) };
};

const addStats = (a: Stats, b: StatChanges): Stats =>
  clampStats({
    health: a.health + (b.health ?? 0),
    hydration: a.hydration + (b.hydration ?? 0),
    energy: a.energy + (b.energy ?? 0),
    hunger: a.hunger + (b.hunger ?? 0),
    warmth: a.warmth + (b.warmth ?? 0),
    morale: a.morale + (b.morale ?? 0),
  });

const isDead = (s: Stats): boolean => s.health <= 0 || s.hydration <= 0 || s.energy <= 0;

const deathCause = (s: Stats): string => {
  if (s.health <= 0) return "ferimentos e falha orgânica";
  if (s.hydration <= 0) return "desidratação severa";
  if (s.energy <= 0) return "exaustão absoluta";
  return "causas desconhecidas";
};

const pickScenario = (biome: BiomeId, time: "day" | "night", day: number, lastId?: string): Scenario => {
  let pool = SCENARIOS.filter((s) => s.biome === biome && s.time === time);
  if (pool.length === 0) pool = SCENARIOS.filter((s) => s.biome === biome);
  if (pool.length === 0) pool = SCENARIOS.filter((s) => s.time === time);
  if (pool.length === 0) pool = SCENARIOS;
  if (lastId && pool.length > 1) pool = pool.filter((s) => s.id !== lastId);
  return pool[(day - 1) % pool.length] ?? pool[0];
};

const pickEvent = (biome: BiomeId): RandomEvent => {
  const pool = RANDOM_EVENTS.filter((e) => e.biome === biome || e.biome === "any");
  return pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_EVENTS[0];
};

/* ------------------------------------------------------------------ *
 *  SUB-COMPONENTS
 * ------------------------------------------------------------------ */

function ScenarioImage({
  src, biome, time, className,
}: { src: string; biome: BiomeId; time: "day" | "night"; className?: string }) {
  const [err, setErr] = useState(false);
  const gradient = BIOME_GRADIENT[biome][time];
  useEffect(() => { setErr(false); }, [src]);
  if (!src || err) return <div className={cn(className, gradient)} aria-hidden />;
  return (
    <img
      src={src}
      alt=""
      onError={() => setErr(true)}
      loading="lazy"
      className={cn(className, "object-cover")}
      aria-hidden
    />
  );
}

function StatBar({
  icon: Icon, label, value, textClass, barClass,
}: { icon: LucideIcon; label: string; value: number; textClass: string; barClass: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const critical = v < 20;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon size={14} className={textClass} /> {label}
        </span>
        <span className={cn("tabular-nums font-semibold", critical ? "text-destructive animate-pulse" : "text-muted-foreground")}>
          {v}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barClass)}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatDeltas({ prev, next }: { prev: Stats; next: Stats }) {
  const deltas = (Object.keys(next) as StatKey[])
    .map((k) => ({ key: k, delta: (next[k] - prev[k]) }))
    .filter((d) => d.delta !== 0);
  if (deltas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {deltas.map((d, i) => {
        const cfg = STAT_CONFIG.find((s) => s.key === d.key)!;
        const pos = d.delta > 0;
        const Icon = cfg.icon;
        return (
          <motion.span
            key={d.key}
            initial={{ opacity: 0, y: -8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              pos ? "bg-emerald-500/15 text-emerald-500" : "bg-destructive/15 text-destructive",
            )}
          >
            <Icon size={12} /> {cfg.label} {pos ? "+" : ""}{d.delta}
          </motion.span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  MAIN COMPONENT
 * ------------------------------------------------------------------ */

const Simulador = () => {
  const { addXP } = useUserProfile();
  const { logActivity } = useActivityLog();

  const [phase, setPhase] = useState<Phase>("start");
  const [biomeId, setBiomeId] = useState<BiomeId>("floresta");
  const [difficultyId, setDifficultyId] = useState<string>("medio");
  const [stats, setStats] = useState<Stats>(() => full(75));
  const [day, setDay] = useState(1);
  const [time, setTime] = useState<"day" | "night">("day");
  const [inventory, setInventory] = useState<string[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [lastResult, setLastResult] = useState<{ option: Option; prev: Stats; next: Stats } | null>(null);
  const [evt, setEvt] = useState<RandomEvent | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [deathInfo, setDeathInfo] = useState<DeathInfo | null>(null);
  const [victoryAwarded, setVictoryAwarded] = useState(false);

  const difficulty = DIFFICULTIES.find((d) => d.id === difficultyId) ?? DIFFICULTIES[1];
  const biome = BIOMES.find((b) => b.id === biomeId) ?? BIOMES[0];
  const BiomeIcon = BIOME_ICON[biomeId];

  const pushLog = useCallback((entry: string) => {
    setLog((prev) => [entry, ...prev].slice(0, 12));
  }, []);

  const addItem = useCallback((id: string) => {
    setInventory((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeItem = useCallback((id: string) => {
    setInventory((prev) => prev.filter((i) => i !== id));
  }, []);

  const startGame = useCallback((b: BiomeId, dId: string) => {
    const diff = DIFFICULTIES.find((d) => d.id === dId) ?? DIFFICULTIES[1];
    const sc = pickScenario(b, "day", 1);
    setBiomeId(b);
    setDifficultyId(dId);
    setStats(diff.start);
    setDay(1);
    setTime("day");
    setInventory([]);
    setLog([]);
    setLastResult(null);
    setEvt(null);
    setDeathInfo(null);
    setVictoryAwarded(false);
    setScenario(sc);
    setPhase("playing");
    const bName = BIOMES.find((x) => x.id === b)?.name ?? b;
    pushLog(`🌳 Dia 1 iniciado em ${bName} (${diff.label}).`);
  }, [pushLog]);

  const handleChoose = useCallback((option: Option) => {
    setScenario((sc) => {
      if (!sc) return sc;
      const prev = stats;
      const next = addStats(prev, option.statChanges);
      setStats(next);
      if (option.itemFound) {
        addItem(option.itemFound);
        const it = ITEMS[option.itemFound];
        toast.success(`Item encontrado: ${it?.emoji ?? ""} ${it?.name ?? option.itemFound}`);
        playDiscoverSound();
      }
      if (option.itemLost) {
        removeItem(option.itemLost);
        const it = ITEMS[option.itemLost];
        toast(`${it?.name ?? option.itemLost} perdido`, { icon: "⚠️" });
      }
      if (option.xpReward) {
        addXP(option.xpReward);
        logActivity(`Decisão no simulador: +${option.xpReward} XP`, "⚡", option.xpReward);
        toast.success(`+${option.xpReward} XP`, { icon: "⚡" });
        playXPSound();
      }
      pushLog(`${option.icon} ${option.label} → ${option.resultText}`);
      setLastResult({ option, prev, next });
      setPhase("result");
      return sc;
    });
  }, [stats, addItem, removeItem, addXP, logActivity, pushLog]);

  const continueAfterResult = useCallback(() => {
    // 1. death from the option effects
    if (isDead(stats)) {
      setDeathInfo({ cause: deathCause(stats), day, stats });
      setPhase("dead");
      return;
    }
    const diff = difficulty;
    // 2. advance the day + natural decay
    let afterDecay = addStats(stats, diff.decay);
    // 3. warmth extremes
    const extra: StatChanges = {};
    if (afterDecay.warmth > 85) extra.hydration = -8;
    if (afterDecay.warmth < 20) extra.health = -8;
    if (Object.keys(extra).length) afterDecay = addStats(afterDecay, extra);
    const newDay = day + 1;
    // 4. death from decay
    if (isDead(afterDecay)) {
      setStats(afterDecay);
      setDeathInfo({ cause: deathCause(afterDecay), day: newDay, stats: afterDecay });
      setPhase("dead");
      return;
    }
    // 5. victory check
    if (newDay > diff.daysToWin) {
      setStats(afterDecay);
      if (!victoryAwarded) {
        addXP(diff.xp);
        logActivity(`Sobreviveu ${diff.daysToWin} dias (${diff.label}) no Simulador`, "🏆", diff.xp);
        toast.success(`Resgate confirmado! +${diff.xp} XP`, { icon: "🏆" });
        playCompletionSound();
        playAchievementSound();
        setVictoryAwarded(true);
      }
      setPhase("victory");
      return;
    }
    // 6. continue — set up next phase
    const newTime: "day" | "night" = time === "day" ? "night" : "day";
    const next = pickScenario(biomeId, newTime, newDay, scenario?.id);
    setStats(afterDecay);
    setDay(newDay);
    setTime(newTime);
    setScenario(next);
    setLastResult(null);
    pushLog(`— Avança para ${newTime === "day" ? "o dia" : "a noite"} ${newDay} —`);
    // 7. 30% chance random event
    if (Math.random() < 0.3) {
      const event = pickEvent(biomeId);
      setEvt(event);
      const evtStats = addStats(afterDecay, event.effect);
      setStats(evtStats);
      if (event.itemFound) {
        addItem(event.itemFound);
        const it = ITEMS[event.itemFound];
        toast.success(`Item encontrado: ${it?.emoji ?? ""} ${it?.name ?? event.itemFound}`);
        playDiscoverSound();
      }
      pushLog(`⚡ EVENTO: ${event.text}`);
      setPhase("event");
    } else {
      setPhase("playing");
    }
  }, [stats, day, time, difficulty, biomeId, scenario, victoryAwarded, addXP, logActivity, pushLog, addItem]);

  const continueAfterEvent = useCallback(() => {
    if (isDead(stats)) {
      setDeathInfo({ cause: deathCause(stats), day, stats });
      setPhase("dead");
      return;
    }
    setEvt(null);
    setPhase("playing");
  }, [stats, day]);

  const restart = useCallback(() => {
    setPhase("start");
    setLastResult(null);
    setEvt(null);
    setDeathInfo(null);
    setScenario(null);
  }, []);

  /* -------------------- RENDER -------------------- */

  return (
    <Layout>
      <SEO
        title="Simulador de Sobrevivência — Centro de Sobrevivência"
        description="Simulador realista de sobrevivência com 5 biomas, ciclo dia/noite, sistema de inventário, eventos aleatórios e estatísticas detalhadas. Sobreviva até o resgate."
        type="website"
      />

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <AnimatePresence mode="wait">
          {/* ---------------- START SCREEN ---------------- */}
          {phase === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              <header className="text-center space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                  <Compass size={12} /> Simulação tática de campo
                </span>
                <h1 className="font-heading text-4xl sm:text-5xl text-gradient-survival uppercase tracking-wider">
                  Simulador de Sobrevivência
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Escolha seu bioma e dificuldade. Cada decisão molda suas estatísticas
                  e seu destino. Gerencie saúde, hidratação, energia, nutrição, calor e
                  moral até o resgate chegar.
                </p>
              </header>

              <section>
                <h2 className="font-heading text-xl mb-3 flex items-center gap-2">
                  <Compass size={18} className="text-primary" /> Escolha o bioma
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {BIOMES.map((b) => {
                    const Icon = BIOME_ICON[b.id];
                    return (
                      <button
                        key={b.id}
                        onClick={() => setBiomeId(b.id)}
                        aria-pressed={biomeId === b.id}
                        className={cn(
                          "group relative overflow-hidden rounded-lg border p-3 text-left transition-all hover:border-primary hover:-translate-y-0.5",
                          biomeId === b.id ? "border-primary glow-orange bg-primary/5" : "border-border",
                        )}
                      >
                        <div className="aspect-video w-full overflow-hidden rounded mb-2">
                          <ScenarioImage
                            src={b.image}
                            biome={b.id}
                            time="day"
                            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} className="text-primary shrink-0" />
                          <span className="text-lg">{b.emoji}</span>
                          <span className="font-heading text-sm">{b.name}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{b.blurb}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="font-heading text-xl mb-3 flex items-center gap-2">
                  <Skull size={18} className="text-primary" /> Dificuldade
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficultyId(d.id)}
                      aria-pressed={difficultyId === d.id}
                      className={cn(
                        "rounded-lg border p-4 text-left transition-all hover:border-primary hover:-translate-y-0.5",
                        difficultyId === d.id ? "border-primary glow-orange bg-primary/5" : "border-border",
                      )}
                    >
                      <div className="text-2xl mb-1">{d.emoji}</div>
                      <div className="font-heading text-base">{d.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{d.desc}</div>
                      <div className="text-xs text-primary mt-2 font-semibold">+{d.xp} XP no resgate</div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex justify-center">
                <button
                  onClick={() => startGame(biomeId, difficultyId)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider px-8 py-3 rounded-md hover:opacity-90 transition-opacity glow-orange"
                >
                  Iniciar Sobrevivência <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ---------------- GAME SCREEN ---------------- */}
          {(phase === "playing" || phase === "result" || phase === "event") && scenario && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {/* Scenario hero with background image */}
              <div className="relative overflow-hidden rounded-xl border border-border h-64 sm:h-80">
                <ScenarioImage
                  src={scenario.backgroundImage}
                  biome={biomeId}
                  time={scenario.time}
                  className="absolute inset-0 h-full w-full"
                />
                <div className={cn(
                  "absolute inset-0",
                  scenario.time === "night"
                    ? "bg-gradient-to-t from-black/95 via-black/55 to-slate-950/40"
                    : "bg-gradient-to-t from-black/90 via-black/40 to-black/10",
                )} />
                <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-xs text-white">
                    <BiomeIcon size={12} /> {biome.emoji} {biome.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-xs text-white">
                    {time === "day" ? <Sun size={12} /> : <Moon size={12} />}
                    {time === "day" ? "Dia" : "Noite"} {day}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/85 px-2.5 py-1 text-xs text-primary-foreground">
                    <MapIcon size={12} /> Meta: {difficulty.daysToWin} dias
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <p className="text-white text-base sm:text-lg leading-relaxed font-medium drop-shadow-md">
                    {scenario.text}
                  </p>
                </div>
              </div>

              {/* Stats panel */}
              <div className="bg-gradient-card rounded-xl border border-border p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {STAT_CONFIG.map((c) => (
                    <StatBar
                      key={c.key}
                      icon={c.icon}
                      label={c.label}
                      value={stats[c.key]}
                      textClass={c.text}
                      barClass={c.bar}
                    />
                  ))}
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-gradient-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Backpack size={16} /> Inventário
                </div>
                {inventory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Você não possui itens. Explore para encontrar recursos.</p>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {inventory.map((id) => {
                      const it = ITEMS[id];
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-md bg-muted border border-border px-2 py-1 text-xs"
                        >
                          <span>{it?.emoji ?? "📦"}</span> {it?.name ?? id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Options / Result / Event overlays */}
              <AnimatePresence mode="wait">
                {phase === "playing" && (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {scenario.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleChoose(opt)}
                        className="group flex items-center gap-3 rounded-lg border border-border bg-muted/40 hover:border-primary hover:bg-primary/10 p-4 text-left transition-all"
                      >
                        <span className="text-2xl shrink-0" aria-hidden>{opt.icon}</span>
                        <span className="flex-1 font-medium text-sm text-foreground">{opt.label}</span>
                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {phase === "result" && lastResult && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="rounded-xl border border-primary/40 bg-gradient-card p-5 space-y-4"
                  >
                    <StatDeltas prev={lastResult.prev} next={lastResult.next} />
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0" aria-hidden>{lastResult.option.icon}</span>
                      <p className="text-foreground text-base leading-relaxed">{lastResult.option.resultText}</p>
                    </div>
                    {lastResult.option.itemFound && (
                      <p className="text-sm text-emerald-500 flex items-center gap-1.5">
                        <Backpack size={14} /> Você obteve: {ITEMS[lastResult.option.itemFound]?.name ?? lastResult.option.itemFound}
                      </p>
                    )}
                    <button
                      onClick={continueAfterResult}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider py-3 rounded-md hover:opacity-90 transition-opacity"
                    >
                      Continuar <ArrowRight size={16} />
                    </button>
                  </motion.div>
                )}

                {phase === "event" && evt && (
                  <motion.div
                    key="event"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="rounded-xl border border-amber-500/50 bg-gradient-card overflow-hidden"
                  >
                    <div className="relative h-28 sm:h-32">
                      <ScenarioImage
                        src={evt.image}
                        biome={biomeId}
                        time={time}
                        className="absolute inset-0 h-full w-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/30" />
                      <div className="absolute top-2 left-2 text-amber-400 text-[11px] uppercase tracking-widest font-heading">
                        ⚡ Evento aleatório
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <p className="text-foreground text-sm leading-relaxed">{evt.text}</p>
                      {evt.itemFound && (
                        <p className="text-sm text-emerald-500 flex items-center gap-1.5">
                          <Backpack size={14} /> Você obteve: {ITEMS[evt.itemFound]?.name ?? evt.itemFound}
                        </p>
                      )}
                      <button
                        onClick={continueAfterEvent}
                        className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 text-white font-heading uppercase tracking-wider py-3 rounded-md hover:opacity-90 transition-opacity"
                      >
                        Seguir em frente <ArrowRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Event log */}
              <div className="bg-gradient-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapIcon size={16} /> Registro de eventos
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2 custom-scroll">
                  {log.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nada registrado ainda.</p>
                  ) : (
                    log.slice(0, 5).map((entry, i) => (
                      <div key={i} className="text-xs text-muted-foreground border-l-2 border-border pl-2 leading-relaxed">
                        {entry}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Give up / restart */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={restart}
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw size={14} /> Recomeçar simulação
                </button>
              </div>
            </motion.div>
          )}

          {/* ---------------- DEATH SCREEN ---------------- */}
          {phase === "dead" && deathInfo && (
            <motion.div
              key="dead"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-2xl mx-auto text-center py-8 space-y-6"
            >
              <motion.div
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="flex justify-center"
              >
                <div className="rounded-full bg-destructive/15 p-5">
                  <Skull className="text-destructive" size={56} />
                </div>
              </motion.div>
              <div className="space-y-2">
                <h1 className="font-heading text-4xl sm:text-5xl uppercase text-destructive tracking-wider">
                  Você não resistiu
                </h1>
                <p className="text-muted-foreground">
                  O simulador chegou ao fim no{" "}
                  <strong className="text-foreground">
                    {deathInfo.day === 1 ? "primeiro" : `${deathInfo.day}º`} dia
                  </strong>
                  . Causa da morte:{" "}
                  <span className="text-destructive font-medium">{deathInfo.cause}</span>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Bioma: {biome.emoji} {biome.name} · Dificuldade: {difficulty.emoji} {difficulty.label}
                </p>
              </div>
              <div className="bg-gradient-card rounded-xl border border-border p-5">
                <h2 className="font-heading text-sm uppercase text-muted-foreground mb-3">
                  Estatísticas finais
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {STAT_CONFIG.map((c) => (
                    <StatBar
                      key={c.key}
                      icon={c.icon}
                      label={c.label}
                      value={deathInfo.stats[c.key]}
                      textClass={c.text}
                      barClass={c.bar}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={restart}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider px-8 py-3 rounded-md hover:opacity-90 transition-opacity glow-orange"
                >
                  <RotateCcw size={18} /> Tentar Novamente
                </button>
              </div>
            </motion.div>
          )}

          {/* ---------------- VICTORY SCREEN ---------------- */}
          {phase === "victory" && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-2xl mx-auto text-center py-8 space-y-6"
            >
              <motion.div
                initial={{ scale: 0.6, rotate: 8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="flex justify-center"
              >
                <div className="rounded-full bg-amber-500/15 p-5">
                  <Trophy className="text-amber-500" size={56} />
                </div>
              </motion.div>
              <div className="space-y-2">
                <h1 className="font-heading text-4xl sm:text-5xl uppercase text-gradient-survival tracking-wider">
                  Resgate Confirmado!
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Um helicóptero avistou seu sinal de fumaça. Você sobreviveu{" "}
                  <strong className="text-foreground">{difficulty.daysToWin} dias</strong> no
                  bioma {biome.emoji} {biome.name} na dificuldade {difficulty.emoji} {difficulty.label}.
                </p>
              </div>
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-card rounded-xl border border-amber-500/40 p-5"
              >
                <div className="text-5xl font-heading text-amber-500">+{difficulty.xp} XP</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Recompensa por completar a simulação ({difficulty.label})
                </div>
                <h2 className="font-heading text-sm uppercase text-muted-foreground mt-5 mb-3">
                  Estatísticas finais
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {STAT_CONFIG.map((c) => (
                    <StatBar
                      key={c.key}
                      icon={c.icon}
                      label={c.label}
                      value={stats[c.key]}
                      textClass={c.text}
                      barClass={c.bar}
                    />
                  ))}
                </div>
              </motion.div>
              <div className="flex justify-center">
                <button
                  onClick={restart}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider px-8 py-3 rounded-md hover:opacity-90 transition-opacity glow-orange"
                >
                  <RotateCcw size={18} /> Jogar Novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Simulador;
