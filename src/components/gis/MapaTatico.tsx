import { useEffect, useState } from "react";
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
import { getTile, putTile } from "@/lib/tileCache";
import type { LatLng } from "@/lib/geo";
import { Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

/** Custom Leaflet layer that reads from IndexedDB before hitting the network. */
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

  useEffect(() => { localStorage.setItem("sh_gis_unit", unit); }, [unit]);

  const clearAll = () => {
    setDistancePath([]);
    setAreaPath([]);
    setTool(null);
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

        <DistanceTool
          active={tool === "distance"}
          unit={unit}
          points={distancePath}
          onPathChange={setDistancePath}
          onFinish={() => setTool(null)}
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
            target={distancePath.length > 0 ? distancePath[distancePath.length - 1] : null}
            targetLabel={distancePath.length > 0 ? "Último ponto medido" : undefined}
          />
        )}
      </AnimatePresence>

      <ElevationProfile
        open={elevationOpen}
        onOpenChange={setElevationOpen}
        path={distancePath}
      />
    </div>
  );
};

export default MapaTatico;
