import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { HardDriveDownload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cacheRegion, listRegions, removeRegion, type CachedRegion } from "@/lib/tileCache";
import { toast } from "sonner";

interface Props {
  activeLayerUrl: string;
  activeLayerName: string;
}

const OfflineRegionsManager = ({ activeLayerUrl, activeLayerName }: Props) => {
  const map = useMap();
  const [regions, setRegions] = useState<CachedRegion[]>([]);
  const [name, setName] = useState("");
  const [minZ, setMinZ] = useState(10);
  const [maxZ, setMaxZ] = useState(14);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const refresh = () => listRegions().then(setRegions);
  useEffect(() => { refresh(); }, []);

  const handleCache = async () => {
    const b = map.getBounds();
    const bbox: [number, number, number, number] = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()];
    if (maxZ - minZ > 4) {
      toast.error("Máximo 4 níveis de zoom por download");
      return;
    }
    setProgress({ done: 0, total: 1 });
    try {
      await cacheRegion(
        {
          id: `r-${Date.now()}`,
          name: name.trim() || `Região ${new Date().toLocaleString("pt-BR")}`,
          bbox, minZoom: minZ, maxZoom: maxZ,
          layerUrl: activeLayerUrl,
        },
        (done, total) => setProgress({ done, total }),
      );
      toast.success("Região salva offline");
      setName("");
      refresh();
    } catch (e) {
      toast.error("Falha ao baixar região");
    } finally {
      setProgress(null);
    }
  };

  const handleRemove = async (id: string) => {
    await removeRegion(id);
    refresh();
    toast.success("Região removida");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="secondary" aria-label="Regiões offline" className="h-12 w-12 shadow-lg">
          <HardDriveDownload size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Mapas offline</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Camada ativa: <strong className="text-foreground">{activeLayerName}</strong>. Enquadre a área desejada no mapa antes de baixar.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reg-name">Nome da região</Label>
            <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Serra do Cipó" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min-z">Zoom mínimo</Label>
              <Input id="min-z" type="number" min={0} max={19} value={minZ} onChange={(e) => setMinZ(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-z">Zoom máximo</Label>
              <Input id="max-z" type="number" min={0} max={19} value={maxZ} onChange={(e) => setMaxZ(+e.target.value)} />
            </div>
          </div>
          {progress && (
            <div className="space-y-1">
              <Progress value={(progress.done / Math.max(progress.total, 1)) * 100} />
              <p className="text-xs text-muted-foreground text-center">
                {progress.done} / {progress.total} tiles
              </p>
            </div>
          )}
          <Button onClick={handleCache} disabled={!!progress} className="w-full min-h-[44px]">
            {progress ? <Loader2 className="animate-spin" size={16} /> : <HardDriveDownload size={16} />}
            {progress ? "Baixando…" : "Baixar região atual"}
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-2">
            REGIÕES SALVAS ({regions.length})
          </h3>
          {regions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma região offline ainda.</p>
          ) : (
            <ul className="space-y-2">
              {regions.map((r) => (
                <li key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.tileCount} tiles · z{r.minZoom}–{r.maxZoom} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(r.id)}
                    aria-label={`Remover ${r.name}`}
                    className="p-2 text-destructive min-h-[44px] min-w-[44px]"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OfflineRegionsManager;
