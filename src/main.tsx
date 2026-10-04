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
// Service Worker — DESATIVADO TEMPORARIAMENTE
// ============================================================================
// O SW estava interceptando requests de extensões Chrome (chrome-extension://)
// e quebrando com TypeError: "Failed to execute 'put' on 'Cache': Request
// scheme 'chrome-extension' is unsupported". Esse erro vazava para a página
// como "Failed to fetch", quebrando botões de editar/salvar.
//
// SOLUÇÃO IMEDIATA: desregistrar TODOS os SWs em cada page load.
// Sem SW = sem interceptação = sem erro. O app precisa de internet anyway
// (Supabase), então offline mode não é crítico.
//
// Para reativar SW no futuro, resolver o bug de chrome-extension primeiro.
// ============================================================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        console.log("[sw] desregistrando SW:", r.scope);
        r.unregister();
      });
    }).catch(() => {});
  });
}
