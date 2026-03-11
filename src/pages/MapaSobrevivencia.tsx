import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Droplets, Mountain, TreePine, AlertTriangle, Eye } from "lucide-react";

interface MapPoint {
  id: string;
  x: number;
  y: number;
  type: "water" | "danger" | "shelter" | "resource";
  name: string;
  description: string;
  discovered: boolean;
}

const initialPoints: MapPoint[] = [
  { id: "1", x: 25, y: 30, type: "water", name: "Nascente da Serra", description: "Água cristalina brotando entre rochas. Segura para beber.", discovered: false },
  { id: "2", x: 60, y: 20, type: "danger", name: "Território de Onças", description: "Região com avistamentos frequentes de onças-pintadas.", discovered: false },
  { id: "3", x: 40, y: 55, type: "shelter", name: "Caverna do Morro", description: "Caverna natural protegida dos ventos. Ótima para acampamento.", discovered: false },
  { id: "4", x: 75, y: 45, type: "resource", name: "Bosque de Castanheiras", description: "Árvores com frutos comestíveis e madeira resistente.", discovered: false },
  { id: "5", x: 15, y: 65, type: "water", name: "Rio Escondido", description: "Rio de águas calmas. Possibilidade de pesca.", discovered: false },
  { id: "6", x: 50, y: 75, type: "danger", name: "Pântano Traiçoeiro", description: "Solo instável e animais peçonhentos. Evite à noite.", discovered: false },
  { id: "7", x: 85, y: 70, type: "shelter", name: "Ruínas Antigas", description: "Estrutura abandonada que oferece proteção contra chuva.", discovered: false },
  { id: "8", x: 35, y: 85, type: "resource", name: "Campo de Ervas", description: "Ervas medicinais e comestíveis em abundância.", discovered: false },
];

const typeConfig = {
  water: { icon: Droplets, color: "text-primary", bg: "bg-primary/20", label: "Água" },
  danger: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/20", label: "Perigo" },
  shelter: { icon: Mountain, color: "text-accent-foreground", bg: "bg-accent/30", label: "Abrigo" },
  resource: { icon: TreePine, color: "text-forest-foreground", bg: "bg-forest/30", label: "Recurso" },
};

const MapaSobrevivencia = () => {
  const [points, setPoints] = useState(initialPoints);
  const [selected, setSelected] = useState<MapPoint | null>(null);

  const discover = (id: string) => {
    setPoints((prev) => prev.map((p) => p.id === id ? { ...p, discovered: true } : p));
    setSelected(points.find((p) => p.id === id) || null);
  };

  const discovered = points.filter((p) => p.discovered).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-heading text-3xl text-foreground tracking-wider text-center uppercase mb-2">Mapa de Sobrevivência</h1>
        <p className="text-center text-muted-foreground mb-2">Explore o território e descubra recursos</p>
        <p className="text-center text-sm text-primary mb-8">{discovered}/{points.length} locais descobertos</p>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Map */}
          <div className="relative aspect-[4/3] bg-gradient-card rounded-lg border border-border overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "linear-gradient(hsl(120 8% 30%) 1px, transparent 1px), linear-gradient(90deg, hsl(120 8% 30%) 1px, transparent 1px)",
              backgroundSize: "10% 10%"
            }} />
            {/* Terrain hint */}
            <div className="absolute inset-0 opacity-20" style={{
              background: "radial-gradient(ellipse at 30% 40%, hsl(140 30% 25%), transparent 50%), radial-gradient(ellipse at 70% 60%, hsl(30 30% 20%), transparent 40%)"
            }} />

            {points.map((p) => {
              const cfg = typeConfig[p.type];
              return (
                <motion.button
                  key={p.id}
                  onClick={() => discover(p.id)}
                  className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center transition-all ${p.discovered ? cfg.bg : "bg-muted/50"} border border-border hover:scale-125`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  whileHover={{ scale: 1.3 }}
                  animate={!p.discovered ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={!p.discovered ? { repeat: Infinity, duration: 2 } : {}}
                >
                  {p.discovered ? (
                    <cfg.icon size={14} className={cfg.color} />
                  ) : (
                    <Eye size={14} className="text-muted-foreground" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-gradient-card rounded-lg border border-border p-4">
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">Legenda</h3>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 py-1">
                  <cfg.icon size={14} className={cfg.color} />
                  <span className="text-sm text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>

            {selected && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  {(() => { const cfg = typeConfig[selected.type]; return <cfg.icon size={16} className={cfg.color} />; })()}
                  <h3 className="font-heading text-sm text-foreground">{selected.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </motion.div>
            )}

            <div className="bg-gradient-card rounded-lg border border-border p-4">
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-2">Descobertas</h3>
              <div className="space-y-2">
                {points.filter((p) => p.discovered).map((p) => {
                  const cfg = typeConfig[p.type];
                  return (
                    <button key={p.id} onClick={() => setSelected(p)} className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1 transition-colors">
                      <cfg.icon size={12} className={cfg.color} />
                      <span className="text-xs text-muted-foreground">{p.name}</span>
                    </button>
                  );
                })}
                {discovered === 0 && <p className="text-xs text-muted-foreground">Clique nos pontos do mapa para explorar.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapaSobrevivencia;
