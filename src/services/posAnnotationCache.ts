/**
 * 💾 POS ANNOTATION CACHE
 * 
 * Sistema de cache inteligente para anotações POS
 * Usa (palavra:contexto_hash) como chave para evitar re-anotação
 */

import type { POSToken } from '@/data/types/pos-annotation.types';

export interface CachedPOSAnnotation {
  palavra: string;
  lema: string;
  pos: string;
  posDetalhada: string;
  features: {
    tempo?: string;
    numero?: string;
    pessoa?: string;
    genero?: string;
    modo?: string;
    grau?: string;
  };
  source: 'va_grammar' | 'spacy' | 'gemini' | 'cache';
  cachedAt: number;
  hitCount: number;
}

// Cache em memória (pode migrar para IndexedDB depois)
const memoryCache = new Map<string, CachedPOSAnnotation>();

// Configurações
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const MAX_CACHE_SIZE = 10000; // Máximo de entradas

/**
 * Gera hash simples do contexto (palavras ao redor)
 */
function hashContext(leftContext: string, rightContext: string): string {
  const combined = `${leftContext}|${rightContext}`.toLowerCase();
  // Hash simples (não precisa ser criptograficamente seguro)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Cria chave de cache combinando palavra e contexto
 */
export function createCacheKey(palavra: string, leftContext: string = '', rightContext: string = ''): string {
  const contextHash = hashContext(leftContext, rightContext);
  return `${palavra.toLowerCase()}:${contextHash}`;
}

/**
 * Busca anotação no cache
 */
export function getCachedPOSAnnotation(
  palavra: string,
  leftContext: string = '',
  rightContext: string = ''
): CachedPOSAnnotation | null {
  const key = createCacheKey(palavra, leftContext, rightContext);
  const cached = memoryCache.get(key);

  if (!cached) return null;

  // Verificar expiração
  const age = Date.now() - cached.cachedAt;
  if (age > CACHE_EXPIRY_MS) {
    memoryCache.delete(key);
    return null;
  }

  // Incrementar contador de hits
  cached.hitCount++;
  cached.source = 'cache';

  return cached;
}

/**
 * Salva anotação no cache
 */
export function setCachedPOSAnnotation(
  palavra: string,
  annotation: Omit<CachedPOSAnnotation, 'cachedAt' | 'hitCount'>,
  leftContext: string = '',
  rightContext: string = ''
): void {
  // Limpar cache se atingir limite
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    clearOldestCacheEntries(MAX_CACHE_SIZE * 0.2); // Remover 20% mais antigos
  }

  const key = createCacheKey(palavra, leftContext, rightContext);
  memoryCache.set(key, {
    ...annotation,
    cachedAt: Date.now(),
    hitCount: 0,
  });
}

/**
 * Remove entradas mais antigas do cache
 */
function clearOldestCacheEntries(count: number): void {
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].cachedAt - b[1].cachedAt);

  for (let i = 0; i < count && i < entries.length; i++) {
    memoryCache.delete(entries[i][0]);
  }
}

/**
 * Estatísticas do cache
 */
export function getCacheStatistics() {
  const entries = Array.from(memoryCache.values());
  const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
  const sourceDistribution = entries.reduce((acc, e) => {
    const source = e.hitCount > 0 ? 'cache' : e.source;
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalEntries: memoryCache.size,
    totalHits,
    hitRate: entries.length > 0 ? totalHits / entries.length : 0,
    sourceDistribution,
    oldestEntry: entries.length > 0 
      ? Math.min(...entries.map(e => e.cachedAt)) 
      : null,
  };
}

/**
 * Limpa cache completamente
 */
export function clearPOSCache(): void {
  memoryCache.clear();
}

/**
 * Exporta cache para persistência (localStorage, IndexedDB)
 */
export function exportCache(): CachedPOSAnnotation[] {
  return Array.from(memoryCache.values());
}

/**
 * Importa cache de persistência
 */
export function importCache(data: CachedPOSAnnotation[]): void {
  memoryCache.clear();
  for (const entry of data) {
    const key = `${entry.palavra}:${Math.random().toString(36).substring(7)}`; // Recalcular hash
    memoryCache.set(key, entry);
  }
}
