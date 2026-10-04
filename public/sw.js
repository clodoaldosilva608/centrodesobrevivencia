/**
 * Service Worker — Centro de Sobrevivência
 *
 * Estratégia (v3):
 *  - Navegação (HTML): network-first com fallback para offline.html
 *  - Scripts/Styles/Images/Fonts: STALE-WHILE-REVALIDATE
 *    (serve cache rápido, mas busca atualização em background; próximo
 *    reload pega a versão nova). Evita o bug do cache-first servir
 *    bundle JS antigo para sempre.
 *  - Outros (APIs, etc.): network-first
 *
 * IMPORTANTE: Bumpar CACHE_VERSION abaixo a cada release crítica
 * para forçar limpeza dos caches antigos via activate event.
 */

const CACHE_VERSION = "v3-2026-10-04";
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Para navegação (HTML), network-first com fallback offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Para scripts/styles/images/fonts: STALE-WHILE-REVALIDATE
  // Serve do cache imediatamente (rápido), mas busca na rede em background.
  // No próximo reload, a versão nova já estará no cache.
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        // Sempre buscar na rede em paralelo (revalidate)
        const networkFetch = fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached); // fallback para cache se offline

        // Se há cache, serve ele imediatamente e revalida em background
        return cached || networkFetch;
      })
    );
    return;
  }

  // Para todo o resto (APIs, fetch cross-origin, etc.): network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
