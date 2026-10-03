import type { Waypoint, Route, WaypointType } from "@/data/mapTypes";
import { WAYPOINT_TYPES, WAYPOINT_TYPE_LIST } from "@/data/waypointTypes";

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

const typeFromSym = (sym: string | null | undefined): WaypointType => {
  if (!sym) return "generico";
  const lower = sym.toLowerCase();
  const match = WAYPOINT_TYPE_LIST.find(
    (t) => WAYPOINT_TYPES[t].label.toLowerCase() === lower || t === lower,
  );
  return match ?? "generico";
};

export const serializeGPX = (waypoints: Waypoint[], routes: Route[]): string => {
  const wpts = waypoints
    .map(
      (w) => `  <wpt lat="${w.lat}" lon="${w.lng}">
    <name>${escapeXml(w.name)}</name>
    ${w.note ? `<desc>${escapeXml(w.note)}</desc>` : ""}
    <sym>${escapeXml(WAYPOINT_TYPES[w.type].label)}</sym>
    <type>${escapeXml(w.type)}</type>
    <extensions><color>${w.color}</color></extensions>
  </wpt>`,
    )
    .join("\n");

  const trks = routes
    .map(
      (r) => `  <trk>
    <name>${escapeXml(r.name)}</name>
    ${r.notes ? `<desc>${escapeXml(r.notes)}</desc>` : ""}
    <extensions><color>${r.color}</color></extensions>
    <trkseg>
${r.points.map((p) => `      <trkpt lat="${p.lat}" lon="${p.lng}"/>`).join("\n")}
    </trkseg>
  </trk>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Survival Hub GIS" xmlns="http://www.topografix.com/GPX/1/1">
${wpts}
${trks}
</gpx>`;
};

export interface ParsedGPX {
  waypoints: Waypoint[];
  routes: Route[];
}

export const parseGPX = (xml: string): ParsedGPX => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror") || !doc.querySelector("gpx")) {
    throw new Error("Arquivo GPX inválido");
  }
  const waypoints: Waypoint[] = Array.from(doc.getElementsByTagName("wpt")).map((el) => {
    const lat = parseFloat(el.getAttribute("lat") ?? "0");
    const lng = parseFloat(el.getAttribute("lon") ?? "0");
    const name = el.getElementsByTagName("name")[0]?.textContent ?? "Sem nome";
    const note = el.getElementsByTagName("desc")[0]?.textContent ?? "";
    const typeText = el.getElementsByTagName("type")[0]?.textContent;
    const sym = el.getElementsByTagName("sym")[0]?.textContent;
    const type = (typeText && WAYPOINT_TYPE_LIST.includes(typeText as WaypointType))
      ? (typeText as WaypointType)
      : typeFromSym(sym);
    const color = el.querySelector("extensions > color")?.textContent ?? WAYPOINT_TYPES[type].hex;
    return {
      id: crypto.randomUUID(),
      lat, lng, name, note, color, type,
      createdAt: new Date().toISOString(),
    };
  });

  const routes: Route[] = Array.from(doc.getElementsByTagName("trk")).map((el) => {
    const name = el.getElementsByTagName("name")[0]?.textContent ?? "Rota importada";
    const notes = el.getElementsByTagName("desc")[0]?.textContent ?? undefined;
    const color = el.querySelector("extensions > color")?.textContent ?? "#F97316";
    const points = Array.from(el.getElementsByTagName("trkpt")).map((pt) => ({
      lat: parseFloat(pt.getAttribute("lat") ?? "0"),
      lng: parseFloat(pt.getAttribute("lon") ?? "0"),
    }));
    return {
      id: crypto.randomUUID(),
      name, color, notes, points,
      createdAt: new Date().toISOString(),
    };
  });

  // Also parse <rte> as fallback route type
  Array.from(doc.getElementsByTagName("rte")).forEach((el) => {
    const name = el.getElementsByTagName("name")[0]?.textContent ?? "Rota importada";
    const points = Array.from(el.getElementsByTagName("rtept")).map((pt) => ({
      lat: parseFloat(pt.getAttribute("lat") ?? "0"),
      lng: parseFloat(pt.getAttribute("lon") ?? "0"),
    }));
    if (points.length) {
      routes.push({
        id: crypto.randomUUID(),
        name, color: "#F97316", points,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return { waypoints, routes };
};
