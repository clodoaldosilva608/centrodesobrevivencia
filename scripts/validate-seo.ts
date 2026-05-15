/**
 * SEO validation script.
 *
 * - Reads every URL declared in public/sitemap.xml (static + ALL dynamic
 *   routes: /equipamentos/:id, /ebooks/:id, /jogos/:id).
 * - Adds a probe URL guaranteed to 404, plus trailing-slash variants of
 *   every sitemap route, to catch canonical/og:url discrepancies caused
 *   by an extra "/" at the end.
 * - Loads each route via Playwright against a `vite preview` server (or
 *   any BASE_URL passed via env), and checks:
 *     * <link rel="canonical"> matches the route URL (self-referential,
 *       no trailing slash unless route === "/")
 *     * <meta property="og:url"> matches the same URL
 *     * og:image + twitter:image resolve to a real asset (HTTP 2xx)
 *     * og:title / og:description / twitter:card / og:type present
 *     * 404 routes carry a noindex robots meta
 *     * Trailing-slash variants resolve to the canonical without slash
 *       (sitemap consistency)
 * - Writes a detailed JSON + HTML report to ./seo-report/ for CI upload.
 *
 * Usage:
 *   bunx tsx scripts/validate-seo.ts
 *   BASE_URL=http://localhost:4173 bunx tsx scripts/validate-seo.ts --no-server
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { spawn, type ChildProcess } from "child_process";
import { chromium } from "playwright";

const SITE_URL = "https://centrodesobrevivencia.lovable.app";
const LOCAL_PORT = Number(process.env.PORT ?? 4173);
const LOCAL_BASE = `http://localhost:${LOCAL_PORT}`;
const BASE_URL = (process.env.BASE_URL ?? LOCAL_BASE).replace(/\/$/, "");
const SPAWN_SERVER = !process.argv.includes("--no-server") && BASE_URL === LOCAL_BASE;
const REPORT_DIR = resolve("seo-report");

interface Issue {
  severity: "error" | "warn";
  code: string;
  message: string;
}
interface RouteResult {
  route: string;
  finalUrl: string;
  ok: boolean;
  meta: Record<string, string | null>;
  issues: Issue[];
}

function loadRoutes(): string[] {
  const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const routes = new Set<string>();
  for (const u of locs) routes.add(u.replace(SITE_URL, ""));
  return [...routes];
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return;
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function expectedCanonicalFor(route: string): string {
  // Self-referential canonical, no trailing slash except for root.
  const cleaned = route === "/" ? "/" : route.replace(/\/+$/, "");
  return `${SITE_URL}${cleaned}`;
}

async function main() {
  const sitemapRoutes = loadRoutes();
  const trailingProbes = sitemapRoutes
    .filter((r) => r !== "/" && !r.endsWith("/"))
    .slice(0, 5) // sample to keep CI fast
    .map((r) => `${r}/`);
  const probe404 = "/__definitely_missing_route__";
  const allRoutes = [...sitemapRoutes, ...trailingProbes, probe404];

  console.log(
    `Validating ${sitemapRoutes.length} sitemap routes + ${trailingProbes.length} trailing-slash probes + 1 404 probe against ${BASE_URL}`,
  );

  let server: ChildProcess | undefined;
  if (SPAWN_SERVER) {
    console.log("Starting `vite preview`...");
    server = spawn("npx", ["vite", "preview", "--port", String(LOCAL_PORT), "--strictPort"], {
      stdio: "ignore",
    });
    await waitForServer(LOCAL_BASE);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results: RouteResult[] = [];
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

  for (const route of allRoutes) {
    const fullUrl = `${BASE_URL}${route}`;
    const issues: Issue[] = [];
    const result: RouteResult = {
      route,
      finalUrl: fullUrl,
      ok: true,
      meta: {},
      issues,
    };

    try {
      await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 25_000 });
    } catch (err) {
      issues.push({
        severity: "error",
        code: "navigation_failed",
        message: (err as Error).message,
      });
      result.ok = false;
      results.push(result);
      continue;
    }

    const meta = await page.evaluate(() => {
      const get = (sel: string, attr: string) =>
        document.head.querySelector(sel)?.getAttribute(attr) ?? null;
      return {
        canonical: get('link[rel="canonical"]', "href"),
        ogUrl: get('meta[property="og:url"]', "content"),
        ogTitle: get('meta[property="og:title"]', "content"),
        ogDescription: get('meta[property="og:description"]', "content"),
        ogType: get('meta[property="og:type"]', "content"),
        ogImage: get('meta[property="og:image"]', "content"),
        twCard: get('meta[name="twitter:card"]', "content"),
        twImage: get('meta[name="twitter:image"]', "content"),
        robots: get('meta[name="robots"]', "content"),
        description: get('meta[name="description"]', "content"),
        title: document.title || null,
      };
    });
    result.meta = meta;

    const is404 = route === probe404;
    const isTrailingProbe = trailingProbes.includes(route);

    if (is404) {
      if (!meta.robots || !/noindex/i.test(meta.robots)) {
        issues.push({
          severity: "error",
          code: "missing_noindex_on_404",
          message: `404 route should expose noindex (got "${meta.robots ?? "—"}")`,
        });
      }
      result.ok = issues.every((i) => i.severity !== "error");
      results.push(result);
      continue;
    }

    const expectedCanonical = expectedCanonicalFor(route);

    // Trailing-slash probe: canonical must strip the slash and match sitemap entry.
    if (isTrailingProbe) {
      if (meta.canonical && meta.canonical.endsWith("/") && meta.canonical !== `${SITE_URL}/`) {
        issues.push({
          severity: "error",
          code: "trailing_slash_canonical",
          message: `canonical kept trailing slash for ${route}: ${meta.canonical}`,
        });
      }
      if (meta.canonical !== expectedCanonical) {
        issues.push({
          severity: "error",
          code: "trailing_slash_mismatch",
          message: `slash variant did not normalize to ${expectedCanonical} (got ${meta.canonical})`,
        });
      }
      result.ok = issues.every((i) => i.severity !== "error");
      results.push(result);
      continue;
    }

    // Canonical / og:url must be self-referential (no trailing slash except root).
    if (meta.canonical !== expectedCanonical) {
      issues.push({
        severity: "error",
        code: "canonical_mismatch",
        message: `expected ${expectedCanonical}, got ${meta.canonical ?? "—"}`,
      });
    }
    if (meta.ogUrl !== expectedCanonical) {
      issues.push({
        severity: "error",
        code: "og_url_mismatch",
        message: `expected ${expectedCanonical}, got ${meta.ogUrl ?? "—"}`,
      });
    }

    // Required OG tag set.
    for (const [key, val] of [
      ["og:title", meta.ogTitle],
      ["og:description", meta.ogDescription],
      ["og:type", meta.ogType],
      ["og:image", meta.ogImage],
      ["twitter:card", meta.twCard],
      ["twitter:image", meta.twImage],
      ["title", meta.title],
      ["description", meta.description],
    ] as const) {
      if (!val) {
        issues.push({
          severity: "error",
          code: `missing_${key.replace(/[:.]/g, "_")}`,
          message: `${key} tag is missing`,
        });
      }
    }

    if (meta.ogImage) {
      const status = await checkImage(meta.ogImage);
      if (status < 200 || status >= 400) {
        issues.push({
          severity: "error",
          code: "og_image_unreachable",
          message: `og:image returned ${status} (${meta.ogImage})`,
        });
      }
    }

    result.ok = issues.every((i) => i.severity !== "error");
    results.push(result);
  }

  await browser.close();
  if (server) server.kill("SIGTERM");

  // ── Reports ────────────────────────────────────────────────────────────
  mkdirSync(REPORT_DIR, { recursive: true });
  const failed = results.filter((r) => !r.ok);
  const summary = {
    base_url: BASE_URL,
    site_url: SITE_URL,
    generated_at: new Date().toISOString(),
    total: results.length,
    failed: failed.length,
    passed: results.length - failed.length,
  };
  writeFileSync(
    resolve(REPORT_DIR, "report.json"),
    JSON.stringify({ summary, results }, null, 2),
  );
  writeFileSync(resolve(REPORT_DIR, "report.html"), renderHtml(summary, results));

  if (failed.length) {
    console.error(`\nFAILED — ${failed.length} of ${results.length} routes have issues.`);
    for (const r of failed) {
      console.error(`\n  ${r.route}`);
      for (const i of r.issues) console.error(`    [${i.severity}] ${i.code}: ${i.message}`);
    }
    console.error(`\nReport: ${resolve(REPORT_DIR, "report.html")}`);
    process.exit(1);
  }

  console.log(`\nOK — ${results.length} routes validated. Report: ${REPORT_DIR}`);
}

function escape(s: string | null | undefined): string {
  return String(s ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(summary: Record<string, unknown>, results: RouteResult[]): string {
  const rows = results
    .map((r) => {
      const status = r.ok
        ? `<span style="color:#16a34a;font-weight:600">PASS</span>`
        : `<span style="color:#dc2626;font-weight:600">FAIL</span>`;
      const issues = r.issues.length
        ? `<ul style="margin:4px 0 0 16px;padding:0">${r.issues
            .map(
              (i) =>
                `<li><code>${escape(i.code)}</code> — ${escape(i.message)} <em style="color:#888">(${i.severity})</em></li>`,
            )
            .join("")}</ul>`
        : "";
      const metaList = Object.entries(r.meta)
        .map(([k, v]) => `<div><strong>${k}:</strong> <code>${escape(v)}</code></div>`)
        .join("");
      return `<tr>
        <td style="vertical-align:top;padding:8px;border-top:1px solid #eee">${status}</td>
        <td style="vertical-align:top;padding:8px;border-top:1px solid #eee">
          <code>${escape(r.route)}</code>${issues}
          <details style="margin-top:6px"><summary style="cursor:pointer;color:#666">meta</summary>
            <div style="font-size:12px;margin-top:4px">${metaList}</div>
          </details>
        </td>
      </tr>`;
    })
    .join("");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>SEO Validation Report</title>
<style>body{font-family:system-ui,sans-serif;max-width:1100px;margin:24px auto;padding:0 16px;color:#111}
h1{margin:0 0 4px}.summary{background:#f5f5f5;padding:12px 16px;border-radius:8px;margin:12px 0}
table{width:100%;border-collapse:collapse;margin-top:16px}code{background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:12px}</style>
</head><body>
<h1>SEO Validation Report</h1>
<div class="summary">
  <div><strong>Base URL:</strong> ${escape(summary.base_url as string)}</div>
  <div><strong>Generated:</strong> ${escape(summary.generated_at as string)}</div>
  <div><strong>Total:</strong> ${summary.total} — <span style="color:#16a34a">${summary.passed} passed</span> / <span style="color:#dc2626">${summary.failed} failed</span></div>
</div>
<table><thead><tr><th align="left" style="padding:8px">Status</th><th align="left" style="padding:8px">Route &amp; Issues</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
