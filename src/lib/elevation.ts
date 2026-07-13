import type { LatLng } from "./geo";
import { samplePath, pathLength, haversine } from "./geo";

const CACHE_KEY = "sh_elev_cache";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry { t: number; data: ElevationSample[]; }
interface Cache { [hash: string]: CacheEntry; }

export interface ElevationSample {
  lat: number;
  lng: number;
  elevation: number; // metros
  dist: number;      // distância acumulada em metros
}

const hashPath = (pts: LatLng[]): string =>
  pts.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");

const readCache = (): Cache => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); }
  catch { return {}; }
};

const writeCache = (c: Cache) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* quota */ }
};

export const fetchElevationProfile = async (
  path: LatLng[],
  samples = 80,
): Promise<ElevationSample[]> => {
  if (path.length < 2) return [];
  const sampled = samplePath(path, samples);
  const key = hashPath(sampled);
  const cache = readCache();
  const hit = cache[key];
  if (hit && Date.now() - hit.t < TTL_MS) return hit.data;

  const body = { locations: sampled.map((p) => ({ latitude: p.lat, longitude: p.lng })) };
  const res = await fetch("https://api.open-elevation.com/api/v1/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Elevation API ${res.status}`);
  const json = (await res.json()) as { results: { latitude: number; longitude: number; elevation: number }[] };

  let acc = 0;
  const data: ElevationSample[] = json.results.map((r, i) => {
    if (i > 0) {
      const prev = json.results[i - 1];
      acc += haversine({ lat: prev.latitude, lng: prev.longitude }, { lat: r.latitude, lng: r.longitude });
    }
    return { lat: r.latitude, lng: r.longitude, elevation: r.elevation, dist: acc };
  });

  cache[key] = { t: Date.now(), data };
  // Limita cache
  const entries = Object.entries(cache);
  if (entries.length > 30) {
    entries.sort((a, b) => a[1].t - b[1].t);
    entries.slice(0, entries.length - 30).forEach(([k]) => delete cache[k]);
  }
  writeCache(cache);
  return data;
};

export const elevationStats = (samples: ElevationSample[]) => {
  if (!samples.length) return { min: 0, max: 0, gain: 0, loss: 0 };
  let min = samples[0].elevation, max = samples[0].elevation, gain = 0, loss = 0;
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i].elevation - samples[i - 1].elevation;
    if (d > 0) gain += d; else loss += -d;
    if (samples[i].elevation < min) min = samples[i].elevation;
    if (samples[i].elevation > max) max = samples[i].elevation;
  }
  return { min, max, gain, loss };
};

export const totalPathLength = pathLength;
