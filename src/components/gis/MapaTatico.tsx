import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CoordinateReadout from "./CoordinateReadout";
import GoToCoordinate from "./GoToCoordinate";
import LayerSwitcher, { BUILT_INS, type BaseLayer } from "./LayerSwitcher";
import OfflineRegionsManager from "./OfflineRegionsManager";
import MeasureToolbar, { type Tool } from "./MeasureToolbar";
import DistanceTool from "./DistanceTool";
import AreaTool from "./AreaTool";
import ElevationProfile from "./ElevationProfile";
import CompassHUD from "./CompassHUD";
import WaypointLayer from "./WaypointLayer";
import WaypointDialog from "./WaypointDialog";
import WaypointsPanel from "./WaypointsPanel";
import ImportExportMenu from "./ImportExportMenu";
import { getTile, putTile } from "@/lib/tileCache";
import type { LatLng } from "@/lib/geo";
import { useWaypoints } from "@/hooks/useWaypoints";
import { useRoutes } from "@/hooks/useRoutes";
import type { Waypoint } from "@/data/mapTypes";
import { Locate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

class CachedTileLayer extends L.TileLayer {
  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const img = document.createElement("img");
    img.alt = "";
    img.setAttribute("role", "presentation");
    const url = this.getTileUrl(coords);
    (async () => {
      try {
        const cached = await getTile(url);
        if (cached) {
          img.src = URL.createObjectURL(cached);
          done(undefined, img);
          return;
        }
        const res = await fetch(url, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          putTile(url, blob).catch(() => {});
          img.src = URL.createObjectURL(blob);
          done(undefined, img);
          return;
        }
        img.src = url;
        done(undefined, img);
      } catch {
        img.src = url;
        done(undefined, img);
      }
    })();
    return img;
  }
}

const CachedTiles = ({ layer }: { layer: BaseLayer }) => {
  const map = useMap();
  useEffect(() => {
    const tl = new CachedTileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom ?? 19,
      crossOrigin: true,
    });
    tl.addTo(map);
    return () => { tl.remove(); };
  }, [map, layer]);
  return null;
};

const LocateButton = ({ onLocated }: { onLocated: (p: LatLng) => void }) => {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      size="icon"
      variant="secondary"
      aria-label="Minha localização"
      className="h-12 w-12 shadow-lg"
      disabled={loading}
      onClick={() => {
        if (!navigator.geolocation) {
          toast.error("Geolocalização indisponível");
          return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.flyTo([p.lat, p.lng], 15, { duration: 1.2 });
            onLocated(p);
            setLoading(false);
          },
          () => { toast.error("Não foi possível obter sua posição"); setLoading(false); },
          { enableHighAccuracy: true, timeout: 8000 },
        );
      }}
    >
      <Locate size={20} />
    </Button>
  );
};

/** Handler para long-press / shift+click no mapa, disparando abertura do dialog. */
const MapInteractionHandler = ({ onCreateWaypoint }: { onCreateWaypoint: (p: LatLng) => void }) => {
  const map = useMap();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onClick = (e: L.LeafletMouseEvent) => {
      const orig = e.originalEvent as MouseEvent;
      if (orig.shiftKey) {
        onCreateWaypoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };
    const onDown = (e: L.LeafletMouseEvent) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onCreateWaypoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }, 650);
    };
    const cancel = () => {
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    };
    map.on("click", onClick);
    map.on("mousedown", onDown);
    map.on("mouseup", cancel);
    map.on("mousemove", cancel);
    map.on("dragstart", cancel);
    return () => {
      map.off("click", onClick);
      map.off("mousedown", onDown);
      map.off("mouseup", cancel);
      map.off("mousemove", cancel);
      map.off("dragstart", cancel);
      cancel();
    };
  }, [map, onCreateWaypoint]);

  return null;
};

const RouteLayer = ({ points, color }: { points: LatLng[]; color: string }) => {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const line = L.polyline(points.map((p) => [p.lat, p.lng]), {
      color, weight: 4, opacity: 0.85, dashArray: "8,4",
    }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [40, 40], maxZoom: 15 });
    return () => { line.remove(); };
  }, [map, points, color]);
  return null;
};

const FlyController = ({ target }: { target: LatLng | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), { duration: 1.2 });
  }, [map, target]);
  return null;
};

interface Props { className?: string; }

const MapaTatico = ({ className = "" }: Props) => {
  const [layer, setLayer] = useState<BaseLayer>(BUILT_INS[0]);
  const [tool, setTool] = useState<Tool>(null);
  const [distancePath, setDistancePath] = useState<LatLng[]>([]);
  const [areaPath, setAreaPath] = useState<LatLng[]>([]);
  const [elevationOpen, setElevationOpen] = useState(false);
  const [userPosition, setUserPosition] = useState<LatLng | null>(null);
  const [unit, setUnit] = useState<"metric" | "nautical">(() =>
    (localStorage.getItem("sh_gis_unit") as "metric" | "nautical") || "metric"
  );

  const { waypoints, addWaypoint, updateWaypoint, removeWaypoint, clearWaypoints, mergeWaypoints } = useWaypoints();
  const { routes, addRoute, removeRoute, clearRoutes, mergeRoutes } = useRoutes();

  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitial, setDialogInitial] = useState<Partial<Waypoint> | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);

  useEffect(() => { localStorage.setItem("sh_gis_unit", unit); }, [unit]);

  const selectedWaypoint = useMemo(
    () => waypoints.find((w) => w.id === selectedWaypointId) ?? null,
    [waypoints, selectedWaypointId],
  );
  const activeRoute = useMemo(
    () => routes.find((r) => r.id === activeRouteId) ?? null,
    [routes, activeRouteId],
  );

  const compassTarget: LatLng | null = selectedWaypoint
    ? { lat: selectedWaypoint.lat, lng: selectedWaypoint.lng }
    : distancePath.length > 0
      ? distancePath[distancePath.length - 1]
      : null;
  const compassLabel = selectedWaypoint?.name
    ?? (distancePath.length > 0 ? "Último ponto medido" : undefined);

  const clearAll = () => {
    setDistancePath([]);
    setAreaPath([]);
    setTool(null);
    setActiveRouteId(null);
  };

  const openNewWaypoint = (p: LatLng) => {
    setDialogInitial({ lat: p.lat, lng: p.lng, type: "generico" });
    setDialogOpen(true);
  };
  const openEditWaypoint = (id: string) => {
    const wp = waypoints.find((w) => w.id === id);
    if (!wp) return;
    setDialogInitial(wp);
    setDialogOpen(true);
  };

  const handleSaveWaypoint = (data: Omit<Waypoint, "id" | "createdAt"> & { id?: string }) => {
    if (data.id) {
      updateWaypoint(data.id, data);
      toast.success("Waypoint atualizado");
    } else {
      const wp = addWaypoint(data);
      setSelectedWaypointId(wp.id);
      toast.success(`Waypoint "${wp.name}" criado`);
    }
  };

  const handleSaveRoute = (pts: LatLng[]) => {
    const name = window.prompt("Nome da rota:", `Rota ${new Date().toLocaleString("pt-BR")}`);
    if (!name) return;
    const r = addRoute({ name, color: "#F97316", points: pts });
    toast.success(`Rota "${r.name}" salva`);
  };

  const handleImport = (wpts: Waypoint[], rts: typeof routes) => {
    if (wpts.length) mergeWaypoints(wpts);
    if (rts.length) mergeRoutes(rts);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapContainer
        center={[-15.7801, -47.9292]}
        zoom={5}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "hsl(var(--tactical))" }}
      >
        <CachedTiles layer={layer} />
        <CoordinateReadout />

        {tool === null && (
          <MapInteractionHandler onCreateWaypoint={openNewWaypoint} />
        )}

        <WaypointLayer
          waypoints={waypoints}
          selectedId={selectedWaypointId}
          onSelect={setSelectedWaypointId}
          onEdit={openEditWaypoint}
        />

        {activeRoute && <RouteLayer points={activeRoute.points} color={activeRoute.color} />}
        <FlyController target={flyTarget} />

        <DistanceTool
          active={tool === "distance"}
          unit={unit}
          points={distancePath}
          onPathChange={setDistancePath}
          onFinish={() => setTool(null)}
          onSaveRoute={handleSaveRoute}
        />
        <AreaTool
          active={tool === "area"}
          points={areaPath}
          onChange={setAreaPath}
          onFinish={() => setTool(null)}
        />

        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          <LayerSwitcher activeId={layer.id} onChange={setLayer} />
          <OfflineRegionsManager activeLayerUrl={layer.url} activeLayerName={layer.name} />
          <GoToCoordinate />
          <LocateButton onLocated={setUserPosition} />
          <Button
            size="icon" variant="secondary" className="h-12 w-12 shadow-lg"
            aria-label="Novo waypoint" title="Novo waypoint (usa o centro do mapa)"
            onClick={() => openNewWaypoint({ lat: -15.7801, lng: -47.9292 })}
          >
            <Plus size={20} />
          </Button>
          <WaypointsPanel
            waypoints={waypoints}
            routes={routes}
            userPosition={userPosition}
            onFlyTo={(lat, lng) => setFlyTarget({ lat, lng })}
            onEditWaypoint={openEditWaypoint}
            onRemoveWaypoint={removeWaypoint}
            onClearWaypoints={clearWaypoints}
            onShowRoute={setActiveRouteId}
            onRemoveRoute={removeRoute}
            onClearRoutes={clearRoutes}
            activeRouteId={activeRouteId}
          />
          <ImportExportMenu waypoints={waypoints} routes={routes} onImport={handleImport} />
        </div>

        <div className="absolute top-4 left-4 z-[400]">
          <MeasureToolbar
            tool={tool}
            onToolChange={setTool}
            onOpenElevation={() => setElevationOpen(true)}
            onClear={clearAll}
            elevationEnabled={distancePath.length >= 2}
            unit={unit}
            onUnitChange={setUnit}
          />
        </div>
      </MapContainer>

      <AnimatePresence>
        {tool === "compass" && (
          <CompassHUD
            open
            onClose={() => setTool(null)}
            userPosition={userPosition}
            target={compassTarget}
            targetLabel={compassLabel}
          />
        )}
      </AnimatePresence>

      <ElevationProfile
        open={elevationOpen}
        onOpenChange={setElevationOpen}
        path={distancePath}
      />

      <WaypointDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={dialogInitial}
        onSave={handleSaveWaypoint}
        onDelete={(id) => { removeWaypoint(id); toast.success("Waypoint removido"); }}
      />
    </div>
  );
};

export default MapaTatico;
