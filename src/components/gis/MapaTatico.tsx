import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CoordinateReadout from "./CoordinateReadout";
import GoToCoordinate from "./GoToCoordinate";
import LayerSwitcher, { BUILT_INS, type BaseLayer } from "./LayerSwitcher";
import OfflineRegionsManager from "./OfflineRegionsManager";
import { getTile, putTile } from "@/lib/tileCache";
import { Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

const LocateButton = () => {
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
            map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.2 });
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
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          <LayerSwitcher activeId={layer.id} onChange={setLayer} />
          <OfflineRegionsManager activeLayerUrl={layer.url} activeLayerName={layer.name} />
          <GoToCoordinate />
          <LocateButton />
        </div>
      </MapContainer>
    </div>
  );
};

export default MapaTatico;
