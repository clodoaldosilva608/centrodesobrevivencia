import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// ============================================================================
// Service Worker registration — versioned URL + aggressive cleanup
// ============================================================================
//
// BUG HISTORY: o sw.js antigo (v1-v3) tinha cache-first strategy para
// scripts/styles que quebrava com requests de extensões Chrome
// (chrome-extension://), causando "Failed to fetch" no console.
//
// SOLUÇÃO DEFINITIVA:
//   1. Registrar SW com URL VERSIONADA (/sw.js?v=20261004v5). Cada vez
//      que bumpamos SW_VERSION, o browser trata como SW novo — desinstala
//      o antigo automaticamente.
//   2. Antes de registrar, DESREGISTRAR qualquer SW antigo. Isso garante
//      que nenhum SW v1/v2/v3/v4 continue ativo.
//   3. Só registrar em produção (não em dev local nem em preview Vercel).
//
// IMPORTANTE: Ao alterar public/sw.js, bumpar SW_VERSION abaixo.

const SW_VERSION = "20261004v5";
const SW_URL = `/sw.js?v=${SW_VERSION}`;

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost = window.location.hostname.includes("preview--");

/**
 * Verifica se o SW registrado é o esperado. Se for antigo (URL diferente
 * da esperada), desregistra e re-registra com a URL versionada atual.
 */
async function syncServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  // Em iframe/preview: desregistra todos os SWs e sai.
  if (isPreviewHost || isInIframe) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    return;
  }

  // Em produção:
  // 1. Pega todos os SWs registrados neste scope
  const registrations = await navigator.serviceWorker.getRegistrations();

  // 2. Desregistra qualquer SW cuja URL não seja a versão atual
  //    (catch para SWs antigos v1-v4 com /sw.js sem query string)
  let needsRegister = true;
  for (const reg of registrations) {
    const regUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
    // Comparar só o pathname (sem query) para evitar edge cases
    const url = new URL(regUrl, window.location.origin);
    const currentUrl = new URL(SW_URL, window.location.origin);

    if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) {
      // SW atual já está registrado — não precisa re-registrar
      needsRegister = false;
    } else {
      // SW antigo detectado — desregistra
      console.log("[sw] desregistrando SW antigo:", regUrl);
      await reg.unregister();
    }
  }

  // 3. Registrar SW com URL versionada (força browser a buscar sw.js fresco)
  if (needsRegister) {
    try {
      await navigator.serviceWorker.register(SW_URL, { scope: "/" });
      console.log("[sw] registrado:", SW_URL);
    } catch (e) {
      console.warn("[sw] falha ao registrar:", (e as Error).message);
    }
  }
}

// Rodar depois do load para não bloquear primeira renderização
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    syncServiceWorker().catch((e) => {
      console.warn("[sw] sync falhou:", (e as Error).message);
    });
  });
}
