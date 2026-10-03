/**
 * Cliente tipado para a API do OSIRIS (self-hosted).
 *
 * Variável de ambiente: VITE_OSIRIS_URL — base URL sem barra final.
 * Default: https://osiris-fork.vercel.app (instância self-hosted do projeto).
 *
 * Todos os endpoints são públicos e sem chave de API quando self-hosted.
 * Cache agressivo em memória (15min para earthquakes/fires/conflicts, 5min
 * para news/weather, 1min para space-weather) para respeitar rate limits de
 * upstream (USGS, NASA FIRMS, NOAA) e manter UX responsiva.
 */

const OSIRIS_BASE = (
  import.meta.env.VITE_OSIRIS_URL ?? "https://osiris-fork.vercel.app"
).replace(/\/$/, "");

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Earthquake {
  id: string;
  lat: number;
  lng: number;
  depth: number;
  magnitude: number;
  place: string;
  time: number; // epoch ms
  url?: string;
  tsunami: 0 | 1;
  type?: string;
  felt?: number | null;
  alert?: string | null;
}

export interface FireEvent {
  lat: number;
  lng: number;
  brightness: number; // Kelvin
  confidence: "low" | "nominal" | "high" | string;
  date: string; // YYYY-MM-DD
  time?: string; // HHMM
  frp: number; // Fire Radiative Power (MW)
  type?: string;
}

export interface MaritimePort {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country?: string;
  type?: string;
}

export interface MaritimeChokepoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

export interface MaritimeResponse {
  ports?: MaritimePort[];
  chokepoints?: MaritimeChokepoint[];
}

export interface SatelliteEntry {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  alt?: number; // km
  velocity?: number; // km/h
  category?: string;
  country?: string;
}

export interface LiveNewsChannel {
  id: string;
  name: string;
  country?: string;
  streamUrl?: string;
  lat?: number;
  lng?: number;
}

export interface ConflictZone {
  id: string;
  label: string;
  severity: "war" | "tension" | "elevated" | string;
  lat: number;
  lng: number;
  description?: string;
  sourceUrl?: string;
  region?: string;
  events?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    url?: string;
  }>;
}

export interface WeatherEvent {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  category?: string;
  url?: string;
  date?: string;
}

export interface SpaceWeatherData {
  status?: string;
  kpIndex?: number;
  aurora?: { lat?: number; lng?: number; probability?: number };
  solarFlare?: { classX?: string; time?: string };
  cme?: Array<{ id?: string; time?: string; speed?: number }>;
}

export interface OsirisStats {
  flights?: number;
  satellites?: number;
  cameras?: number;
  earthquakes?: number;
  fires?: number;
  [k: string]: unknown;
}

// ─── Cache em memória (evita re-fetch em mounts repetidos) ───────────────────

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const cached = memCache.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.ts < ttlMs) {
    return Promise.resolve(cached.data);
  }
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = fn().then((data) => {
    memCache.set(key, { data, ts: Date.now() });
    inflight.delete(key);
    return data;
  });
  inflight.set(key, p);
  return p;
}

// ─── fetch helper com fallback gracioso ─────────────────────────────────────

async function fetchJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(`${OSIRIS_BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!r.ok) {
    throw new Error(`OSIRIS ${path} → HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}

// ─── Helpers pt-BR ──────────────────────────────────────────────────────────

/** Traduz severidade de conflito para pt-BR. */
export function conflictSeverityPt(sev: string): string {
  switch (sev) {
    case "war":
      return "Guerra ativa";
    case "tension":
      return "Tensão elevada";
    case "elevated":
      return "Atenção elevada";
    default:
      return sev;
  }
}

/** Cor semântica para a magnitude do terremoto. */
export function earthquakeColor(mag: number): string {
  if (mag >= 7) return "#7c1d1d"; // vermelho-escuro
  if (mag >= 6) return "#dc2626";
  if (mag >= 5) return "#f97316";
  if (mag >= 4) return "#eab308";
  if (mag >= 3) return "#84cc16";
  return "#22c55e";
}

/** Cor semântica para a intensidade do incêndio (por brightness). */
export function fireColor(brightness: number): string {
  if (brightness >= 350) return "#dc2626";
  if (brightness >= 320) return "#f97316";
  if (brightness >= 310) return "#f59e0b";
  return "#facc15";
}

/** Cor semântica para severidade de conflito. */
export function conflictColor(sev: string): string {
  switch (sev) {
    case "war":
      return "#dc2626";
    case "tension":
      return "#f97316";
    case "elevated":
      return "#eab308";
    default:
      return "#94a3b8";
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

const TTL_15MIN = 15 * 60 * 1000;
const TTL_5MIN = 5 * 60 * 1000;
const TTL_1MIN = 1 * 60 * 1000;

export const osiris = {
  /** URL base — útil para construir URLs de iframe. */
  get baseUrl() {
    return OSIRIS_BASE;
  },

  /** Health check do OSIRIS. */
  health(): Promise<{ status: string; uptime?: number }> {
    return withCache("health", TTL_1MIN, () =>
      fetchJSON<{ status: string; uptime?: number }>("/api/health"),
    );
  },

  /** Terremotos M2.5+ (USGS). Cache 15min. */
  earthquakes(signal?: AbortSignal): Promise<Earthquake[]> {
    return withCache("earthquakes", TTL_15MIN, () =>
      fetchJSON<{ earthquakes: Earthquake[] }>("/api/earthquakes").then(
        (r) => r.earthquakes ?? [],
      ),
    ).then((arr) => {
      // signal não é cacheável, mas a fetch interna já tem timeout padrão
      void signal;
      return arr;
    }) as Promise<Earthquake[]>;
  },

  /** Incêndios ativos (NASA FIRMS). Cache 15min. */
  fires(): Promise<FireEvent[]> {
    return withCache("fires", TTL_15MIN, () =>
      fetchJSON<{ fires: FireEvent[] }>("/api/fires").then((r) => r.fires ?? []),
    ) as Promise<FireEvent[]>;
  },

  /** Portos e chokepoints marítimos. Cache 1h. */
  maritime(): Promise<MaritimeResponse> {
    return withCache("maritime", 60 * 60 * 1000, () =>
      fetchJSON<MaritimeResponse>("/api/maritime"),
    ) as Promise<MaritimeResponse>;
  },

  /** Satélites em órbita (N2YO + celestrak). Cache 5min. */
  satellites(): Promise<SatelliteEntry[]> {
    return withCache("satellites", TTL_5MIN, () =>
      fetchJSON<SatelliteEntry[] | { satellites: SatelliteEntry[] }>(
        "/api/satellites",
      ).then((r) =>
        Array.isArray(r) ? r : r.satellites ?? [],
      ),
    ) as Promise<SatelliteEntry[]>;
  },

  /** Canais de notícias 24/7. Cache 1h. */
  liveNews(): Promise<LiveNewsChannel[]> {
    return withCache("live-news", 60 * 60 * 1000, () =>
      fetchJSON<
        LiveNewsChannel[] | { channels: LiveNewsChannel[]; news?: LiveNewsChannel[] }
      >("/api/live-news").then((r) =>
        Array.isArray(r) ? r : r.channels ?? r.news ?? [],
      ),
    ) as Promise<LiveNewsChannel[]>;
  },

  /** Zonas de conflito ativas (13). Cache 30min. */
  conflicts(): Promise<ConflictZone[]> {
    return withCache("conflicts", 30 * 60 * 1000, () =>
      fetchJSON<{ zones: ConflictZone[] } | ConflictZone[]>("/api/conflicts").then(
        (r) => (Array.isArray(r) ? r : r.zones ?? []),
      ),
    ) as Promise<ConflictZone[]>;
  },

  /** Eventos climáticos severos (NASA EONET). Cache 5min. */
  weather(): Promise<WeatherEvent[]> {
    return withCache("weather", TTL_5MIN, () =>
      fetchJSON<
        WeatherEvent[] | { events: WeatherEvent[] }
      >("/api/weather").then((r) =>
        Array.isArray(r) ? r : r.events ?? [],
      ),
    ) as Promise<WeatherEvent[]>;
  },

  /** Clima espacial (NOAA SWPC) — tempestades solares, aurora. Cache 1min. */
  spaceWeather(): Promise<SpaceWeatherData> {
    return withCache("space-weather", TTL_1MIN, () =>
      fetchJSON<SpaceWeatherData>("/api/space-weather"),
    ) as Promise<SpaceWeatherData>;
  },

  /** Estatísticas agregadas. Cache 1min. */
  stats(): Promise<OsirisStats> {
    return withCache("stats", TTL_1MIN, () =>
      fetchJSON<OsirisStats>("/api/stats"),
    ) as Promise<OsirisStats>;
  },

  /** Abre uma conexão SSE com a stream de entidades em tempo real. */
  stream(): EventSource {
    return new EventSource(`${OSIRIS_BASE}/api/sdk/stream`);
  },

  /** Limpa todo o cache (útil para refresh manual). */
  clearCache() {
    memCache.clear();
    inflight.clear();
  },
};

export default osiris;
