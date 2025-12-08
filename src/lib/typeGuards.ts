/**
 * 🛡️ TYPE GUARDS CENTRALIZADOS
 * Sprint AUD-C2: Type guards reutilizáveis para validação de tipos
 */

import type { CorpusType, PlatformCorpusType } from '@/data/types/corpus-tools.types';

/**
 * Lista de corpus de plataforma válidos
 */
const PLATFORM_CORPUS_TYPES: readonly PlatformCorpusType[] = ['gaucho', 'nordestino', 'sertanejo'] as const;

/**
 * Verifica se o valor é um corpus de plataforma válido
 */
export function isPlatformCorpus(value: unknown): value is PlatformCorpusType {
  return typeof value === 'string' && PLATFORM_CORPUS_TYPES.includes(value as PlatformCorpusType);
}

/**
 * Verifica se o valor é um corpus de usuário
 */
export function isUserCorpus(value: unknown): value is 'user' {
  return value === 'user';
}

/**
 * Verifica se o valor é um tipo de corpus válido (plataforma ou usuário)
 */
export function isValidCorpusType(value: unknown): value is CorpusType {
  return isPlatformCorpus(value) || isUserCorpus(value);
}

/**
 * Assertion guard - lança erro se não for corpus de plataforma
 */
export function assertPlatformCorpus(value: unknown, context?: string): asserts value is PlatformCorpusType {
  if (!isPlatformCorpus(value)) {
    throw new Error(`${context ? `[${context}] ` : ''}Expected platform corpus, got: ${String(value)}`);
  }
}

/**
 * Verifica se é um array não vazio
 */
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is T[] & { length: number } {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Verifica se é um objeto não nulo
 */
export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Verifica se é uma string não vazia
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica se é um número válido (não NaN, não Infinity)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);
}
