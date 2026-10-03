/**
 * Helper para a URL do app externo "Manual do Sobrevivente".
 *
 * Quando o usuário clica em "Bússola" (navbar) ou no CTA "BÚSSOLA TÁTICA"
 * (home), é redirecionado para este app em nova aba.
 *
 * Configurável via env var VITE_MANUAL_URL — default é a instância na Vercel.
 */

export const MANUAL_URL =
  import.meta.env.VITE_MANUAL_URL ?? "https://manual-do-sobrevivente.vercel.app";

/** Abre o Manual do Sobrevivente em nova aba. */
export function openManual(): void {
  window.open(MANUAL_URL, "_blank", "noopener,noreferrer");
}

/** URL do Manual + path opcional (ex.: `/tabela-angeles`). */
export function manualUrl(path: string = ""): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${MANUAL_URL}${clean}`;
}

export default MANUAL_URL;
