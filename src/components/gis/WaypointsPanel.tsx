import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { List, Search, Trash2, Crosshair, Pencil, Route as RouteIcon, MapPin } from "lucide-react";
import type { Waypoint, Route, WaypointType, LatLng } from "@/data/mapTypes";
import { WAYPOINT_TYPES, WAYPOINT_TYPE_LIST } from "@/data/waypointTypes";
import { haversine, formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface Props {
  waypoints: Waypoint[];
  routes: Route[];
  userPosition: LatLng | null;
  onFlyTo: (lat: number, lng: number) => void;
  onEditWaypoint: (id: string) => void;
  onRemoveWaypoint: (id: string) => void;
  onClearWaypoints: () => void;
  onShowRoute: (id: string | null) => void;
  onRemoveRoute: (id: string) => void;
  onClearRoutes: () => void;
  activeRouteId: string | null;
}

type SortMode = "recent" | "name" | "distance";

const WaypointsPanel = ({
  waypoints, routes, userPosition, onFlyTo, onEditWaypoint, onRemoveWaypoint,
  onClearWaypoints, onShowRoute, onRemoveRoute, onClearRoutes, activeRouteId,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<WaypointType | "all">("all");
  const [sort, setSort] = useState<SortMode>("recent");

  const filtered = useMemo(() => {
    let list = waypoints;
    if (typeFilter !== "all") list = list.filter((w) => w.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((w) => w.name.toLowerCase().includes(q) || w.note.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "recent") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "distance" && userPosition) {
      sorted.sort((a, b) => haversine(userPosition, a) - haversine(userPosition, b));
    }
    return sorted;
  }, [waypoints, typeFilter, search, sort, userPosition]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="secondary" className="h-12 w-12 shadow-lg" aria-label="Gerenciar waypoints" title="Waypoints e rotas">
          <List size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Waypoints e Rotas</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="waypoints" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="waypoints" className="flex-1">
              <MapPin size={14} className="mr-1" /> Waypoints ({waypoints.length})
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex-1">
              <RouteIcon size={14} className="mr-1" /> Rotas ({routes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waypoints" className="flex-1 flex flex-col overflow-hidden mt-0 p-4 gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..." className="pl-8" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border",
                  typeFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border",
                )}
              >Todos</button>
              {WAYPOINT_TYPE_LIST.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border",
                    typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border",
                  )}
                >
                  {WAYPOINT_TYPES[t].emoji} {WAYPOINT_TYPES[t].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center text-xs">
              <span className="text-muted-foreground">Ordenar:</span>
              {(["recent", "name", "distance"] as SortMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSort(m)}
                  className={cn(
                    "px-2 py-0.5 rounded",
                    sort === m ? "bg-secondary" : "hover:bg-secondary/50",
                    m === "distance" && !userPosition && "opacity-50 cursor-not-allowed",
                  )}
                  disabled={m === "distance" && !userPosition}
                >
                  {m === "recent" ? "Recente" : m === "name" ? "Nome" : "Distância"}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
              {filtered.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Nenhum waypoint. Shift+clique no mapa (ou toque longo) para criar.
                </div>
              )}
              {filtered.map((w) => {
                const cfg = WAYPOINT_TYPES[w.type];
                const dist = userPosition ? haversine(userPosition, w) : null;
                return (
                  <div key={w.id} className="border border-border rounded-lg p-2 flex items-center gap-2 bg-card">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: w.color }}
                    >{cfg.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{w.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {w.lat.toFixed(5)}, {w.lng.toFixed(5)}
                        {dist != null && ` · ${formatDistance(dist)}`}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { onFlyTo(w.lat, w.lng); setOpen(false); }} title="Voar até">
                      <Crosshair size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditWaypoint(w.id)} title="Editar">
                      <Pencil size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemoveWaypoint(w.id)} title="Remover">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                );
              })}
            </div>
            {waypoints.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 size={14} className="mr-1" /> Limpar todos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover todos os waypoints?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearWaypoints}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </TabsContent>

          <TabsContent value="routes" className="flex-1 flex flex-col overflow-hidden mt-0 p-4 gap-3">
            <div className="flex-1 overflow-y-auto space-y-2">
              {routes.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma rota salva. Use a ferramenta de distância e clique em "Salvar como rota".
                </div>
              )}
              {routes.map((r) => (
                <div key={r.id} className={cn(
                  "border rounded-lg p-2 flex items-center gap-2 bg-card",
                  activeRouteId === r.id ? "border-primary" : "border-border",
                )}>
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {r.points.length} pontos · {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <Button
                    size="sm" variant={activeRouteId === r.id ? "default" : "ghost"}
                    onClick={() => onShowRoute(activeRouteId === r.id ? null : r.id)}
                  >
                    {activeRouteId === r.id ? "Ocultar" : "Mostrar"}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemoveRoute(r.id)} title="Remover">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
            {routes.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 size={14} className="mr-1" /> Limpar todas as rotas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover todas as rotas?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearRoutes}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default WaypointsPanel;
