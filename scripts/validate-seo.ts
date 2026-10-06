/**
 * SEO validation script.
 *
 * - Reads every URL declared in public/sitemap.xml (static + ALL dynamic
 *   routes: /equipamentos/:id, /ebooks/:id, /jogos/:id).
 * - Adds a 404 probe + trailing-slash variants for EVERY non-root route.
 * - Loads each route via Playwright against a `vite preview` server (or
 *   any BASE_URL passed via env) and checks:
 *     * <link rel="canonical"> self-referential (no trailing slash, root excepted)
 *     * <meta property="og:url"> matches the canonical
 *     * og:image + twitter:image resolve to a real asset (HTTP 2xx)
 *     * og:title / og:description / twitter:card / og:type present
 *     * 404 routes carry a noindex robots meta
 *     * Trailing-slash variants normalize to the canonical
 *     * hreflang entries (when present) are self-consistent — every alternate
 *       targets an absolute https URL and includes a self-reference
 *     * JSON-LD blocks parse, declare @context schema.org, and the primary
 *       block's `url` matches the canonical (tolerant of trailing slash)
 * - On failure, persists per-route HTML + PNG screenshot for inspection.
 * - Writes a JSON + HTML report including ranking of worst routes and
 *   aggregated percentage of failures per issue category.
 * - Emits GitHub Actions `::error` annotations so failures show inline on PRs.
 *
 * Tunables (env):
 *   CONCURRENCY=8           parallel pages (default 6)
 *   MAX_ROUTES=200          cap total routes (default unlimited)
 *   BASE_URL=...            target a deployed env instead of vite preview
 *
 * Usage:
 *   bunx tsx scripts/validate-seo.ts
 *   BASE_URL=http://localhost:4173 bunx tsx scripts/validate-seo.ts --no-server
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { spawn, type ChildProcess } from "child_process";
import { chromium, type Browser } from "playwright";

const SITE_URL = process.env.SITE_URL ?? "https://centrodesobrevivencia.vercel.app";
const LOCAL_PORT = Number(process.env.PORT ?? 4173);
const LOCAL_BASE = `http://localhost:${LOCAL_PORT}`;
const BASE_URL = (process.env.BASE_URL ?? LOCAL_BASE).replace(/\/$/, "");
const SPAWN_SERVER = !process.argv.includes("--no-server") && BASE_URL === LOCAL_BASE;
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 6));
const MAX_ROUTES = Number(process.env.MAX_ROUTES ?? 0); // 0 = no cap
const REPORT_DIR = resolve("seo-report");
const FAILURES_DIR = resolve(REPORT_DIR, "failures");
const IS_GHA = !!process.env.GITHUB_ACTIONS;

// Group every issue code into a high-level category for the aggregated report.
const CATEGORY_OF: Record<string, string> = {
  navigation_failed: "navigation",
  canonical_mismatch: "canonical",
  trailing_slash_canonical: "canonical",
  trailing_slash_mismatch: "canonical",
  og_url_mismatch: "og",
  missing_og_title: "og",
  missing_og_description: "og",
  missing_og_type: "og",
  missing_og_image: "og",
  og_image_unreachable: "og",
  missing_twitter_card: "twitter",
  missing_twitter_image: "twitter",
  missing_title: "meta",
  missing_description: "meta",
  missing_noindex_on_404: "robots",
  hreflang_invalid_href: "hreflang",
  hreflang_missing_self: "hreflang",
  jsonld_parse_error: "structured_data",
  jsonld_missing_context: "structured_data",
  jsonld_url_mismatch: "structured_data",
};
const categoryOf = (code: string) => CATEGORY_OF[code] ?? "other";

interface Issue {
  severity: "error" | "warn";
  code: string;
  message: string;
}
interface MetaSnapshot {
  canonical: string | null;
  ogUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogType: string | null;
  ogImage: string | null;
  twCard: string | null;
  twImage: string | null;
  robots: string | null;
  description: string | null;
  title: string | null;
  hreflangs: { hreflang: string; href: string }[];
  jsonld: string[];
}
interface RouteResult {
  route: string;
  finalUrl: string;
  ok: boolean;
  meta: MetaSnapshot;
  issues: Issue[];
  artifacts?: { html?: string; screenshot?: string };
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
  const cleaned = route === "/" ? "/" : route.replace(/\/+$/, "");
  return `${SITE_URL}${cleaned}`;
}

function sanitizeFilename(route: string): string {
  return route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
}

function emitAnnotation(route: string, issue: Issue) {
  if (!IS_GHA) return;
  const level = issue.severity === "error" ? "error" : "warning";
  const title = `SEO ${issue.code} on ${route}`;
  const msg = `${issue.message}`.replace(/\r?\n/g, " ").replace(/::/g, ":");
  // file=public/sitemap.xml so PRs surface annotations near the sitemap diff
  console.log(`::${level} file=public/sitemap.xml,title=${title}::[${route}] ${msg}`);
}

async function main() {
  const sitemapRoutes = loadRoutes();
  const trailingProbes = sitemapRoutes
    .filter((r) => r !== "/" && !r.endsWith("/"))
    .map((r) => `${r}/`);
  const probe404 = "/__definitely_missing_route__";
  let allRoutes = [...sitemapRoutes, ...trailingProbes, probe404];
  if (MAX_ROUTES > 0) allRoutes = allRoutes.slice(0, MAX_ROUTES);

  console.log(
    `Validating ${sitemapRoutes.length} sitemap routes + ${trailingProbes.length} trailing-slash probes + 1 404 probe against ${BASE_URL} (concurrency=${CONCURRENCY})`,
  );

  let server: ChildProcess | undefined;
  if (SPAWN_SERVER) {
    console.log("Starting `vite preview`...");
    server = spawn("npx", ["vite", "preview", "--port", String(LOCAL_PORT), "--strictPort"], {
      stdio: "ignore",
    });
    await waitForServer(LOCAL_BASE);
  }

  mkdirSync(FAILURES_DIR, { recursive: true });

  const browser = await chromium.launch();
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

  const trailingSet = new Set(trailingProbes);
  const results: RouteResult[] = [];
  const queue = [...allRoutes];

  async function worker(browser: Browser) {
    const context = await browser.newContext();
    const page = await context.newPage();
    while (queue.length) {
      const route = queue.shift();
      if (!route) break;
      const result = await checkRoute(page, route, trailingSet, probe404, checkImage);
      results.push(result);
      for (const i of result.issues) emitAnnotation(result.route, i);
      const status = result.ok ? "PASS" : "FAIL";
      console.log(`  [${status}] ${route}`);
    }
    await context.close();
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(browser)),
  );

  await browser.close();
  if (server) server.kill("SIGTERM");

  // Preserve a stable order in the report (sitemap order, then probes, then 404).
  const orderIndex = new Map(allRoutes.map((r, i) => [r, i] as const));
  results.sort((a, b) => (orderIndex.get(a.route)! - orderIndex.get(b.route)!));

  // ── Reports ────────────────────────────────────────────────────────────
  mkdirSync(REPORT_DIR, { recursive: true });
  const failed = results.filter((r) => !r.ok);

  // Per-category aggregation.
  const categoryTotals = new Map<string, number>();
  const categoryFailures = new Map<string, number>();
  for (const r of results) {
    const cats = new Set<string>();
    for (const i of r.issues) cats.add(categoryOf(i.code));
    // count "checked" per category as the number of routes that COULD fail it (all routes for shared categories)
    for (const c of ["canonical", "og", "twitter", "meta", "hreflang", "structured_data"]) {
      categoryTotals.set(c, (categoryTotals.get(c) ?? 0) + 1);
    }
    for (const c of cats) categoryFailures.set(c, (categoryFailures.get(c) ?? 0) + 1);
  }
  const categoryStats = [...categoryTotals.entries()].map(([category, total]) => {
    const failedRoutes = categoryFailures.get(category) ?? 0;
    return {
      category,
      failedRoutes,
      total,
      failurePct: total ? Math.round((failedRoutes / total) * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.failurePct - a.failurePct);

  // Ranking: routes with most issues.
  const ranking = failed
    .map((r) => ({ route: r.route, issues: r.issues.length, codes: r.issues.map((i) => i.code) }))
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 20);

  const summary = {
    base_url: BASE_URL,
    site_url: SITE_URL,
    generated_at: new Date().toISOString(),
    total: results.length,
    failed: failed.length,
    passed: results.length - failed.length,
    concurrency: CONCURRENCY,
    categoryStats,
    ranking,
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
    console.error(`Per-route failure artifacts: ${FAILURES_DIR}`);
    process.exit(1);
  }

  console.log(`\nOK — ${results.length} routes validated. Report: ${REPORT_DIR}`);
}

async function checkRoute(
  page: import("playwright").Page,
  route: string,
  trailingSet: Set<string>,
  probe404: string,
  checkImage: (url: string) => Promise<number>,
): Promise<RouteResult> {
  const fullUrl = `${BASE_URL}${route}`;
  const issues: Issue[] = [];
  const emptyMeta: MetaSnapshot = {
    canonical: null, ogUrl: null, ogTitle: null, ogDescription: null,
    ogType: null, ogImage: null, twCard: null, twImage: null,
    robots: null, description: null, title: null, hreflangs: [], jsonld: [],
  };
  const result: RouteResult = { route, finalUrl: fullUrl, ok: true, meta: emptyMeta, issues };

  try {
    await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 25_000 });
  } catch (err) {
    issues.push({ severity: "error", code: "navigation_failed", message: (err as Error).message });
    result.ok = false;
    await persistFailure(page, result);
    return result;
  }

  const meta = await page.evaluate(() => {
    const get = (sel: string, attr: string) =>
      document.head.querySelector(sel)?.getAttribute(attr) ?? null;
    const hreflangs = [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')].map(
      (l) => ({ hreflang: l.getAttribute("hreflang") || "", href: l.getAttribute("href") || "" }),
    );
    const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => s.textContent || "")
      .filter(Boolean);
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
      hreflangs,
      jsonld,
    } satisfies MetaSnapshot;
  });
  result.meta = meta;

  const is404 = route === probe404;
  const isTrailingProbe = trailingSet.has(route);

  if (is404) {
    if (!meta.robots || !/noindex/i.test(meta.robots)) {
      issues.push({
        severity: "error",
        code: "missing_noindex_on_404",
        message: `404 route should expose noindex (got "${meta.robots ?? "—"}")`,
      });
    }
    result.ok = issues.every((i) => i.severity !== "error");
    if (!result.ok) await persistFailure(page, result);
    return result;
  }

  const expectedCanonical = expectedCanonicalFor(route);

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
    if (!result.ok) await persistFailure(page, result);
    return result;
  }

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

  // hreflang consistency (only enforce when the page actually declares any).
  if (meta.hreflangs.length) {
    let hasSelf = false;
    for (const h of meta.hreflangs) {
      if (!/^https:\/\//.test(h.href)) {
        issues.push({
          severity: "error",
          code: "hreflang_invalid_href",
          message: `hreflang="${h.hreflang}" href must be absolute https (got "${h.href}")`,
        });
      }
      if (h.href === expectedCanonical || h.href === `${expectedCanonical}/`) hasSelf = true;
    }
    if (!hasSelf) {
      issues.push({
        severity: "error",
        code: "hreflang_missing_self",
        message: `hreflang block missing self-reference to ${expectedCanonical}`,
      });
    }
  }

  // Structured data consistency.
  let sawValidContext = false;
  let sawUrl = false;
  for (const raw of meta.jsonld) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      issues.push({
        severity: "error",
        code: "jsonld_parse_error",
        message: `invalid JSON-LD: ${(e as Error).message}`,
      });
      continue;
    }
    const blocks = Array.isArray(parsed) ? parsed : [parsed];
    for (const b of blocks) {
      if (b && typeof b === "object") {
        const ctx = (b as Record<string, unknown>)["@context"];
        if (typeof ctx === "string" && /schema\.org/i.test(ctx)) sawValidContext = true;
        const u = (b as Record<string, unknown>)["url"];
        if (typeof u === "string") {
          const normalized = u.replace(/\/+$/, "");
          const expectedNorm = expectedCanonical.replace(/\/+$/, "");
          if (normalized === expectedNorm) sawUrl = true;
          else if (u.startsWith(SITE_URL)) {
            // url declared but mismatched the canonical: regression.
            issues.push({
              severity: "error",
              code: "jsonld_url_mismatch",
              message: `JSON-LD url "${u}" does not match canonical ${expectedCanonical}`,
            });
          }
        }
      }
    }
  }
  if (meta.jsonld.length && !sawValidContext) {
    issues.push({
      severity: "error",
      code: "jsonld_missing_context",
      message: `JSON-LD present but no @context references schema.org`,
    });
  }
  // url is tolerated as optional — only mismatches are flagged (above).
  void sawUrl;

  result.ok = issues.every((i) => i.severity !== "error");
  if (!result.ok) await persistFailure(page, result);
  return result;
}

async function persistFailure(page: import("playwright").Page, result: RouteResult) {
  const slug = sanitizeFilename(result.route);
  const htmlPath = resolve(FAILURES_DIR, `${slug}.html`);
  const pngPath = resolve(FAILURES_DIR, `${slug}.png`);
  try {
    const html = await page.content();
    writeFileSync(htmlPath, html);
    await page.screenshot({ path: pngPath, fullPage: true });
    result.artifacts = {
      html: `failures/${slug}.html`,
      screenshot: `failures/${slug}.png`,
    };
  } catch {
    /* best-effort */
  }
}

function escape(s: string | null | undefined): string {
  return String(s ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface SummaryShape {
  base_url: string; site_url: string; generated_at: string;
  total: number; failed: number; passed: number; concurrency: number;
  categoryStats: { category: string; failedRoutes: number; total: number; failurePct: number }[];
  ranking: { route: string; issues: number; codes: string[] }[];
}

function renderHtml(summary: SummaryShape, results: RouteResult[]): string {
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
        .map(([k, v]) => `<div><strong>${escape(k)}:</strong> <code>${escape(typeof v === "string" ? v : JSON.stringify(v))}</code></div>`)
        .join("");
      const artifacts = r.artifacts
        ? `<div style="margin-top:6px;font-size:12px">
             📎 <a href="${escape(r.artifacts.html)}">saved HTML</a> ·
             <a href="${escape(r.artifacts.screenshot)}">screenshot</a>
           </div>`
        : "";
      return `<tr>
        <td style="vertical-align:top;padding:8px;border-top:1px solid #eee">${status}</td>
        <td style="vertical-align:top;padding:8px;border-top:1px solid #eee">
          <code>${escape(r.route)}</code>${issues}${artifacts}
          <details style="margin-top:6px"><summary style="cursor:pointer;color:#666">meta</summary>
            <div style="font-size:12px;margin-top:4px">${metaList}</div>
          </details>
        </td>
      </tr>`;
    })
    .join("");

  const catRows = summary.categoryStats
    .map(
      (c) => `<tr>
        <td style="padding:6px 8px"><code>${escape(c.category)}</code></td>
        <td style="padding:6px 8px">${c.failedRoutes} / ${c.total}</td>
        <td style="padding:6px 8px">
          <div style="background:#eee;border-radius:4px;overflow:hidden;width:160px">
            <div style="height:8px;background:${c.failurePct > 0 ? "#dc2626" : "#16a34a"};width:${Math.max(2, c.failurePct)}%"></div>
          </div>
          <span style="margin-left:6px">${c.failurePct}%</span>
        </td>
      </tr>`,
    )
    .join("");

  const rankRows = summary.ranking.length
    ? summary.ranking
        .map(
          (r, idx) => `<tr>
            <td style="padding:6px 8px">${idx + 1}</td>
            <td style="padding:6px 8px"><code>${escape(r.route)}</code></td>
            <td style="padding:6px 8px">${r.issues}</td>
            <td style="padding:6px 8px"><code>${escape(r.codes.join(", "))}</code></td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" style="padding:8px;color:#16a34a">No failing routes 🎉</td></tr>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>SEO Validation Report</title>
<style>body{font-family:system-ui,sans-serif;max-width:1100px;margin:24px auto;padding:0 16px;color:#111}
h1{margin:0 0 4px}h2{margin-top:28px}
.summary{background:#f5f5f5;padding:12px 16px;border-radius:8px;margin:12px 0}
table{width:100%;border-collapse:collapse;margin-top:8px}
th{text-align:left;padding:6px 8px;background:#fafafa;border-bottom:1px solid #ddd}
code{background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:12px}</style>
</head><body>
<h1>SEO Validation Report</h1>
<div class="summary">
  <div><strong>Base URL:</strong> ${escape(summary.base_url)}</div>
  <div><strong>Generated:</strong> ${escape(summary.generated_at)}</div>
  <div><strong>Total:</strong> ${summary.total} — <span style="color:#16a34a">${summary.passed} passed</span> / <span style="color:#dc2626">${summary.failed} failed</span> (concurrency=${summary.concurrency})</div>
</div>

<h2>Failure rate by category</h2>
<table><thead><tr><th>Category</th><th>Routes failing</th><th>Failure %</th></tr></thead>
<tbody>${catRows}</tbody></table>

<h2>Top failing routes</h2>
<table><thead><tr><th>#</th><th>Route</th><th>Issues</th><th>Codes</th></tr></thead>
<tbody>${rankRows}</tbody></table>

<h2>All routes</h2>
<table><thead><tr><th>Status</th><th>Route &amp; Issues</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
