import { jsPDF } from "jspdf";
import type { Route } from "@/data/mapTypes";
import type { LatLng } from "./geo";
import { formatDistance } from "./geo";
import { computeStats, formatDuration, getPace, type ProfilePoint } from "./routeStats";
import { fetchElevationProfile } from "./elevation";
import { getTile, putTile } from "./tileCache";
import { toMGRS, toDD } from "./mgrs";

const TILE_URL = "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

const worldPx = (p: LatLng, z: number) => {
  const s = 256 * 2 ** z;
  const r = (p.lat * Math.PI) / 180;
  return {
    x: ((p.lng + 180) / 360) * s,
    y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s,
  };
};

const loadTile = async (url: string): Promise<ImageBitmap | null> => {
  try {
    let blob = await getTile(url);
    if (!blob) {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return null;
      blob = await res.blob();
      putTile(url, blob).catch(() => {});
    }
    return await createImageBitmap(blob);
  } catch { return null; }
};

/** Desenha a rota sobre tiles em um canvas e retorna um dataURL JPEG. */
export const renderRouteMap = async (points: LatLng[], color: string, w = 900, h = 520): Promise<string | null> => {
  if (!points.length) return null;
  let z = 17;
  for (; z > 1; z--) {
    const px = points.map((p) => worldPx(p, z));
    const dx = Math.max(...px.map((p) => p.x)) - Math.min(...px.map((p) => p.x));
    const dy = Math.max(...px.map((p) => p.y)) - Math.min(...px.map((p) => p.y));
    if (dx < w - 100 && dy < h - 100) break;
  }
  const px = points.map((p) => worldPx(p, z));
  const cx = (Math.max(...px.map((p) => p.x)) + Math.min(...px.map((p) => p.x))) / 2;
  const cy = (Math.max(...px.map((p) => p.y)) + Math.min(...px.map((p) => p.y))) / 2;
  const ox = cx - w / 2, oy = cy - h / 2;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#e5e7eb"; ctx.fillRect(0, 0, w, h);
  const jobs: Promise<void>[] = [];
  const max = 2 ** z;
  for (let tx = Math.floor(ox / 256); tx <= Math.floor((ox + w) / 256); tx++) {
    for (let ty = Math.floor(oy / 256); ty <= Math.floor((oy + h) / 256); ty++) {
      if (ty < 0 || ty >= max) continue;
      const wx = ((tx % max) + max) % max;
      const url = TILE_URL.replace("{z}", String(z)).replace("{x}", String(wx)).replace("{y}", String(ty));
      jobs.push(loadTile(url).then((img) => { if (img) ctx.drawImage(img, tx * 256 - ox, ty * 256 - oy); }));
    }
  }
  await Promise.all(jobs);
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineJoin = "round";
  ctx.beginPath();
  px.forEach((p, i) => (i ? ctx.lineTo(p.x - ox, p.y - oy) : ctx.moveTo(p.x - ox, p.y - oy)));
  ctx.stroke();
  px.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? "#16a34a" : i === px.length - 1 ? "#dc2626" : "#111827";
    ctx.beginPath(); ctx.arc(p.x - ox, p.y - oy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), p.x - ox, p.y - oy);
  });
  ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(w - 190, h - 18, 190, 18);
  ctx.fillStyle = "#111"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
  ctx.fillText("© OpenStreetMap © CARTO", w - 6, h - 9);
  return canvas.toDataURL("image/jpeg", 0.85);
};

export interface ReportData {
  route: Route;
  profile: ProfilePoint[];
  mapImage: string | null;
  stats: ReturnType<typeof computeStats>;
  pace: number;
}

export const buildReportData = async (route: Route): Promise<ReportData> => {
  let profile: ProfilePoint[] = route.profile ?? [];
  if (!profile.length && route.points.length >= 2) {
    try {
      profile = (await fetchElevationProfile(route.points, 80)).map((s) => ({ dist: s.dist, elevation: s.elevation }));
    } catch { profile = []; }
  }
  const pace = getPace();
  return {
    route, profile, pace,
    mapImage: await renderRouteMap(route.points, route.color),
    stats: computeStats(route.points, profile, pace),
  };
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

const profileSvg = (profile: ProfilePoint[], w = 800, h = 180) => {
  if (profile.length < 2) return "<p><em>Perfil de elevação indisponível (sem conexão).</em></p>";
  const maxD = profile[profile.length - 1].dist || 1;
  const eles = profile.map((p) => p.elevation);
  const mn = Math.min(...eles), mx = Math.max(...eles), rng = mx - mn || 1;
  const pts = profile.map((p) => `${(p.dist / maxD) * w},${h - ((p.elevation - mn) / rng) * (h - 20) - 10}`).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="background:#f8fafc;border:1px solid #ddd">
<polygon points="0,${h} ${pts} ${w},${h}" fill="#fed7aa"/><polyline points="${pts}" fill="none" stroke="#ea580c" stroke-width="2"/>
<text x="4" y="14" font-size="11">${Math.round(mx)} m</text><text x="4" y="${h - 4}" font-size="11">${Math.round(mn)} m</text>
<text x="${w - 4}" y="${h - 4}" font-size="11" text-anchor="end">${formatDistance(maxD)}</text></svg>`;
};

export const reportToHtml = ({ route, profile, mapImage, stats, pace }: ReportData) => {
  let acc = 0;
  const rows = route.points.map((p, i) => {
    const seg = i ? stats.segments[i - 1] : 0; acc += seg;
    return `<tr><td>${i + 1}</td><td>${toDD(p.lat, p.lng)}</td><td>${toMGRS(p.lat, p.lng)}</td><td>${i ? formatDistance(seg) : "—"}</td><td>${formatDistance(acc)}</td></tr>`;
  }).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Plano de rota — ${esc(route.name)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#111}h1{margin:0}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}.k div{border:1px solid #ddd;border-radius:8px;padding:8px}
.k b{display:block;font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px}td,th{border:1px solid #ddd;padding:4px 6px;text-align:left}
img{width:100%;border:1px solid #ddd;border-radius:8px}@media print{body{margin:0}}</style></head><body>
<h1>${esc(route.name)}</h1><p>Plano de rota · criado em ${new Date(route.createdAt).toLocaleString("pt-BR")} · gerado em ${new Date().toLocaleString("pt-BR")}</p>
<div class="k"><div>Distância<b>${formatDistance(stats.total)}</b></div><div>Subida<b>+${Math.round(stats.gain)} m</b></div>
<div>Descida<b>-${Math.round(stats.loss)} m</b></div><div>Tempo est. (${pace} km/h)<b>${formatDuration(stats.timeMin)}</b></div></div>
${mapImage ? `<img src="${mapImage}" alt="Mapa da rota">` : ""}
<h2>Perfil de elevação</h2>${profileSvg(profile)}
<h2>Pontos (${route.points.length})</h2><table><thead><tr><th>#</th><th>Coordenada (DD)</th><th>MGRS</th><th>Trecho</th><th>Acumulado</th></tr></thead><tbody>${rows}</tbody></table>
${route.notes ? `<h2>Notas</h2><p>${esc(route.notes)}</p>` : ""}
<p style="font-size:11px;color:#666">Survival Hub · GIS Tático. Tempo pela regra de Naismith ajustada.</p></body></html>`;
};

export const reportToPdf = ({ route, profile, mapImage, stats, pace }: ReportData) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 14;
  let y = 18;
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(route.name, M, y);
  y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90);
  doc.text(`Plano de rota · gerado em ${new Date().toLocaleString("pt-BR")}`, M, y);
  doc.setTextColor(0);
  y += 6;
  const kpis: [string, string][] = [
    ["Distância", formatDistance(stats.total)], ["Subida", `+${Math.round(stats.gain)} m`],
    ["Descida", `-${Math.round(stats.loss)} m`], [`Tempo (${pace} km/h)`, formatDuration(stats.timeMin)],
  ];
  const bw = (W - 2 * M - 9) / 4;
  kpis.forEach(([k, v], i) => {
    const x = M + i * (bw + 3);
    doc.setDrawColor(200); doc.roundedRect(x, y, bw, 14, 2, 2);
    doc.setFontSize(8); doc.setTextColor(90); doc.text(k, x + 2, y + 5);
    doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.text(v, x + 2, y + 11);
    doc.setFont("helvetica", "normal");
  });
  y += 18;
  if (mapImage) {
    const ih = (W - 2 * M) * (520 / 900);
    doc.addImage(mapImage, "JPEG", M, y, W - 2 * M, ih);
    y += ih + 6;
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Perfil de elevação", M, y); y += 3;
  doc.setFont("helvetica", "normal");
  const ch = 32, cw = W - 2 * M;
  doc.setDrawColor(200); doc.rect(M, y, cw, ch);
  if (profile.length >= 2) {
    const maxD = profile[profile.length - 1].dist || 1;
    const eles = profile.map((p) => p.elevation);
    const mn = Math.min(...eles), mx = Math.max(...eles), rng = mx - mn || 1;
    doc.setDrawColor(234, 88, 12); doc.setLineWidth(0.5);
    for (let i = 1; i < profile.length; i++) {
      const a = profile[i - 1], b = profile[i];
      doc.line(M + (a.dist / maxD) * cw, y + ch - 2 - ((a.elevation - mn) / rng) * (ch - 6),
        M + (b.dist / maxD) * cw, y + ch - 2 - ((b.elevation - mn) / rng) * (ch - 6));
    }
    doc.setLineWidth(0.2); doc.setFontSize(7);
    doc.text(`${Math.round(mx)} m`, M + 1, y + 4); doc.text(`${Math.round(mn)} m`, M + 1, y + ch - 1);
  } else {
    doc.setFontSize(8); doc.text("Perfil indisponível (sem conexão)", M + 2, y + ch / 2);
  }
  y += ch + 8;
  const header = () => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    ["#", "Coordenada (DD)", "MGRS", "Trecho", "Acumulado"].forEach((t, i) => doc.text(t, M + [0, 8, 70, 130, 158][i], y));
    doc.setFont("helvetica", "normal"); y += 5;
  };
  header();
  let acc = 0;
  route.points.forEach((p, i) => {
    if (y > 285) { doc.addPage(); y = 18; header(); }
    const seg = i ? stats.segments[i - 1] : 0; acc += seg;
    [String(i + 1), toDD(p.lat, p.lng), toMGRS(p.lat, p.lng), i ? formatDistance(seg) : "-", formatDistance(acc)]
      .forEach((t, j) => doc.text(t, M + [0, 8, 70, 130, 158][j], y));
    y += 5;
  });
  return doc;
};

const slug = (s: string) => s.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "rota";

export const downloadRouteReport = async (route: Route, format: "pdf" | "html") => {
  const data = await buildReportData(route);
  const name = `plano-${slug(route.name)}`;
  if (format === "pdf") {
    reportToPdf(data).save(`${name}.pdf`);
  } else {
    const blob = new Blob([reportToHtml(data)], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${name}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  return data;
};
