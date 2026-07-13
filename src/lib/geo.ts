/** Utilitários geodésicos leves (WGS84 esférico) */

const R = 6371008.8; // raio médio da Terra em metros
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export interface LatLng { lat: number; lng: number; }

/** Distância haversine em metros. */
export const haversine = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
};

/** Rumo inicial (bearing) de A para B em graus 0-360. */
export const bearing = (a: LatLng, b: LatLng): number => {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const λ1 = toRad(a.lng);
  const λ2 = toRad(b.lng);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/** Ponto intermediário na fração f [0,1] entre A e B (great-circle). */
export const interpolate = (a: LatLng, b: LatLng, f: number): LatLng => {
  const d = haversine(a, b) / R;
  if (d === 0) return { ...a };
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const λ1 = toRad(a.lng);
  const λ2 = toRad(b.lng);
  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
  const λ = Math.atan2(y, x);
  return { lat: toDeg(φ), lng: toDeg(λ) };
};

/** Amostra N pontos igualmente espaçados ao longo do path (por distância). */
export const samplePath = (points: LatLng[], count: number): LatLng[] => {
  if (points.length < 2 || count < 2) return points.slice();
  const segs = points.slice(1).map((p, i) => haversine(points[i], p));
  const total = segs.reduce((a, b) => a + b, 0);
  if (total === 0) return points.slice(0, count);
  const step = total / (count - 1);
  const out: LatLng[] = [points[0]];
  let acc = 0;
  let segIdx = 0;
  let segStart = 0;
  for (let i = 1; i < count - 1; i++) {
    const target = i * step;
    while (segIdx < segs.length && segStart + segs[segIdx] < target) {
      segStart += segs[segIdx];
      segIdx++;
    }
    if (segIdx >= segs.length) break;
    const f = (target - segStart) / segs[segIdx];
    out.push(interpolate(points[segIdx], points[segIdx + 1], f));
    acc = target;
  }
  out.push(points[points.length - 1]);
  return out;
};

export const pathLength = (points: LatLng[]): number =>
  points.slice(1).reduce((sum, p, i) => sum + haversine(points[i], p), 0);

export const cardinal = (deg: number): string => {
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
};

export const formatDistance = (m: number, nautical = false): string => {
  if (nautical) {
    const nm = m / 1852;
    return nm < 1 ? `${m.toFixed(0)} m` : `${nm.toFixed(2)} NM`;
  }
  return m < 1000 ? `${m.toFixed(0)} m` : `${(m / 1000).toFixed(2)} km`;
};
