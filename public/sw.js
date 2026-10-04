/**
 * Service Worker — Centro de Sobrevivência (v4)
 *
 * BUG CORRIGIDO (v3→v4): requests de extensões Chrome (chrome-extension://)
 * ou outros schemes não-HTTP estavam quebrando o SW porque a Cache API
 * não suporta schemes diferentes de http/https. Quando uma extensão fazia
 * fetch em background, o SW interceptava e tentava cache.put() — que
 * falhava com TypeError: 'Failed to execute put on Cache: Request
 * scheme chrome-extension is unsupported'. Esse erro vazava para a página
 * como 'Failed to fetch', quebrando o React quando o usuário clicava
 * em botões como Editar.
 *
 * Estratégia (v4):
 *  - Ignorar requests non-http(s) schemes (chrome-extension, moz-extension,
 *    about, blob sem URL, etc.)
 *  - Navegação (HTML): network-first com fallback para offline.html
 *  - Scripts/Styles/Images/Fonts: STALE-WHILE-REVALIDATE (com try/catch no put)
 *  - Outros: network-first
 *
 * IMPORTANTE: Bumpar CACHE_VERSION abaixo a cada release crítica
 * para forçar limpeza dos caches antigos via activate event.
 */

const CACHE_VERSION = "v5-2026-10-04-versioned-url";
const CACHE_NAME = `survival-hub-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Limpa TODOS os caches antigos (qualquer cache cujo nome não seja o atual)
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k.startsWith("survival-hub-"))
          .map((k) => {
            console.log("[sw] deletando cache antigo:", k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Helper: verificar se a request é "cacheable" (apenas http/https).
 * Requests de extensões (chrome-extension://, moz-extension://), blobs
 * sem origin, etc. NÃO são suportados pela Cache API e causam erro
 * TypeError: 'Request scheme X is unsupported'.
 */
function isCacheableRequest(request) {
  // Aceitar apenas http e https schemes
  if (request.url.startsWith("http://") || request.url.startsWith("https://")) {
    return true;
  }
  // Outros schemes (chrome-extension://, moz-extension://, about:, blob:,
  // data:, ws:, wss:, etc.) NÃO são suportados pela Cache API.
  return false;
}

/**
 * Helper: fazer cache.put com try/catch. Não deixa erros da Cache API
 * vazarem para a página (causa "Failed to fetch").
 */
async function safeCachePut(request, response) {
  try {
    if (!isCacheableRequest(request)) return;
    if (!response || !response.ok) return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  } catch (e) {
    // Silencioso — erros de cache não devem quebrar o fetch da página.
    // Comum com extensões do navegador que fazem requests em background.
    console.warn("[sw] cache.put falhou (ignorado):", e.message?.slice(0, 80));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // ─── FILTRO CRÍTICO: ignorar requests non-http(s) ────────────────────
  // Extensões do Chrome (Adblock, password managers, etc.) fazem requests
  // com scheme chrome-extension:// que a Cache API não suporta. Se
  // deixarmos passar para o fetch handler, dá TypeError ao tentar
  // cache.put(). Por isso, retornamos SEM interceptar esses requests —
  // o navegador trata normalmente.
  if (!isCacheableRequest(request)) {
    return;
  }

  // Método não-GET também não é cacheable
  if (request.method !== "GET") return;

  // Para navegação (HTML), network-first com fallback offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Para scripts/styles/images/fonts: STALE-WHILE-REVALIDATE
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match(request);
          // Sempre buscar na rede em paralelo (revalidate)
          const networkFetchPromise = fetch(request)
            .then((response) => {
              // Atualizar cache em background (não bloqueia response)
              safeCachePut(request, response.clone());
              return response;
            })
            .catch(() => cached); // fallback para cache se offline

          // Se há cache, serve ele imediatamente e revalida em background
          return cached || networkFetchPromise;
        } catch (e) {
          // Fallback final: tentar cache
          const cached = await caches.match(request);
          if (cached) return cached;
          throw e;
        }
      })()
    );
    return;
  }

  // Para todo o resto (APIs, fetch cross-origin, etc.): network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
