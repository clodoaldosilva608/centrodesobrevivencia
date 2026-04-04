import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWaypoints } from "@/hooks/useWaypoints";
import { toast } from "sonner";
import {
  Droplets, Mountain, AlertTriangle, Zap, MapPin, Compass, Skull, Apple, Flame,
  Shield, X, Navigation, Locate, Plus, Trash2, Route, Tent, TriangleAlert,
  Eye, EyeOff, Flag, Search, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { initialPoints, RANDOM_EVENTS, typeConfig, mapLayers, layerTypeConfig } from "@/data/mapData";
import type { MapPoint, Waypoint } from "@/data/mapTypes";

/* ───── Helpers ───── */
const eventIcons: Record<string, React.ReactNode> = {
  skull: <Skull size={24} className="text-destructive" />,
  droplets: <Droplets size={24} className="text-primary" />,
  compass: <Compass size={24} className="text-accent-foreground" />,
  apple: <Apple size={24} className="text-primary" />,
  flame: <Flame size={24} className="text-destructive" />,
};

const createIcon = (color: string, discovered: boolean) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${discovered ? color : '#6b7280'}" opacity="${discovered ? 1 : 0.6}"/>
    <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
    <circle cx="16" cy="16" r="4" fill="${discovered ? color : '#9ca3af'}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42] });
};

const createWaypointIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="3"/>
    <circle cx="14" cy="14" r="4" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16] });
};

/* ───── Sub-components ───── */
const LocateButton = () => {
  const map = useMap();
  return (
    <button
      onClick={() => map.locate({ setView: true, maxZoom: 14 })}
      className="absolute bottom-4 right-4 z-[1000] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      title="Minha localização"
    >
      <Locate size={20} />
    </button>
  );
};

const WaypointPlacer = ({ active, onPlace }: { active: boolean; onPlace: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      if (active) onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/* ───── Waypoint Colors ───── */
const waypointColors = ["#f59e0b", "#06b6d4", "#ec4899", "#84cc16", "#f97316"];

/* ───── Main ───── */
const MapaSobrevivencia = () => {
  const [points, setPoints] = useState(initialPoints);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [activeEvent, setActiveEvent] = useState<(typeof RANDOM_EVENTS)[0] | null>(null);
  const [eventResult, setEventResult] = useState<{ effect: string; xp: number; outcome: string } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { addXP } = useUserProfile();
  const { waypoints, addWaypoint, removeWaypoint, clearWaypoints } = useWaypoints();

  // Layer visibility
  const [showTrails, setShowTrails] = useState(true);
  const [showCamping, setShowCamping] = useState(true);
  const [showEscape, setShowEscape] = useState(true);

  // Waypoint placement mode
  const [placingWaypoint, setPlacingWaypoint] = useState(false);
  const [wpName, setWpName] = useState("");
  const [wpNote, setWpNote] = useState("");
  const [wpColor, setWpColor] = useState(waypointColors[0]);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

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
      if (point.type === "event") { triggerRandomEvent(); return; }
      if (point.xpReward > 0) {
        addXP(point.xpReward);
        toast.success(`📍 ${point.name} descoberto! +${point.xpReward} XP`);
      }
    }
    setSelected({ ...point, discovered: true });
  };

  const handleEventChoice = (option: { label: string; effect: string; xp: number; outcome: string }) => {
    setEventResult(option);
    if (option.xp > 0) { addXP(option.xp); toast.success(`⚡ +${option.xp} XP ganhos no evento!`); }
  };

  const closeEvent = () => { setActiveEvent(null); setEventResult(null); };

  const handlePlaceWaypoint = (lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setPlacingWaypoint(false);
  };

  const confirmWaypoint = () => {
    if (!pendingCoords || !wpName.trim()) return;
    addWaypoint(pendingCoords.lat, pendingCoords.lng, wpName, wpNote, wpColor);
    toast.success(`🚩 Waypoint "${wpName}" adicionado!`);
    setPendingCoords(null);
    setWpName("");
    setWpNote("");
  };

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
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-xl border border-border overflow-hidden shadow-lg"
            style={{ height: "550px" }}
          >
            {placingWaypoint && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
                🚩 Clique no mapa para marcar
              </div>
            )}

            <MapContainer center={defaultCenter} zoom={13} className="h-full w-full z-0" style={{ background: "hsl(120 5% 8%)" }} zoomControl={false}>
              <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

              <WaypointPlacer active={placingWaypoint} onPlace={handlePlaceWaypoint} />

              {/* Trails */}
              {showTrails && mapLayers.filter((l) => l.type === "trail").map((l) => (
                <Polyline key={l.id} positions={l.coords} pathOptions={{ color: l.color, weight: 3, opacity: 0.8 }}>
                  <Popup><div className="text-sm font-bold">🥾 {l.name}</div><div className="text-xs mt-1 opacity-80">{l.description}</div></Popup>
                </Polyline>
              ))}

              {/* Camping areas */}
              {showCamping && mapLayers.filter((l) => l.type === "camping").map((l) => (
                <Polygon key={l.id} positions={l.coords} pathOptions={{ color: l.color, weight: 2, fillOpacity: 0.15, dashArray: "" }}>
                  <Popup><div className="text-sm font-bold">⛺ {l.name}</div><div className="text-xs mt-1 opacity-80">{l.description}</div></Popup>
                </Polygon>
              ))}

              {/* Escape routes */}
              {showEscape && mapLayers.filter((l) => l.type === "escape").map((l) => (
                <Polyline key={l.id} positions={l.coords} pathOptions={{ color: l.color, weight: 4, opacity: 0.7, dashArray: "12 8" }}>
                  <Popup><div className="text-sm font-bold">🚨 {l.name}</div><div className="text-xs mt-1 opacity-80">{l.description}</div></Popup>
                </Polyline>
              ))}

              {/* POI markers */}
              {points.map((p) => {
                const cfg = typeConfig[p.type];
                return (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={createIcon(cfg.color, p.discovered)} eventHandlers={{ click: () => discover(p) }}>
                    <Popup>
                      <div className="text-sm font-bold">{p.discovered ? `${cfg.emoji} ${p.name}` : "🔍 Clique para explorar"}</div>
                      {p.discovered && <div className="text-xs mt-1 opacity-80">{p.description}</div>}
                    </Popup>
                  </Marker>
                );
              })}

              {/* User waypoints */}
              {waypoints.map((wp) => (
                <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={createWaypointIcon(wp.color)}>
                  <Popup>
                    <div className="text-sm font-bold">🚩 {wp.name}</div>
                    {wp.note && <div className="text-xs mt-1 opacity-80">{wp.note}</div>}
                    <div className="text-[10px] mt-1 opacity-50">{new Date(wp.createdAt).toLocaleString("pt-BR")}</div>
                  </Popup>
                </Marker>
              ))}

              {/* Pending waypoint */}
              {pendingCoords && (
                <Marker position={[pendingCoords.lat, pendingCoords.lng]} icon={createWaypointIcon(wpColor)} />
              )}

              {/* User location */}
              {userLocation && (
                <Marker position={userLocation} icon={L.divIcon({
                  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>`,
                  className: "", iconSize: [16, 16], iconAnchor: [8, 8],
                })} />
              )}

              <LocateButton />
            </MapContainer>

            <div className="absolute top-3 left-3 z-[1000] bg-card/90 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center border border-border shadow-md">
              <Compass size={18} className="text-primary" />
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {/* Layers toggle */}
            <div className="bg-gradient-card rounded-xl border border-border p-4">
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Route size={14} className="text-primary" /> Camadas
              </h3>
              <div className="space-y-2">
                <button onClick={() => setShowTrails(!showTrails)} className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors text-sm ${showTrails ? "bg-primary/10 text-foreground" : "text-muted-foreground"}`}>
                  {showTrails ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span className="w-3 h-3 rounded-full" style={{ background: layerTypeConfig.trail.color }} />
                  Trilhas
                </button>
                <button onClick={() => setShowCamping(!showCamping)} className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors text-sm ${showCamping ? "bg-primary/10 text-foreground" : "text-muted-foreground"}`}>
                  {showCamping ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span className="w-3 h-3 rounded-full" style={{ background: layerTypeConfig.camping.color }} />
                  Áreas de Camping
                </button>
                <button onClick={() => setShowEscape(!showEscape)} className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors text-sm ${showEscape ? "bg-primary/10 text-foreground" : "text-muted-foreground"}`}>
                  {showEscape ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span className="w-3 h-3 rounded-full" style={{ background: layerTypeConfig.escape.color }} />
                  Rotas de Fuga
                </button>
              </div>
            </div>

            {/* Waypoints */}
            <div className="bg-gradient-card rounded-xl border border-border p-4">
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Flag size={14} className="text-primary" /> Meus Waypoints
              </h3>

              {pendingCoords ? (
                <div className="space-y-2">
                  <input
                    value={wpName} onChange={(e) => setWpName(e.target.value)}
                    placeholder="Nome do waypoint"
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground"
                  />
                  <input
                    value={wpNote} onChange={(e) => setWpNote(e.target.value)}
                    placeholder="Nota (opcional)"
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="flex gap-1">
                    {waypointColors.map((c) => (
                      <button key={c} onClick={() => setWpColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${wpColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={confirmWaypoint} size="sm" className="flex-1 gap-1" disabled={!wpName.trim()}>
                      <Plus size={14} /> Salvar
                    </Button>
                    <Button onClick={() => setPendingCoords(null)} size="sm" variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setPlacingWaypoint(true)} className="w-full gap-2" variant="outline" size="sm" disabled={placingWaypoint}>
                  <Plus size={14} /> Adicionar Waypoint
                </Button>
              )}

              {waypoints.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                  {waypoints.map((wp) => (
                    <div key={wp.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: wp.color }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-foreground block truncate">{wp.name}</span>
                        {wp.note && <span className="text-[10px] text-muted-foreground block truncate">{wp.note}</span>}
                      </div>
                      <button onClick={() => removeWaypoint(wp.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button onClick={clearWaypoints} className="text-[10px] text-destructive/70 hover:text-destructive w-full text-center mt-1">
                    Limpar todos
                  </button>
                </div>
              )}
            </div>

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

            {/* Selected */}
            <AnimatePresence>
              {selected && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => { const cfg = typeConfig[selected.type]; return <cfg.icon size={16} style={{ color: cfg.color }} />; })()}
                    <h3 className="font-heading text-sm text-foreground">{selected.name}</h3>
                    {selected.xpReward > 0 && <span className="ml-auto text-xs text-primary font-medium">+{selected.xpReward} XP</span>}
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
                    <button key={p.id} onClick={() => setSelected(p)}
                      className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-md p-1.5 transition-colors">
                      <cfg.icon size={12} style={{ color: cfg.color }} />
                      <span className="text-xs text-muted-foreground flex-1">{p.name}</span>
                      {p.xpReward > 0 && <span className="text-[10px] text-primary">+{p.xpReward}</span>}
                    </button>
                  );
                })}
                {discovered === 0 && <p className="text-xs text-muted-foreground text-center py-2">Clique nos pontos do mapa para explorar.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Event Modal */}
        <AnimatePresence>
          {activeEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && eventResult && closeEvent()}>
              <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
                className="bg-background border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {eventIcons[activeEvent.iconName]}
                    <h3 className="font-heading text-lg text-foreground">{activeEvent.title}</h3>
                  </div>
                  {eventResult && <button onClick={closeEvent} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>}
                </div>
                <p className="text-sm text-muted-foreground mb-5">{activeEvent.description}</p>
                {!eventResult ? (
                  <div className="space-y-2">
                    {activeEvent.options.map((opt, i) => (
                      <motion.button key={i} onClick={() => handleEventChoice(opt)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-foreground"
                        whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={`p-4 rounded-lg border ${eventResult.outcome === "positive" ? "border-primary/50 bg-primary/10" : eventResult.outcome === "negative" ? "border-destructive/50 bg-destructive/10" : "border-border bg-muted/30"}`}>
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
