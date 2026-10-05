// Runs before `vite dev` and `vite build` (predev/prebuild); writes public/sitemap.xml
import { writeFileSync } from "fs";
import { resolve } from "path";
import { products, ebooks, games } from "../src/data/mockData";

const BASE_URL = process.env.SITE_URL ?? "https://centrodesobrevivencia.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/welcome", changefreq: "monthly", priority: "0.5" },
  { path: "/equipamentos", changefreq: "weekly", priority: "0.9" },
  { path: "/cursos", changefreq: "weekly", priority: "0.9" },
  { path: "/ebooks", changefreq: "weekly", priority: "0.9" },
  { path: "/jogos", changefreq: "weekly", priority: "0.8" },
  { path: "/jogos/simulador-sobrevivencia-floresta", changefreq: "monthly", priority: "0.7" },
  { path: "/simulador", changefreq: "monthly", priority: "0.7" },
  { path: "/mapa-sobrevivencia", changefreq: "weekly", priority: "0.8" },
  { path: "/desafios", changefreq: "weekly", priority: "0.8" },
  { path: "/comunidade", changefreq: "weekly", priority: "0.7" },
  { path: "/estatisticas", changefreq: "monthly", priority: "0.5" },
  { path: "/bussola", changefreq: "monthly", priority: "0.6" },
  { path: "/visao-osiris", changefreq: "weekly", priority: "0.7" },
  { path: "/login", changefreq: "yearly", priority: "0.3" },
];

const productEntries: SitemapEntry[] = products.map((p) => ({
  path: `/equipamentos/${encodeURIComponent(p.id)}`,
  changefreq: "monthly",
  priority: "0.6",
}));

const ebookEntries: SitemapEntry[] = ebooks.map((e) => ({
  path: `/ebooks/${encodeURIComponent(e.id)}`,
  changefreq: "monthly",
  priority: "0.6",
}));

const gameEntries: SitemapEntry[] = games.map((g) => ({
  path: `/jogos/${encodeURIComponent(g.id)}`,
  changefreq: "monthly",
  priority: "0.6",
}));

const entries: SitemapEntry[] = [...staticEntries, ...productEntries, ...ebookEntries, ...gameEntries];

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  ),
  `</urlset>`,
  ``,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${entries.length} entries)`);
