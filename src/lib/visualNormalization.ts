/**
 * Funções genéricas para normalização de valores
 * para propriedades visuais
 */

interface NormalizationRange {
  min: number;
  max: number;
}

/**
 * Normaliza um valor para um range visual
 * @param value - Valor a ser normalizado
 * @param dataRange - Range dos dados originais
 * @param visualRange - Range visual desejado
 * @returns Valor normalizado
 */
export function normalizeValue(
  value: number,
  dataRange: NormalizationRange,
  visualRange: NormalizationRange
): number {
  const normalized = (value - dataRange.min) / (dataRange.max - dataRange.min);
  return visualRange.min + normalized * (visualRange.max - visualRange.min);
}

/**
 * Normaliza logaritmicamente (para valores com distribuição exponencial)
 */
export function normalizeLog(
  value: number,
  dataRange: NormalizationRange,
  visualRange: NormalizationRange
): number {
  const logValue = Math.log(value + 1);
  const logMin = Math.log(dataRange.min + 1);
  const logMax = Math.log(dataRange.max + 1);
  
  const normalized = (logValue - logMin) / (logMax - logMin);
  return visualRange.min + normalized * (visualRange.max - visualRange.min);
}

/**
 * Normaliza com threshold (valores acima do threshold são mapeados para o max)
 */
export function normalizeWithThreshold(
  value: number,
  threshold: number,
  visualRange: NormalizationRange
): number {
  const clamped = Math.min(value, threshold);
  return visualRange.min + (clamped / threshold) * (visualRange.max - visualRange.min);
}

/**
 * Calcula glow intensity baseado em peso textual
 */
export function calculateGlowIntensity(
  textualWeight: number,
  config: { base: number; multiplier: number; max: number }
): number {
  const intensity = config.base + (textualWeight / 100) * config.multiplier;
  return Math.min(intensity, config.max);
}

/**
 * Calcula opacidade baseado em prosódia
 */
export function calculateProsodyOpacity(
  prosody: 'Positiva' | 'Negativa' | 'Neutra',
  config: Record<'Positiva' | 'Neutra' | 'Negativa', number>
): number {
  return config[prosody];
}

/**
 * Determina se um domínio deve ter animação de pulso
 */
export function shouldPulseDomain(
  textualWeight: number,
  threshold: number
): boolean {
  return textualWeight > threshold;
}

/**
 * Calcula a velocidade de pulso baseada no peso textual
 */
export function calculatePulseSpeed(
  textualWeight: number,
  baseSpeed: number = 2
): number {
  return baseSpeed * (1 + textualWeight / 100);
}
