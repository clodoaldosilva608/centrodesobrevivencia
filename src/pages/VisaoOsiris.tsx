import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe, ExternalLink, Info, Loader2, Layers as LayersIcon, X } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import osiris from "@/lib/osiris";

/**
 * Página /visao-osiris — embeda o globe 3D WebGL do OSIRIS (MapLibre)
 * em um iframe full-screen dentro do Centro de Sobrevivência.
 *
 * Layout responsivo:
 *  - Desktop (sm+): sidebar fixa à direita com todas as camadas visíveis
 *  - Mobile (<sm): sidebar oculta; botão "Camadas" no header abre drawer
 *    bottom-sheet com a lista de camadas
 *
 * O iframe comunica-se via querystring `?layers=...` para refletir as
 * preferências de camadas do usuário.
 */

const ALL_LAYERS = [
  { id: "maritime", label: "Marítimo", emoji: "⚓" },
  { id: "satellites", label: "Satélites", emoji: "🛰️" },
  { id: "cctv", label: "Câmeras", emoji: "📹" },
  { id: "cctv_previews", label: "Preview câmeras", emoji: "🖼️" },
  { id: "live_news", label: "Notícias ao vivo", emoji: "📺" },
  { id: "earthquakes", label: "Terremotos", emoji: "🌋" },
  { id: "global_incidents", label: "Incidentes globais", emoji: "🌍" },
  { id: "day_night", label: "Ciclo dia/noite", emoji: "🌗" },
  { id: "cables", label: "Cabos submarinos", emoji: "🔌" },
  { id: "sdk_sea", label: "SDK marítimo", emoji: "🚢" },
  { id: "sdk_air", label: "SDK aéreo", emoji: "✈️" },
  { id: "sdk_naval", label: "SDK naval", emoji: "🛳️" },
] as const;

type LayerId = (typeof ALL_LAYERS)[number]["id"];

const VisaoOsiris = () => {
  const [layers, setLayers] = useState<Set<LayerId>>(
    () => new Set<LayerId>([
      "maritime",
      "satellites",
      "cctv_previews",
      "live_news",
      "earthquakes",
      "global_incidents",
      "day_night",
    ]),
  );
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [warmupStatus, setWarmupStatus] = useState<"warming" | "ready" | "error">("warming");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Pré-aquece a instância OSIRIS (cold start do Vercel serverless pode demorar)
  useEffect(() => {
    let cancelled = false;
    osiris
      .health()
      .then(() => {
        if (!cancelled) setWarmupStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setWarmupStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const layersParam = useMemo(
    () => Array.from(layers).join(","),
    [layers],
  );

  const iframeSrc = useMemo(
    () => `${osiris.baseUrl}/?layers=${layersParam}`,
    [layersParam],
  );

  const toggle = (id: LayerId) => {
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const LayerList = ({ onPick }: { onPick?: () => void }) => (
    <>
      <div className="space-y-1.5">
        {ALL_LAYERS.map((layer) => {
          const on = layers.has(layer.id);
          return (
            <div
              key={layer.id}
              className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                on
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
              onClick={() => {
                toggle(layer.id);
              }}
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <span className="text-base">{layer.emoji}</span>
                {layer.label}
              </span>
              <Switch
                checked={on}
                aria-label={layer.label}
                onCheckedChange={() => {
                  toggle(layer.id);
                  if (onPick) onPick();
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setLayers(new Set(ALL_LAYERS.map((l) => l.id)))}
        >
          Ativar todas
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setLayers(new Set())}
        >
          Desativar todas
        </Button>
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground/70 leading-relaxed">
        Os dados são fornecidos em tempo real pelo OSIRIS self-hosted, integrado ao Centro de Sobrevivência. Fontes: USGS, NASA FIRMS, N2YO, OpenSky, NOAA, LiveUAMap, emissoras públicas 24/7 e mais.
      </p>
    </>
  );

  return (
    <>
      <SEO
        title="Visão OSIRIS — Globo 3D de Inteligência Global"
        description="Globo 3D em tempo real com aviões, satélites, câmeras, terremotos, incêndios e notícias ao vivo, integrado ao OSIRIS self-hosted."
        noIndex
      />

      {/* Full-screen container — sem Navbar (visão imersiva do globo) */}
      <div className="fixed inset-0 z-[60] flex flex-col bg-background">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-card/95 backdrop-blur z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to="/gis" aria-label="Voltar para o mapa tático" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <Globe size={18} className="text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-heading tracking-wider text-foreground truncate">
                  VISÃO OSIRIS
                </h1>
                <p className="text-[10px] text-muted-foreground truncate">
                  {layers.size} camadas ativas
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão "Camadas" — só no mobile, abre o drawer */}
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden gap-2 h-9"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir camadas"
            >
              <LayersIcon size={14} />
              <span className="text-xs">{layers.size}</span>
            </Button>

            <a
              href={`${osiris.baseUrl}/?layers=${layersParam}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block"
            >
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <ExternalLink size={14} /> Abrir original
              </Button>
            </a>
          </div>
        </header>

        {/* Body — iframe + sidebar (sidebar só no desktop) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Map iframe */}
          <div className="flex-1 relative bg-background min-w-0">
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
                <div className="text-center px-4">
                  <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Carregando globo OSIRIS…
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {warmupStatus === "warming" && "Aquecendo servidor (cold start pode levar ~30s)"}
                    {warmupStatus === "ready" && "Servidor pronto, renderizando o globo 3D"}
                    {warmupStatus === "error" && "Não foi possível contactar o servidor OSIRIS"}
                  </p>
                </div>
              </div>
            )}
            <iframe
              key={iframeSrc}
              src={iframeSrc}
              title="Globo OSIRIS — Centro de Sobrevivência"
              className="w-full h-full border-0"
              onLoad={() => setIframeLoaded(true)}
              onError={(e) => {
                console.error("OSIRIS iframe erro:", e);
                setIframeLoaded(true);
              }}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-downloads"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Sidebar — desktop only */}
          <aside className="hidden sm:block w-72 shrink-0 border-l border-border bg-card/80 backdrop-blur overflow-y-auto">
            <div className="p-4">
              <h2 className="font-heading text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Info size={12} /> Camadas
              </h2>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Selecione as camadas para exibir no globo 3D. O iframe recarrega automaticamente ao mudar.
              </p>
              <LayerList />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile drawer — bottom sheet com as camadas */}
      {mobileSidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[3000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-full bg-card border-t border-border rounded-t-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="font-heading text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                <LayersIcon size={14} /> Camadas
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Fechar camadas"
              >
                <X size={18} />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Selecione as camadas para exibir no globo 3D. O iframe recarrega automaticamente ao mudar.
              </p>
              <LayerList onPick={() => { /* mantém aberto para múltiplos toggles */ }} />
              <div className="mt-4">
                <Button
                  className="w-full sm:hidden"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisaoOsiris;
