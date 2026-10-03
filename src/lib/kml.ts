import type { Waypoint, Route, WaypointType } from "@/data/mapTypes";
import { WAYPOINT_TYPES, WAYPOINT_TYPE_LIST } from "@/data/waypointTypes";

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

// KML uses AABBGGRR
const hexToKmlColor = (hex: string): string => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "ffff7f00";
  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);
  return `ff${b}${g}${r}`.toLowerCase();
};

const kmlToHex = (kml: string): string => {
  const c = kml.replace("#", "").padStart(8, "f");
  const b = c.substring(2, 4);
  const g = c.substring(4, 6);
  const r = c.substring(6, 8);
  return `#${r}${g}${b}`.toUpperCase();
};

export const serializeKML = (waypoints: Waypoint[], routes: Route[]): string => {
  const styles = WAYPOINT_TYPE_LIST.map(
    (t) => `    <Style id="wp-${t}"><IconStyle><color>${hexToKmlColor(WAYPOINT_TYPES[t].hex)}</color><Icon><href>https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon></IconStyle></Style>`,
  ).join("\n");

  const wpts = waypoints
    .map(
      (w) => `    <Placemark>
      <name>${escapeXml(w.name)}</name>
      ${w.note ? `<description>${escapeXml(w.note)}</description>` : ""}
      <styleUrl>#wp-${w.type}</styleUrl>
      <ExtendedData><Data name="type"><value>${w.type}</value></Data><Data name="color"><value>${w.color}</value></Data></ExtendedData>
      <Point><coordinates>${w.lng},${w.lat},0</coordinates></Point>
    </Placemark>`,
    )
    .join("\n");

  const trks = routes
    .map(
      (r, i) => `    <Style id="rt-${i}"><LineStyle><color>${hexToKmlColor(r.color)}</color><width>3</width></LineStyle></Style>
    <Placemark>
      <name>${escapeXml(r.name)}</name>
      ${r.notes ? `<description>${escapeXml(r.notes)}</description>` : ""}
      <styleUrl>#rt-${i}</styleUrl>
      <LineString><tessellate>1</tessellate><coordinates>${r.points.map((p) => `${p.lng},${p.lat},0`).join(" ")}</coordinates></LineString>
    </Placemark>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Survival Hub GIS</name>
${styles}
${wpts}
${trks}
  </Document>
</kml>`;
};

export interface ParsedKML {
  waypoints: Waypoint[];
  routes: Route[];
}

export const parseKML = (xml: string): ParsedKML => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror") || !doc.querySelector("kml")) {
    throw new Error("Arquivo KML inválido");
  }

  const waypoints: Waypoint[] = [];
  const routes: Route[] = [];

  const placemarks = Array.from(doc.getElementsByTagName("Placemark"));
  for (const pm of placemarks) {
    const name = pm.getElementsByTagName("name")[0]?.textContent ?? "Sem nome";
    const note = pm.getElementsByTagName("description")[0]?.textContent ?? "";
    const extType = Array.from(pm.getElementsByTagName("Data")).find(
      (d) => d.getAttribute("name") === "type",
    )?.getElementsByTagName("value")[0]?.textContent;
    const extColor = Array.from(pm.getElementsByTagName("Data")).find(
      (d) => d.getAttribute("name") === "color",
    )?.getElementsByTagName("value")[0]?.textContent;

    const point = pm.getElementsByTagName("Point")[0];
    const line = pm.getElementsByTagName("LineString")[0];

    if (point) {
      const coords = point.getElementsByTagName("coordinates")[0]?.textContent?.trim();
      if (!coords) continue;
      const [lng, lat] = coords.split(",").map(parseFloat);
      const type = (extType && WAYPOINT_TYPE_LIST.includes(extType as WaypointType))
        ? (extType as WaypointType)
        : "generico";
      waypoints.push({
        id: crypto.randomUUID(),
        lat, lng, name, note,
        color: extColor ?? WAYPOINT_TYPES[type].hex,
        type,
        createdAt: new Date().toISOString(),
      });
    } else if (line) {
      const coords = line.getElementsByTagName("coordinates")[0]?.textContent?.trim() ?? "";
      const points = coords.split(/\s+/).map((triple) => {
        const [lng, lat] = triple.split(",").map(parseFloat);
        return { lat, lng };
      }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      if (!points.length) continue;

      let color = "#F97316";
      const styleUrl = pm.getElementsByTagName("styleUrl")[0]?.textContent?.replace("#", "");
      if (styleUrl) {
        const style = doc.getElementById(styleUrl);
        const kmlColor = style?.getElementsByTagName("color")[0]?.textContent;
        if (kmlColor) color = kmlToHex(kmlColor);
      }

      routes.push({
        id: crypto.randomUUID(),
        name, color, points,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return { waypoints, routes };
};
