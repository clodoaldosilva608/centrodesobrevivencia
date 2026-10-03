import { haversine, type LatLng } from "./geo";

export interface ProfilePoint { dist: number; elevation: number; }

export interface RouteStats {
  segments: number[];
  total: number;       // metros
  gain: number;        // metros
  loss: number;
  minEle: number | null;
  maxEle: number | null;
  timeMin: number;     // minutos estimados
}

/** Soma subida/descida ignorando oscilações menores que `threshold` (ruído do DEM). */
export const gainLoss = (profile: ProfilePoint[], threshold = 3) => {
  if (profile.length < 2) return { gain: 0, loss: 0 };
  let gain = 0, loss = 0, ref = profile[0].elevation;
  for (const p of profile) {
    const d = p.elevation - ref;
    if (d >= threshold) { gain += d; ref = p.elevation; }
    else if (d <= -threshold) { loss += -d; ref = p.elevation; }
  }
  return { gain, loss };
};

/** Naismith ajustada: tempo = dist/ritmo + 1h a cada 600 m de subida + 1h a cada 1800 m de descida. */
export const estimateMinutes = (distM: number, gain: number, loss: number, paceKmh = 4) =>
  ((distM / 1000) / paceKmh + gain / 600 + loss / 1800) * 60;

export const computeStats = (points: LatLng[], profile?: ProfilePoint[], paceKmh = 4): RouteStats => {
  const segments: number[] = [];
  for (let i = 1; i < points.length; i++) segments.push(haversine(points[i - 1], points[i]));
  const total = segments.reduce((a, b) => a + b, 0);
  const { gain, loss } = gainLoss(profile ?? []);
  const eles = (profile ?? []).map((p) => p.elevation);
  return {
    segments, total, gain, loss,
    minEle: eles.length ? Math.min(...eles) : null,
    maxEle: eles.length ? Math.max(...eles) : null,
    timeMin: estimateMinutes(total, gain, loss, paceKmh),
  };
};

export const formatDuration = (min: number) => {
  if (!isFinite(min) || min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}min` : `${m} min`;
};

export const getPace = () => parseFloat(localStorage.getItem("sh_trail_pace") || "4") || 4;
export const setPace = (v: number) => localStorage.setItem("sh_trail_pace", String(v));
