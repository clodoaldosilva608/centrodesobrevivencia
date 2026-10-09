/**
 * Analytics do Centro de Sobrevivência — capítulo 3.2 do Kit de Execução.
 *
 * MESMA FILOSOFIA do Manual (src/lib/analytics.ts): nada é enviado sem
 * configuração. O carregador só entra em ação quando o deploy define
 * VITE_GA4_ID (Google Analytics 4). Sem ele, o site não emite UMA
 * requisição de telemetria — privacidade primeiro.
 *
 * Eventos-chave do funil (Kit, cap. 3.2):
 *   - clique_comprar_loja : clique em "Comprar na Amazon / Mercado Livre"
 *   - inicio_cadastro     : envio do formulário de criação de conta
 * Os pageviews de navegação SPA entram pelo RastreadorRota (App.tsx).
 */

const ID_GA4 = import.meta.env.VITE_GA4_ID as string | undefined;

/** Configuração já aplicada (evita script duplicado em remontagens). */
let iniciado = false;

/** Primeira rota registrada — o config() do GA4 já dispara o pageview inicial. */
let primeiraRota = true;

function iniciarGA4(): void {
  if (!ID_GA4 || typeof document === "undefined") return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ID_GA4}`;
  document.head.appendChild(script);

  const janela = window as typeof window & {
    dataLayer?: unknown[];
    gtag?: (...a: unknown[]) => void;
  };
  janela.dataLayer = janela.dataLayer ?? [];
  janela.gtag = function gtag(...args: unknown[]) {
    janela.dataLayer?.push(args);
  };
  janela.gtag("js", new Date());
  // anonymize_ip + Google Signals desligado: dado mínimo do relatório.
  janela.gtag("config", ID_GA4, { anonymize_ip: true, allow_google_signals: false });
}

/** Ativa a telemetria configurada; sem env definida é no-op absoluto. */
export function iniciarAnalytics(): void {
  if (iniciado || typeof window === "undefined") return;
  if (!ID_GA4) return;
  iniciado = true;
  try {
    iniciarGA4();
  } catch {
    /* telemetria jamais pode quebrar o site */
  }
}

/**
 * Registra a troca de rota do SPA. O primeiro carregamento é medido pelo
 * próprio config() do GA4 — chamadas seguintes disparam page_view manual.
 */
export function registrarPageview(caminho: string): void {
  if (!iniciado) return;
  if (primeiraRota) {
    primeiraRota = false;
    return;
  }
  try {
    const janela = window as typeof window & { gtag?: (...a: unknown[]) => void };
    janela.gtag?.("event", "page_view", { page_path: caminho });
  } catch {
    /* silencioso por definição */
  }
}

/** Evento de conversão/funil (ex.: clique de saída para a loja). */
export function registrarEvento(nome: string, parametros?: Record<string, unknown>): void {
  if (!iniciado) return;
  try {
    const janela = window as typeof window & { gtag?: (...a: unknown[]) => void };
    janela.gtag?.("event", nome, parametros);
  } catch {
    /* silencioso por definição */
  }
}
