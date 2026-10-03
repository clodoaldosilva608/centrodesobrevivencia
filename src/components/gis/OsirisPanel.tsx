import { useEffect, useState } from "react";
import { Globe, RefreshCw, X, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import osiris from "@/lib/osiris";
import type { OsirisLayerId, OsirisLayerState } from "./OsirisOverlayLayer";

const LAYER_META: Record<
  OsirisLayerId,
  { label: string; emoji: string; description: string; source: string }
> = {
  earthquakes: {
    label: "Terremotos",
    emoji: "🌋",
    description: "Sismos M2.5+ em tempo real",
    source: "USGS Earthquake API",
  },
  fires: {
    label: "Incêndios",
    emoji: "🔥",
    description: "Focos ativos de queimada",
    source: "NASA FIRMS",
  },
  conflicts: {
    label: "Conflitos",
    emoji: "⚠️",
    description: "13 zonas de tensão global",
    source: "LiveUAMap + ACLED",
  },
  weather: {
    label: "Clima severo",
    emoji: "🌪️",
    description: "Tempestades e eventos extremos",
    source: "NASA EONET",
  },
  maritime: {
    label: "Marítimo",
    emoji: "⚓",
    description: "Portos e chokepoints globais",
    source: "Static Naval Intel",
  },
  news: {
    label: "Notícias 24/7",
    emoji: "📺",
    description: "23 emissoras ao vivo",
    source: "Public broadcasters",
  },
  satellites: {
    label: "Satélites",
    emoji: "🛰️",
    description: "Objetos em órbita terrestre",
    source: "N2YO + Celestrak",
  },
};

interface Props {
  enabled: OsirisLayerState;
  onToggle: (id: OsirisLayerId, on: boolean) => void;
  counts: Partial<Record<OsirisLayerId, number>>;
  errors: Partial<Record<OsirisLayerId, string>>;
  loading: Partial<Record<OsirisLayerId, boolean>>;
}

const OsirisPanel = ({ enabled, onToggle, counts, errors, loading }: Props) => {
  const [open, setOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    let cancelled = false;
    osiris
      .health()
      .then(() => {
        if (!cancelled) setHealthStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setHealthStatus("down");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pré-aquece as camadas mais prováveis (terremotos + conflitos) assim que o painel abre.
  // O cache em memória evita re-fetch quando o usuário ativa de fato a camada.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.allSettled([osiris.earthquakes(), osiris.conflicts(), osiris.fires()]).then(() => {
      if (!cancelled) {
        // silencioso — só para pré-aquecer o cache
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const refresh = () => {
    osiris.clearCache();
    window.location.reload();
  };

  const openGlobe = () => {
    const layers = (Object.keys(enabled) as OsirisLayerId[]).filter((k) => enabled[k]);
    const url = `${osiris.baseUrl}/?layers=${layers.join(",")}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Abrindo globo OSIRIS em nova aba");
  };

  const activeCount = (Object.keys(enabled) as OsirisLayerId[]).filter(
    (k) => enabled[k],
  ).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant={activeCount > 0 ? "default" : "secondary"}
          aria-label="Intel OSIRIS"
          className="h-10 w-10 sm:h-12 sm:w-12 shadow-lg relative"
        >
          <Globe size={18} />
          {activeCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
              aria-label={`${activeCount} camadas ativas`}
            >
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Globe size={18} /> Inteligência OSIRIS
          </SheetTitle>
        </SheetHeader>

        {/* Status bar */}
        <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-xs">
          <span className="flex items-center gap-2">
            {healthStatus === "checking" && <Loader2 size={12} className="animate-spin" />}
            {healthStatus === "ok" && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            {healthStatus === "down" && <AlertTriangle size={12} className="text-destructive" />}
            <span className="text-muted-foreground">
              {healthStatus === "checking" && "Verificando servidor…"}
              {healthStatus === "ok" && "Servidor OSIRIS online"}
              {healthStatus === "down" && "Servidor indisponível"}
            </span>
          </span>
          <a
            href={`${osiris.baseUrl}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Ver docs <ExternalLink size={10} className="inline" />
          </a>
        </div>

        {/* Layer list */}
        <div className="mt-4 space-y-2">
          {(Object.keys(LAYER_META) as OsirisLayerId[]).map((id) => {
            const meta = LAYER_META[id];
            const on = enabled[id];
            const count = counts[id];
            const err = errors[id];
            const isLoading = loading[id];
            return (
              <div
                key={id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  on ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                }`}
              >
                <div className="text-2xl leading-none">{meta.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{meta.label}</p>
                    <Switch
                      checked={on}
                      onCheckedChange={(v) => onToggle(id, v)}
                      aria-label={`Ativar ${meta.label}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {meta.source}
                    </Badge>
                    {isLoading && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Loader2 size={10} className="animate-spin" /> Carregando
                      </Badge>
                    )}
                    {on && typeof count === "number" && !isLoading && (
                      <Badge variant="secondary" className="text-[10px]">
                        {count.toLocaleString("pt-BR")} pontos
                      </Badge>
                    )}
                    {err && (
                      <Badge variant="destructive" className="text-[10px] gap-1" title={err}>
                        <AlertTriangle size={10} /> Erro
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw size={14} /> Atualizar
          </Button>
          <Button onClick={openGlobe} size="sm">
            <Globe size={14} /> Globo 3D
          </Button>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground text-center">
          Dados em tempo real do <a href={osiris.baseUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OSIRIS self-hosted</a>. Cache local de 5-15min para respeitar rate limits das fontes públicas (USGS, NASA, NOAA).
        </p>
      </SheetContent>
    </Sheet>
  );
};

export default OsirisPanel;
