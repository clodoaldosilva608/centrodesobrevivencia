import { Skull, Droplets, Compass, Apple, Flame } from "lucide-react";
import type { MapPoint, RandomEvent, TypeConfig } from "./mapTypes";
import { Droplets as DropletsIcon, AlertTriangle, Mountain, TreePine, Zap } from "lucide-react";

export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: "snake", title: "Cobra no Caminho!",
    description: "Uma cobra venenosa bloqueia sua passagem. O que você faz?",
    iconName: "skull",
    options: [
      { label: "Recuar devagar", effect: "Você recuou com segurança. Boa decisão!", xp: 30, outcome: "positive" },
      { label: "Tentar espantar", effect: "A cobra atacou, mas você desviou por pouco.", xp: 10, outcome: "negative" },
      { label: "Contornar pela mata", effect: "Você gastou energia extra, mas passou em segurança.", xp: 20, outcome: "neutral" },
    ],
  },
  {
    id: "storm", title: "Tempestade se Aproxima!",
    description: "Nuvens escuras surgem no horizonte. Uma tempestade está chegando rápido.",
    iconName: "droplets",
    options: [
      { label: "Buscar abrigo natural", effect: "Você encontrou uma caverna e ficou seco!", xp: 40, outcome: "positive" },
      { label: "Construir abrigo rápido", effect: "Seu abrigo improvisado aguentou a chuva.", xp: 35, outcome: "positive" },
      { label: "Continuar caminhando", effect: "Você ficou encharcado e com frio.", xp: 5, outcome: "negative" },
    ],
  },
  {
    id: "tracks", title: "Rastros de Animal",
    description: "Você encontrou rastros frescos no chão. Parecem ser de um animal grande.",
    iconName: "compass",
    options: [
      { label: "Seguir os rastros", effect: "Levaram você a uma fonte de água limpa!", xp: 50, outcome: "positive" },
      { label: "Evitar a área", effect: "Você seguiu seguro por outro caminho.", xp: 15, outcome: "neutral" },
      { label: "Montar armadilha", effect: "A armadilha funcionou! Você conseguiu alimento.", xp: 45, outcome: "positive" },
    ],
  },
  {
    id: "berries", title: "Frutas Desconhecidas",
    description: "Você encontrou um arbusto com frutas coloridas. São comestíveis?",
    iconName: "apple",
    options: [
      { label: "Testar com cuidado", effect: "Eram comestíveis! Você recuperou energia.", xp: 35, outcome: "positive" },
      { label: "Não arriscar", effect: "Decisão sábia. Melhor não arriscar.", xp: 20, outcome: "neutral" },
      { label: "Comer sem testar", effect: "Sorte! Eram deliciosas e nutritivas.", xp: 25, outcome: "positive" },
    ],
  },
  {
    id: "fire", title: "Incêndio Florestal!",
    description: "Fumaça densa surge ao longe. O fogo está se espalhando rapidamente.",
    iconName: "flame",
    options: [
      { label: "Fugir contra o vento", effect: "Você escapou a tempo seguindo o vento!", xp: 40, outcome: "positive" },
      { label: "Buscar rio ou lago", effect: "Encontrou um rio e ficou em segurança.", xp: 50, outcome: "positive" },
      { label: "Subir em árvore alta", effect: "A fumaça dificultou a respiração, mas o fogo passou.", xp: 10, outcome: "negative" },
    ],
  },
  {
    id: "lost", title: "Desorientado!",
    description: "A neblina espessa fez você perder a noção de direção.",
    iconName: "compass",
    options: [
      { label: "Usar o musgo nas árvores", effect: "O musgo indicou o norte. Voltou ao caminho certo!", xp: 45, outcome: "positive" },
      { label: "Esperar a neblina passar", effect: "Demorou, mas a visibilidade melhorou.", xp: 20, outcome: "neutral" },
      { label: "Seguir instinto", effect: "Você se perdeu ainda mais...", xp: 5, outcome: "negative" },
    ],
  },
];

export const initialPoints: MapPoint[] = [
  { id: "1", lat: -3.1190, lng: -60.0217, type: "water", name: "Nascente da Serra", description: "Água cristalina brotando entre rochas. Segura para beber.", discovered: false, xpReward: 25 },
  { id: "2", lat: -3.0800, lng: -59.9600, type: "danger", name: "Território de Onças", description: "Região com avistamentos frequentes de onças-pintadas.", discovered: false, xpReward: 40 },
  { id: "3", lat: -3.1400, lng: -59.9900, type: "shelter", name: "Caverna do Morro", description: "Caverna natural protegida dos ventos. Ótima para acampamento.", discovered: false, xpReward: 30 },
  { id: "4", lat: -3.1000, lng: -59.9400, type: "resource", name: "Bosque de Castanheiras", description: "Árvores com frutos comestíveis e madeira resistente.", discovered: false, xpReward: 20 },
  { id: "5", lat: -3.1600, lng: -60.0500, type: "water", name: "Rio Escondido", description: "Rio de águas calmas. Possibilidade de pesca.", discovered: false, xpReward: 25 },
  { id: "6", lat: -3.1500, lng: -59.9700, type: "danger", name: "Pântano Traiçoeiro", description: "Solo instável e animais peçonhentos. Evite à noite.", discovered: false, xpReward: 35 },
  { id: "7", lat: -3.0900, lng: -59.9200, type: "shelter", name: "Ruínas Antigas", description: "Estrutura abandonada que oferece proteção contra chuva.", discovered: false, xpReward: 30 },
  { id: "8", lat: -3.1700, lng: -60.0000, type: "resource", name: "Campo de Ervas", description: "Ervas medicinais e comestíveis em abundância.", discovered: false, xpReward: 20 },
  { id: "9", lat: -3.1300, lng: -59.9500, type: "event", name: "Zona Misteriosa", description: "Algo estranho acontece nesta área...", discovered: false, xpReward: 0 },
  { id: "10", lat: -3.0700, lng: -59.9100, type: "event", name: "Ponto de Encontro", description: "Vestígios de acampamento recente.", discovered: false, xpReward: 0 },
  { id: "11", lat: -3.1200, lng: -59.9800, type: "resource", name: "Pedreira Natural", description: "Pedras afiadas úteis para ferramentas.", discovered: false, xpReward: 15 },
  { id: "12", lat: -3.0600, lng: -59.9300, type: "water", name: "Cachoeira Oculta", description: "Cachoeira com piscina natural. Água fresca em abundância.", discovered: false, xpReward: 30 },
];

export const typeConfig: Record<string, TypeConfig> = {
  water: { icon: DropletsIcon, color: "#3b82f6", label: "Água", emoji: "💧" },
  danger: { icon: AlertTriangle, color: "#ef4444", label: "Perigo", emoji: "⚠️" },
  shelter: { icon: Mountain, color: "#8b5cf6", label: "Abrigo", emoji: "🏕️" },
  resource: { icon: TreePine, color: "#22c55e", label: "Recurso", emoji: "🌲" },
  event: { icon: Zap, color: "#eab308", label: "Evento", emoji: "⚡" },
};

/* ───── Map Layers: Trails, Camping, Escape Routes ───── */
export interface MapLayer {
  id: string;
  name: string;
  type: "trail" | "camping" | "escape";
  color: string;
  coords: [number, number][];
  description: string;
}

export const mapLayers: MapLayer[] = [
  {
    id: "trail-1", name: "Trilha da Nascente", type: "trail", color: "#22c55e",
    description: "Trilha moderada que leva à nascente da serra. 3.5 km.",
    coords: [[-3.1190, -60.0217], [-3.1200, -60.0150], [-3.1250, -60.0100], [-3.1300, -60.0050], [-3.1400, -59.9900]],
  },
  {
    id: "trail-2", name: "Trilha do Rio", type: "trail", color: "#16a34a",
    description: "Caminho ao longo do rio, terreno plano. 4.2 km.",
    coords: [[-3.1600, -60.0500], [-3.1550, -60.0400], [-3.1500, -60.0300], [-3.1450, -60.0200], [-3.1400, -60.0100], [-3.1300, -59.9950]],
  },
  {
    id: "trail-3", name: "Trilha da Cachoeira", type: "trail", color: "#4ade80",
    description: "Trilha íngreme até a cachoeira oculta. 2.8 km.",
    coords: [[-3.0900, -59.9200], [-3.0850, -59.9250], [-3.0750, -59.9280], [-3.0650, -59.9300], [-3.0600, -59.9300]],
  },
  {
    id: "camp-1", name: "Área de Camping Norte", type: "camping", color: "#a855f7",
    description: "Terreno plano e protegido. Ideal para grupos.",
    coords: [[-3.0850, -59.9550], [-3.0850, -59.9450], [-3.0950, -59.9450], [-3.0950, -59.9550], [-3.0850, -59.9550]],
  },
  {
    id: "camp-2", name: "Área de Camping Sul", type: "camping", color: "#c084fc",
    description: "Próximo ao rio, com sombra de árvores.",
    coords: [[-3.1550, -60.0150], [-3.1550, -60.0050], [-3.1650, -60.0050], [-3.1650, -60.0150], [-3.1550, -60.0150]],
  },
  {
    id: "escape-1", name: "Rota de Fuga Principal", type: "escape", color: "#ef4444",
    description: "Rota direta para zona segura ao norte. Use em emergências.",
    coords: [[-3.1500, -59.9700], [-3.1400, -59.9650], [-3.1300, -59.9550], [-3.1100, -59.9400], [-3.0900, -59.9200], [-3.0700, -59.9100]],
  },
  {
    id: "escape-2", name: "Rota de Fuga Alternativa", type: "escape", color: "#f87171",
    description: "Rota alternativa pelo oeste. Mais longa, mas mais segura.",
    coords: [[-3.1500, -59.9700], [-3.1450, -59.9850], [-3.1350, -60.0000], [-3.1250, -60.0100], [-3.1190, -60.0217]],
  },
];

export const layerTypeConfig = {
  trail: { label: "Trilhas", color: "#22c55e", dash: "" },
  camping: { label: "Áreas de Camping", color: "#a855f7", dash: "" },
  escape: { label: "Rotas de Fuga", color: "#ef4444", dash: "12 8" },
};
