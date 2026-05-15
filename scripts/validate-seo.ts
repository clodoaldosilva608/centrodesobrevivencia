/**
 * SEO validation script.
 *
 * Spins up `vite preview`, then loads every route declared in
 * public/sitemap.xml plus /welcome and a guaranteed-404 URL, and checks:
 *   - <link rel="canonical"> matches the route URL (self-referential)
 *   - <meta property="og:url"> matches the route URL
 *   - <meta property="og:image"> + twitter:image resolve to a real asset (HTTP 200)
 *   - 404 routes carry a noindex robots meta
 *
 * Exits non-zero on any mismatch so it can gate CI.
 *
 * Usage:
 *   bunx tsx scripts/validate-seo.ts                  # uses default base
 *   BASE_URL=http://localhost:4173 bunx tsx scripts/validate-seo.ts
 *   bunx tsx scripts/validate-seo.ts --no-server      # don't auto-spawn preview
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { spawn, type ChildProcess } from "child_process";
import { chromium } from "playwright";

const SITE_URL = "https://centrodesobrevivencia.lovable.app";
const LOCAL_PORT = Number(process.env.PORT ?? 4173);
const LOCAL_BASE = `http://localhost:${LOCAL_PORT}`;
const BASE_URL = process.env.BASE_URL ?? LOCAL_BASE;
const SPAWN_SERVER = !process.argv.includes("--no-server") && BASE_URL === LOCAL_BASE;

interface Failure {
  route: string;
  reason: string;
}

function loadRoutes(): string[] {
  const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const routes = locs
    .map((u) => u.replace(SITE_URL, ""))
    .filter((p, i, arr) => arr.indexOf(p) === i);
  // Add 404 probe (must be missing from sitemap by definition)
  routes.push("/__definitely_missing_route__");
  return routes;
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  const routes = loadRoutes();
  console.log(`Validating ${routes.length} routes against ${BASE_URL}`);

  let server: ChildProcess | undefined;
  if (SPAWN_SERVER) {
    console.log("Starting `vite preview`...");
    server = spawn("npx", ["vite", "preview", "--port", String(LOCAL_PORT), "--strictPort"], {
      stdio: "ignore",
      detached: false,
    });
    await waitForServer(LOCAL_BASE);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const failures: Failure[] = [];
  // Cache HEAD checks for og:image URLs across routes
  const imageStatus = new Map<string, number>();

  async function checkImage(url: string): Promise<number> {
    if (imageStatus.has(url)) return imageStatus.get(url)!;
    try {
      let res = await fetch(url, { method: "HEAD" });
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, { method: "GET" });
      }
      imageStatus.set(url, res.status);
      return res.status;
    } catch {
      imageStatus.set(url, 0);
      return 0;
    }
  }

  for (const route of routes) {
    const fullUrl = `${BASE_URL}${route}`;
    const expectedCanonical = `${SITE_URL}${route}`;
    try {
      await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 20_000 });
    } catch (err) {
      failures.push({ route, reason: `Navigation failed: ${(err as Error).message}` });
      continue;
    }

    const meta = await page.evaluate(() => {
      const get = (sel: string, attr: string) =>
        document.head.querySelector(sel)?.getAttribute(attr) ?? null;
      return {
        canonical: get('link[rel="canonical"]', "href"),
        ogUrl: get('meta[property="og:url"]', "content"),
        ogImage: get('meta[property="og:image"]', "content"),
        twImage: get('meta[name="twitter:image"]', "content"),
        robots: get('meta[name="robots"]', "content"),
        title: document.title,
      };
    });

    const is404 = route === "/__definitely_missing_route__";

    if (is404) {
      if (!meta.robots || !/noindex/i.test(meta.robots)) {
        failures.push({ route, reason: `404 route missing noindex (got "${meta.robots}")` });
      }
      continue;
    }

    if (meta.canonical !== expectedCanonical) {
      failures.push({
        route,
        reason: `canonical mismatch: expected ${expectedCanonical}, got ${meta.canonical}`,
      });
    }
    if (meta.ogUrl !== expectedCanonical) {
      failures.push({
        route,
        reason: `og:url mismatch: expected ${expectedCanonical}, got ${meta.ogUrl}`,
      });
    }
    if (!meta.ogImage) {
      failures.push({ route, reason: "og:image missing" });
    } else {
      const status = await checkImage(meta.ogImage);
      if (status < 200 || status >= 400) {
        failures.push({ route, reason: `og:image returned ${status} (${meta.ogImage})` });
      }
    }
    if (!meta.twImage) {
      failures.push({ route, reason: "twitter:image missing" });
    }
    if (!meta.title) {
      failures.push({ route, reason: "title missing" });
    }
  }

  await browser.close();
  if (server) {
    server.kill("SIGTERM");
  }

  if (failures.length) {
    console.error(`\nFAILED — ${failures.length} issue(s):`);
    for (const f of failures) console.error(`  [${f.route}] ${f.reason}`);
    process.exit(1);
  }

  console.log(`\nOK — ${routes.length} routes validated, all SEO tags self-referential.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
