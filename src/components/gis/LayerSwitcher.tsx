import { useEffect, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export interface BaseLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  custom?: boolean;
}

const BUILT_INS: BaseLayer[] = [
  {
    id: "tactical",
    name: "Tático (escuro)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap © CARTO",
    maxZoom: 19,
  },
  {
    id: "sat",
    name: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
    maxZoom: 19,
  },
  {
    id: "topo",
    name: "Topográfico",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap (CC-BY-SA)",
    maxZoom: 17,
  },
  {
    id: "osm",
    name: "Ruas (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
    maxZoom: 19,
  },
];

const CUSTOM_KEY = "sh_gis_custom_layers";

const loadCustom = (): BaseLayer[] => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]");
  } catch {
    return [];
  }
};

interface Props {
  activeId: string;
  onChange: (layer: BaseLayer) => void;
}

const LayerSwitcher = ({ activeId, onChange }: Props) => {
  const [custom, setCustom] = useState<BaseLayer[]>(() => loadCustom());
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
  }, [custom]);

  const layers = [...BUILT_INS, ...custom];

  const addCustom = () => {
    if (!name.trim() || !url.includes("{z}") || !url.includes("{x}") || !url.includes("{y}")) {
      toast.error("URL deve conter {z}/{x}/{y}");
      return;
    }
    const layer: BaseLayer = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      attribution: "Camada personalizada",
      custom: true,
      maxZoom: 22,
    };
    setCustom((prev) => [...prev, layer]);
    setName("");
    setUrl("");
    toast.success("Camada adicionada");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="secondary" aria-label="Camadas do mapa" className="h-12 w-12 shadow-lg">
          <Layers size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Camadas do mapa</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {layers.map((l) => (
            <div
              key={l.id}
              className={`flex items-center justify-between p-3 rounded-lg border min-h-[52px] cursor-pointer transition-colors ${
                l.id === activeId ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              }`}
              onClick={() => onChange(l)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground truncate">{l.attribution}</p>
              </div>
              {l.custom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustom((prev) => prev.filter((c) => c.id !== l.id));
                  }}
                  aria-label={`Remover ${l.name}`}
                  className="p-2 text-destructive min-h-[44px] min-w-[44px]"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border space-y-3">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground">
            ADICIONAR CAMADA XYZ / WMTS
          </h3>
          <div className="space-y-2">
            <Label htmlFor="layer-name">Nome</Label>
            <Input id="layer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Carta topo do exército" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="layer-url">URL do template (com {"{z}/{x}/{y}"})</Label>
            <Input id="layer-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemplo.gov.br/tiles/{z}/{x}/{y}.png" />
          </div>
          <Button onClick={addCustom} className="w-full min-h-[44px]">
            <Plus size={16} /> Adicionar camada
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LayerSwitcher;
export { BUILT_INS };
