import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import {
  Droplets, Mountain, TreePine, AlertTriangle, Zap,
  MapPin, Compass, Skull, Apple, Flame, Shield, X, Navigation, Locate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ───── Types ───── */
interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  type: "water" | "danger" | "shelter" | "resource" | "event";
  name: string;
  description: string;
  discovered: boolean;
  xpReward: number;
}

interface RandomEvent {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  options: { label: string; effect: string; xp: number; outcome: "positive" | "negative" | "neutral" }[];
}

/* ───── Random Events ───── */
const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: "snake", title: "Cobra no Caminho!",
    description: "Uma cobra venenosa bloqueia sua passagem. O que você faz?",
    icon: <Skull size={24} className="text-destructive" />,
    options: [
      { label: "Recuar devagar", effect: "Você recuou com segurança. Boa decisão!", xp: 30, outcome: "positive" },
      { label: "Tentar espantar", effect: "A cobra atacou, mas você desviou por pouco.", xp: 10, outcome: "negative" },
      { label: "Contornar pela mata", effect: "Você gastou energia extra, mas passou em segurança.", xp: 20, outcome: "neutral" },
    ],
  },
  {
    id: "storm", title: "Tempestade se Aproxima!",
    description: "Nuvens escuras surgem no horizonte. Uma tempestade está chegando rápido.",
    icon: <Droplets size={24} className="text-primary" />,
    options: [
      { label: "Buscar abrigo natural", effect: "Você encontrou uma caverna e ficou seco!", xp: 40, outcome: "positive" },
      { label: "Construir abrigo rápido", effect: "Seu abrigo improvisado aguentou a chuva.", xp: 35, outcome: "positive" },
      { label: "Continuar caminhando", effect: "Você ficou encharcado e com frio.", xp: 5, outcome: "negative" },
    ],
  },
  {
    id: "tracks", title: "Rastros de Animal",
    description: "Você encontrou rastros frescos no chão. Parecem ser de um animal grande.",
    icon: <Compass size={24} className="text-accent-foreground" />,
    options: [
      { label: "Seguir os rastros", effect: "Levaram você a uma fonte de água limpa!", xp: 50, outcome: "positive" },
      { label: "Evitar a área", effect: "Você seguiu seguro por outro caminho.", xp: 15, outcome: "neutral" },
      { label: "Montar armadilha", effect: "A armadilha funcionou! Você conseguiu alimento.", xp: 45, outcome: "positive" },
    ],
  },
  {
    id: "berries", title: "Frutas Desconhecidas",
    description: "Você encontrou um arbusto com frutas coloridas. São comestíveis?",
    icon: <Apple size={24} className="text-primary" />,
    options: [
      { label: "Testar com cuidado", effect: "Eram comestíveis! Você recuperou energia.", xp: 35, outcome: "positive" },
      { label: "Não arriscar", effect: "Decisão sábia. Melhor não arriscar.", xp: 20, outcome: "neutral" },
      { label: "Comer sem testar", effect: "Sorte! Eram deliciosas e nutritivas.", xp: 25, outcome: "positive" },
    ],
  },
  {
    id: "fire", title: "Incêndio Florestal!",
    description: "Fumaça densa surge ao longe. O fogo está se espalhando rapidamente.",
    icon: <Flame size={24} className="text-destructive" />,
    options: [
      { label: "Fugir contra o vento", effect: "Você escapou a tempo seguindo o vento!", xp: 40, outcome: "positive" },
      { label: "Buscar rio ou lago", effect: "Encontrou um rio e ficou em segurança.", xp: 50, outcome: "positive" },
      { label: "Subir em árvore alta", effect: "A fumaça dificultou a respiração, mas o fogo passou.", xp: 10, outcome: "negative" },
    ],
  },
  {
    id: "lost", title: "Desorientado!",
    description: "A neblina espessa fez você perder a noção de direção.",
    icon: <Compass size={24} className="text-muted-foreground" />,
    options: [
      { label: "Usar o musgo nas árvores", effect: "O musgo indicou o norte. Voltou ao caminho certo!", xp: 45, outcome: "positive" },
      { label: "Esperar a neblina passar", effect: "Demorou, mas a visibilidade melhorou.", xp: 20, outcome: "neutral" },
      { label: "Seguir instinto", effect: "Você se perdeu ainda mais...", xp: 5, outcome: "negative" },
    ],
  },
];

/* ───── Points (real coords - Amazon region) ───── */
const initialPoints: MapPoint[] = [
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

/* ───── Config ───── */
const typeConfig = {
  water: { icon: Droplets, color: "#3b82f6", label: "Água", emoji: "💧" },
  danger: { icon: AlertTriangle, color: "#ef4444", label: "Perigo", emoji: "⚠️" },
  shelter: { icon: Mountain, color: "#8b5cf6", label: "Abrigo", emoji: "🏕️" },
  resource: { icon: TreePine, color: "#22c55e", label: "Recurso", emoji: "🌲" },
  event: { icon: Zap, color: "#eab308", label: "Evento", emoji: "⚡" },
};

/* ───── Custom marker icons ───── */
const createIcon = (color: string, discovered: boolean) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${discovered ? color : '#6b7280'}" opacity="${discovered ? 1 : 0.6}"/>
    <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
    <circle cx="16" cy="16" r="4" fill="${discovered ? color : '#9ca3af'}"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

/* ───── Location button component ───── */
const LocateButton = () => {
  const map = useMap();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 14 });
  };
  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-4 right-4 z-[1000] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      title="Minha localização"
    >
      <Locate size={20} />
    </button>
  );
};

/* ───── Main Component ───── */
const MapaSobrevivencia = () => {
  const [points, setPoints] = useState(initialPoints);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [eventResult, setEventResult] = useState<{ effect: string; xp: number; outcome: string } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { addXP } = useUserProfile();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  const triggerRandomEvent = useCallback(() => {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    setActiveEvent(event);
    setEventResult(null);
  }, []);

  const discover = (point: MapPoint) => {
    if (!point.discovered) {
      setPoints((prev) => prev.map((p) => p.id === point.id ? { ...p, discovered: true } : p));
      if (point.type === "event") {
        triggerRandomEvent();
        return;
      }
      if (point.xpReward > 0) {
        addXP(point.xpReward);
        toast.success(`📍 ${point.name} descoberto! +${point.xpReward} XP`);
      }
    }
    setSelected({ ...point, discovered: true });
  };

  const handleEventChoice = (option: { label: string; effect: string; xp: number; outcome: string }) => {
    setEventResult(option);
    if (option.xp > 0) {
      addXP(option.xp);
      toast.success(`⚡ +${option.xp} XP ganhos no evento!`);
    }
  };

  const closeEvent = () => { setActiveEvent(null); setEventResult(null); };

  const discovered = points.filter((p) => p.discovered).length;
  const totalXPFromMap = points.filter((p) => p.discovered && p.xpReward > 0).reduce((sum, p) => sum + p.xpReward, 0);

  const defaultCenter: [number, number] = userLocation || [-3.1190, -60.0217];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground tracking-wider text-center uppercase mb-2">
            Mapa de Sobrevivência
          </h1>
          <p className="text-center text-muted-foreground mb-4 flex items-center justify-center gap-2">
            <Navigation size={16} className="text-primary" />
            Explore o território em tempo real
          </p>

          <div className="max-w-xs mx-auto mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{discovered}/{points.length} descobertos</span>
              <span>{totalXPFromMap} XP ganhos</span>
            </div>
            <Progress value={(discovered / points.length) * 100} className="h-2" />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-xl border border-border overflow-hidden shadow-lg"
            style={{ height: "500px" }}
          >
            <MapContainer
              center={defaultCenter}
              zoom={13}
              className="h-full w-full z-0"
              style={{ background: "hsl(120 5% 8%)" }}
              zoomControl={false}
            >
              {/* Dark Waze-style tile layer */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {/* Points of interest */}
              {points.map((p) => {
                const cfg = typeConfig[p.type];
                return (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={createIcon(cfg.color, p.discovered)}
                    eventHandlers={{ click: () => discover(p) }}
                  >
                    <Popup className="survival-popup">
                      <div className="text-sm font-bold">{p.discovered ? `${cfg.emoji} ${p.name}` : "🔍 Clique para explorar"}</div>
                      {p.discovered && <div className="text-xs mt-1 opacity-80">{p.description}</div>}
                    </Popup>
                  </Marker>
                );
              })}

              {/* User location */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={L.divIcon({
                    html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>`,
                    className: "",
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                  })}
                />
              )}

              <LocateButton />
            </MapContainer>

            {/* Floating compass */}
            <div className="absolute top-3 left-3 z-[1000] bg-card/90 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center border border-border shadow-md">
              <Compass size={18} className="text-primary" />
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Legend */}
            <div className="bg-gradient-card rounded-xl border border-border p-4">
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Legenda
              </h3>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 py-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color + "30", border: `1px solid ${cfg.color}60` }}>
                    <cfg.icon size={11} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>

            <Button onClick={triggerRandomEvent} className="w-full" variant="outline" size="sm">
              <Zap size={14} className="mr-2" /> Evento Aleatório
            </Button>

            {/* Selected point */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-card rounded-xl border border-border p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const cfg = typeConfig[selected.type];
                      return <cfg.icon size={16} style={{ color: cfg.color }} />;
                    })()}
                    <h3 className="font-heading text-sm text-foreground">{selected.name}</h3>
                    {selected.xpReward > 0 && (
                      <span className="ml-auto text-xs text-primary font-medium">+{selected.xpReward} XP</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Discoveries */}
            <div className="bg-gradient-card rounded-xl border border-border p-4">
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Shield size={14} className="text-primary" /> Descobertas
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {points.filter((p) => p.discovered).map((p) => {
                  const cfg = typeConfig[p.type];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-md p-1.5 transition-colors"
                    >
                      <cfg.icon size={12} style={{ color: cfg.color }} />
                      <span className="text-xs text-muted-foreground flex-1">{p.name}</span>
                      {p.xpReward > 0 && <span className="text-[10px] text-primary">+{p.xpReward}</span>}
                    </button>
                  );
                })}
                {discovered === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Clique nos pontos do mapa para explorar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Modal */}
        <AnimatePresence>
          {activeEvent && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && eventResult && closeEvent()}
            >
              <motion.div
                initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
                className="bg-background border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {activeEvent.icon}
                    <h3 className="font-heading text-lg text-foreground">{activeEvent.title}</h3>
                  </div>
                  {eventResult && (
                    <button onClick={closeEvent} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-5">{activeEvent.description}</p>
                {!eventResult ? (
                  <div className="space-y-2">
                    {activeEvent.options.map((opt, i) => (
                      <motion.button
                        key={i}
                        onClick={() => handleEventChoice(opt)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-foreground"
                        whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={`p-4 rounded-lg border ${
                      eventResult.outcome === "positive" ? "border-primary/50 bg-primary/10" :
                      eventResult.outcome === "negative" ? "border-destructive/50 bg-destructive/10" :
                      "border-border bg-muted/30"
                    }`}>
                      <p className="text-sm text-foreground mb-2">{eventResult.effect}</p>
                      {eventResult.xp > 0 && <p className="text-sm font-heading text-primary">+{eventResult.xp} XP ganhos!</p>}
                    </div>
                    <Button onClick={closeEvent} className="w-full mt-4" size="sm">Continuar Explorando</Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default MapaSobrevivencia;
