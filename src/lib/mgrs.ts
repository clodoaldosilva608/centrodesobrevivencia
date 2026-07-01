import { forward, toPoint } from "mgrs";

export const toMGRS = (lat: number, lng: number, precision = 5): string => {
  try {
    return forward([lng, lat], precision);
  } catch {
    return "—";
  }
};

export const fromMGRS = (value: string): { lat: number; lng: number } | null => {
  try {
    const [lng, lat] = toPoint(value.replace(/\s+/g, "").toUpperCase());
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  } catch {
    return null;
  }
};

const pad = (n: number, w = 2) => n.toString().padStart(w, "0");

export const toDMS = (lat: number, lng: number): string => {
  const fmt = (v: number, pos: string, neg: string) => {
    const dir = v >= 0 ? pos : neg;
    const abs = Math.abs(v);
    const d = Math.floor(abs);
    const mFloat = (abs - d) * 60;
    const m = Math.floor(mFloat);
    const s = ((mFloat - m) * 60).toFixed(2);
    return `${pad(d)}°${pad(m)}'${s.padStart(5, "0")}"${dir}`;
  };
  return `${fmt(lat, "N", "S")} ${fmt(lng, "E", "W")}`;
};

export const toDD = (lat: number, lng: number): string =>
  `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

const parseDMS = (input: string): { lat: number; lng: number } | null => {
  const re = /(\d+(?:\.\d+)?)[°\s]+(\d+(?:\.\d+)?)['\s]+(\d+(?:\.\d+)?)["\s]*([NSEW])/gi;
  const matches = [...input.matchAll(re)];
  if (matches.length !== 2) return null;
  const toDec = (m: RegExpMatchArray) => {
    const dec = +m[1] + +m[2] / 60 + +m[3] / 3600;
    return /[SW]/i.test(m[4]) ? -dec : dec;
  };
  const a = toDec(matches[0]);
  const b = toDec(matches[1]);
  const latFirst = /[NS]/i.test(matches[0][4]);
  return latFirst ? { lat: a, lng: b } : { lat: b, lng: a };
};

/** Aceita DD "lat, lng", DMS ou MGRS. */
export const parseCoordinate = (raw: string): { lat: number; lng: number } | null => {
  const s = raw.trim();
  if (!s) return null;
  const dd = s.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (dd) {
    const lat = +dd[1];
    const lng = +dd[2];
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  const dms = parseDMS(s);
  if (dms) return dms;
  return fromMGRS(s);
};
