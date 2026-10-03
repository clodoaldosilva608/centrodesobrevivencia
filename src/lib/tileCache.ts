import { get, set, del, keys, clear, createStore } from "idb-keyval";

const store = createStore("sh-tile-cache", "tiles");
const META_KEY = "__regions__";
export const AVG_TILE_BYTES = 18_000;

export interface CachedRegion {
  id: string;
  name: string;
  bbox: [number, number, number, number]; // [south, west, north, east]
  minZoom: number;
  maxZoom: number;
  layerUrl: string;
  tileCount: number;
  failed?: number;
  bytes?: number;
  createdAt: string;
}

export interface DownloadControl { paused: boolean; cancelled: boolean; }

const tileKey = (url: string) => `t:${url}`;

export const getTile = async (url: string): Promise<Blob | undefined> =>
  get(tileKey(url), store);

export const putTile = async (url: string, blob: Blob) => set(tileKey(url), blob, store);

const lon2tile = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2tile = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

export const enumerateTiles = (
  bbox: [number, number, number, number],
  minZoom: number,
  maxZoom: number,
  template: string,
): string[] => {
  const [s, w, n, e] = bbox;
  const urls: string[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const x1 = lon2tile(w, z);
    const x2 = lon2tile(e, z);
    const y1 = lat2tile(n, z);
    const y2 = lat2tile(s, z);
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        urls.push(
          template
            .replace("{z}", String(z))
            .replace("{x}", String(x))
            .replace("{y}", String(y))
            .replace("{s}", "a"),
        );
      }
    }
  }
  return urls;
};

export const listRegions = async (): Promise<CachedRegion[]> =>
  (await get(META_KEY, store)) ?? [];

export const saveRegionMeta = async (region: CachedRegion) => {
  const all = await listRegions();
  await set(META_KEY, [...all.filter((r) => r.id !== region.id), region], store);
};

export const removeRegion = async (id: string) => {
  const all = await listRegions();
  const target = all.find((r) => r.id === id);
  await set(META_KEY, all.filter((r) => r.id !== id), store);
  if (target) {
    const urls = enumerateTiles(target.bbox, target.minZoom, target.maxZoom, target.layerUrl);
    await Promise.all(urls.map((u) => del(tileKey(u), store)));
  }
};

/** Apaga todos os tiles e regiões do IndexedDB. */
export const clearAllTiles = async () => clear(store);

export const cacheRegion = async (
  region: Omit<CachedRegion, "tileCount" | "createdAt">,
  onProgress?: (done: number, total: number, failed: number) => void,
  control?: DownloadControl,
): Promise<CachedRegion> => {
  const urls = enumerateTiles(region.bbox, region.minZoom, region.maxZoom, region.layerUrl);
  let done = 0, failed = 0, bytes = 0;
  const CONCURRENCY = 6;
  const queue = [...urls];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      while (control?.paused && !control.cancelled) await new Promise((r) => setTimeout(r, 300));
      if (control?.cancelled) return;
      const url = queue.shift();
      if (!url) return;
      try {
        const existing = await getTile(url);
        if (existing) bytes += existing.size;
        else {
          const res = await fetch(url, { mode: "cors" });
          if (res.ok) {
            const blob = await res.blob();
            bytes += blob.size;
            await putTile(url, blob);
          } else failed += 1;
        }
      } catch {
        failed += 1;
      }
      done += 1;
      onProgress?.(done, urls.length, failed);
    }
  });
  await Promise.all(workers);
  if (control?.cancelled) throw new Error("cancelled");
  const meta: CachedRegion = { ...region, tileCount: urls.length, failed, bytes, createdAt: new Date().toISOString() };
  await saveRegionMeta(meta);
  return meta;
};

export const cacheStats = async (): Promise<{ tiles: number; regions: number }> => {
  const ks = await keys(store);
  const regions = await listRegions();
  return { tiles: ks.filter((k) => typeof k === "string" && k.startsWith("t:")).length, regions: regions.length };
};

export const storageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
  if (!navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
};

export const formatBytes = (b: number) =>
  b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`;
