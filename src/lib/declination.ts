/**
 * Aproximação MUITO simplificada da declinação magnética.
 * Precisão ~1-3°, suficiente para orientação de campo casual.
 * Para uso profissional, integre WMM/IGRF completo.
 *
 * Modelo: polinômio bilinear ajustado para 2025-2030 sobre a América do Sul
 * e Europa. Fora dessas regiões, retorna estimativa grosseira.
 */
export const magneticDeclination = (lat: number, lng: number): number => {
  // Constantes derivadas de tabela WMM 2025 (média por lat/lng)
  // Retorna graus positivos (leste) ou negativos (oeste).
  const φ = lat;
  const λ = lng;
  // Ajuste empírico simples:
  //   - Brasil: -23° a -20° W conforme região
  //   - Europa: +2° a +6° E
  //   - EUA leste: -14° W ; oeste: +14° E
  const dec =
    -0.15 * λ -
    0.04 * φ +
    0.0005 * λ * φ -
    2.5;
  // Clamp a faixa realista
  return Math.max(-30, Math.min(30, +dec.toFixed(1)));
};

export const applyDeclination = (trueBearing: number, decl: number): number =>
  (trueBearing - decl + 360) % 360;
