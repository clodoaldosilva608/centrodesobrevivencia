import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  osiris,
  earthquakeColor,
  fireColor,
  conflictColor,
  conflictSeverityPt,
  type Earthquake,
  type FireEvent,
  type ConflictZone,
  type WeatherEvent,
  type MaritimePort,
  type MaritimeChokepoint,
  type LiveNewsChannel,
  type SatelliteEntry,
} from "@/lib/osiris";

export type OsirisLayerId =
  | "earthquakes"
  | "fires"
  | "conflicts"
  | "weather"
  | "maritime"
  | "news"
  | "satellites";

export interface OsirisLayerState {
  earthquakes: boolean;
  fires: boolean;
  conflicts: boolean;
  weather: boolean;
  maritime: boolean;
  news: boolean;
  satellites: boolean;
}

const DEFAULT_STATE: OsirisLayerState = {
  earthquakes: false,
  fires: false,
  conflicts: false,
  weather: false,
  maritime: false,
  news: false,
  satellites: false,
};

interface Props {
  /** Quais camadas estão ativas. */
  enabled: OsirisLayerState;
  /** Called quando novos dados chegam (para contadores no painel). */
  onCounts?: (counts: Partial<Record<OsirisLayerId, number>>) => void;
  /** Called quando uma camada falha ao carregar. */
  onError?: (layer: OsirisLayerId, message: string) => void;
}

const fmtTime = (epochMs: number): string =>
  new Date(epochMs).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const earthquakeIcon = (e: Earthquake) => {
  const color = earthquakeColor(e.magnitude);
  const size = 14 + Math.min(28, e.magnitude * 5);
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 4px ${color}40,0 2px 8px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${Math.max(8, size * 0.35)}px">M${e.magnitude.toFixed(1)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const fireIcon = (f: FireEvent) => {
  const color = fireColor(f.brightness);
  const size = 14 + Math.min(20, f.frp * 4);
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 3px ${color}50,0 0 12px ${color};display:flex;align-items:center;justify-content:center;font-size:10px">🔥</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const conflictIcon = (z: ConflictZone) => {
  const color = conflictColor(z.severity);
  const pulse = z.severity === "war";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:30px;height:30px"><${pulse ? 'div style="position:absolute;inset:0;border-radius:50%;background:' + color + ';opacity:.4;animation:pulse-glow 3s ease-in-out infinite"' : 'div'}></div><div style="position:absolute;inset:4px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;color:white;font-size:14px">⚠️</div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const weatherIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:14px">🌪️</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

const portIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#0ea5e9;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:12px">⚓</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

const chokepointIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#7c3aed;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:14px">⛔</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const newsIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:12px">📺</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

const satelliteIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#facc15;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:12px">🛰️</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });

const safeLat = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= -90 && v <= 90 ? v : null;
const safeLng = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= -180 && v <= 180 ? v : null;

/**
 * Camada única de overlay OSIRIS. Renderiza em um LayerGroup isolado.
 * O componente pai (OsirisOverlayLayer) orquestra múltiplas instâncias.
 */
function SingleLayer({ id, enabled, onCounts, onError }: { id: OsirisLayerId } & Props) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
    return () => {
      layerRef.current?.clearLayers();
      layerRef.current?.removeFrom(map);
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    // BUG anterior: `!enabled` checava o objeto inteiro (sempre truthy).
    // Agora checamos APENAS a chave desta camada específica.
    if (!enabled[id]) {
      onCounts?.({ [id]: 0 });
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const render = async () => {
      try {
        switch (id) {
          case "earthquakes": {
            const list = await osiris.earthquakes(ctrl.signal);
            if (cancelled) return;
            for (const e of list) {
              const lat = safeLat(e.lat);
              const lng = safeLng(e.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: earthquakeIcon(e) })
                .addTo(layer)
                .bindPopup(
                  `<div style="min-width:240px"><strong>🌋 Terremoto M${e.magnitude.toFixed(1)}</strong><br/>` +
                    `📍 ${e.place ?? "—"}<br/>` +
                    `🕐 ${fmtTime(e.time)}<br/>` +
                    `⬇️ Profundidade: ${e.depth?.toFixed(1) ?? "—"} km<br/>` +
                    `${e.tsunami ? "🌊 <strong style='color:#dc2626'>Risco de tsunami</strong><br/>" : ""}` +
                    `${e.felt ? `👁️ Sentido por ${e.felt} pessoas<br/>` : ""}` +
                    `${e.url ? `<a href="${e.url}" target="_blank" rel="noopener">Ver no USGS →</a>` : ""}</div>`,
                );
            }
            onCounts?.({ earthquakes: list.length });
            break;
          }
          case "fires": {
            const list = await osiris.fires();
            if (cancelled) return;
            for (const f of list) {
              const lat = safeLat(f.lat);
              const lng = safeLng(f.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: fireIcon(f) })
                .addTo(layer)
                .bindPopup(
                  `<div><strong>🔥 Incêndio ativo</strong><br/>` +
                    `🌡️ Brilho: ${f.brightness?.toFixed(0)} K<br/>` +
                    `⚡ FRP: ${f.frp?.toFixed(2)} MW<br/>` +
                    `🎯 Confiança: ${f.confidence}<br/>` +
                    `📅 ${f.date}${f.time ? ` ${f.time.slice(0, 2)}:${f.time.slice(2)}` : ""}</div>`,
                );
            }
            onCounts?.({ fires: list.length });
            break;
          }
          case "conflicts": {
            const zones = await osiris.conflicts();
            if (cancelled) return;
            let total = 0;
            for (const z of zones) {
              const lat = safeLat(z.lat);
              const lng = safeLng(z.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: conflictIcon(z) })
                .addTo(layer)
                .bindPopup(
                  `<div style="min-width:260px"><strong>⚠️ ${z.label}</strong><br/>` +
                    `🔖 Severidade: <strong>${conflictSeverityPt(z.severity)}</strong><br/>` +
                    `${z.description ? `📋 ${z.description}<br/>` : ""}` +
                    `${z.sourceUrl ? `<a href="${z.sourceUrl}" target="_blank" rel="noopener">Ver fonte →</a><br/>` : ""}` +
                    `<hr/><em>Eventos recentes:</em><br/>` +
                    `${(z.events ?? [])
                      .slice(0, 5)
                      .map(
                        (ev) =>
                          `• ${ev.title}${ev.url ? ` <a href="${ev.url}" target="_blank" rel="noopener">↗</a>` : ""}`,
                      )
                      .join("<br/>")}</div>`,
                );
              total += 1 + (z.events?.length ?? 0);
            }
            onCounts?.({ conflicts: total });
            break;
          }
          case "weather": {
            const list = await osiris.weather();
            if (cancelled) return;
            for (const w of list) {
              const lat = safeLat(w.lat);
              const lng = safeLng(w.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: weatherIcon() })
                .addTo(layer)
                .bindPopup(
                  `<div><strong>🌪️ ${w.title}</strong><br/>` +
                    `${w.category ? `Categoria: ${w.category}<br/>` : ""}` +
                    `${w.description ? `📋 ${w.description}<br/>` : ""}` +
                    `${w.date ? `📅 ${w.date}<br/>` : ""}` +
                    `${w.url ? `<a href="${w.url}" target="_blank" rel="noopener">Ver detalhes →</a>` : ""}</div>`,
                );
            }
            onCounts?.({ weather: list.length });
            break;
          }
          case "maritime": {
            const data = await osiris.maritime();
            if (cancelled) return;
            let total = 0;
            for (const p of (data.ports ?? []) as MaritimePort[]) {
              const lat = safeLat(p.lat);
              const lng = safeLng(p.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: portIcon() })
                .addTo(layer)
                .bindPopup(
                  `<div><strong>⚓ ${p.name}</strong><br/>${p.country ? `País: ${p.country}<br/>` : ""}${p.type ? `Tipo: ${p.type}` : ""}</div>`,
                );
              total++;
            }
            for (const c of (data.chokepoints ?? []) as MaritimeChokepoint[]) {
              const lat = safeLat(c.lat);
              const lng = safeLng(c.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: chokepointIcon() })
                .addTo(layer)
                .bindPopup(
                  `<div><strong>⛔ ${c.name}</strong><br/>${c.description ?? ""}</div>`,
                );
              total++;
            }
            onCounts?.({ maritime: total });
            break;
          }
          case "news": {
            const list = await osiris.liveNews();
            if (cancelled) return;
            for (const n of list as LiveNewsChannel[]) {
              const lat = safeLat(n.lat);
              const lng = safeLng(n.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: newsIcon() })
                .addTo(layer)
                .bindPopup(
                  `<div><strong>📺 ${n.name}</strong><br/>${n.country ? `País: ${n.country}<br/>` : ""}${n.streamUrl ? `<a href="${n.streamUrl}" target="_blank" rel="noopener">Assistir ao vivo →</a>` : ""}</div>`,
                );
            }
            onCounts?.({ news: list.length });
            break;
          }
          case "satellites": {
            const list = await osiris.satellites();
            if (cancelled) return;
            for (const s of list as SatelliteEntry[]) {
              const lat = safeLat(s.lat);
              const lng = safeLng(s.lng);
              if (lat === null || lng === null) continue;
              L.marker([lat, lng], { icon: satelliteIcon() })
                .addTo(layer)
                .bindPopup(
                  `<div><strong>🛰️ ${s.name}</strong><br/>${s.country ? `País: ${s.country}<br/>` : ""}${s.alt != null ? `Altitude: ${s.alt.toFixed(0)} km<br/>` : ""}${s.category ? `Categoria: ${s.category}` : ""}</div>`,
                );
            }
            onCounts?.({ satellites: list.length });
            break;
          }
        }
      } catch (err) {
        if (!cancelled) {
          onError?.(id, (err as Error).message);
          onCounts?.({ [id]: 0 });
        }
      }
    };

    render();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enabled]);

  return null;
}

/**
 * Overlay OSIRIS completo — monta uma SingleLayer para cada camada ativa.
 * Renderiza sobre o mapa Leaflet existente do Centro de Sobrevivência.
 */
const OsirisOverlayLayer = ({ enabled, onCounts, onError }: Props) => {
  return (
    <>
      <SingleLayer id="earthquakes" enabled={enabled} onCounts={onCounts} onError={onError} />
      <SingleLayer id="fires" enabled={enabled} onCounts={onCounts} onError={onError} />
      <SingleLayer id="conflicts" enabled={enabled} onCounts={onCounts} onError={onError} />
      <SingleLayer id="weather" enabled={enabled} onCounts={onCounts} onError={onError} />
      <SingleLayer id="maritime" enabled={enabled} onCounts={onCounts} onError={onError} />
      <SingleLayer id="news" enabled={enabled} onCounts={onCounts} onError={onError} />
      <SingleLayer id="satellites" enabled={enabled} onCounts={onCounts} onError={onError} />
    </>
  );
};

export default OsirisOverlayLayer;
export { DEFAULT_STATE };
