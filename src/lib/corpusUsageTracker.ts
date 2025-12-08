/**
 * Sistema de tracking de uso de corpus para pré-carregamento inteligente
 */

import { CorpusType } from '@/data/types/corpus-tools.types';

interface CorpusUsageEntry {
  count: number;           // Uso total
  lastUsed: number;        // Timestamp último uso
  sessionCount: number;    // Uso na sessão atual
  avgAccessTime: number;   // Tempo médio de acesso (ms)
}

interface CorpusUsageStats {
  usage: Record<CorpusType, CorpusUsageEntry>;
  sessionStart: number;
  version: number;
}

const STORAGE_KEY = 'corpus-usage-v2';
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 horas
const DEFAULT_CORPUS: CorpusType = 'gaucho';

/**
 * Inicializa estatísticas vazias
 */
function createEmptyStats(): CorpusUsageStats {
  return {
    usage: {
      gaucho: { count: 0, lastUsed: 0, sessionCount: 0, avgAccessTime: 0 },
      nordestino: { count: 0, lastUsed: 0, sessionCount: 0, avgAccessTime: 0 },
      sertanejo: { count: 0, lastUsed: 0, sessionCount: 0, avgAccessTime: 0 },
      user: { count: 0, lastUsed: 0, sessionCount: 0, avgAccessTime: 0 },
    },
    sessionStart: Date.now(),
    version: 2,
  };
}

/**
 * Compacta estatísticas para economizar espaço
 */
function compactStats(stats: CorpusUsageStats): CorpusUsageStats {
  // Remover entradas com count === 0
  const compacted = { ...stats };
  Object.entries(compacted.usage).forEach(([key, entry]) => {
    if (entry.count === 0) {
      delete (compacted.usage as any)[key];
    }
  });
  return compacted;
}

/**
 * Limpa dados de tracking antigos do localStorage
 */
function cleanOldTracking(): void {
  const keys = Object.keys(localStorage).filter(k => 
    k.startsWith('corpus-usage-') || k.startsWith('corpus-tracking-')
  );
  keys.forEach(k => {
    if (k !== STORAGE_KEY) {
      localStorage.removeItem(k);
    }
  });
}

/**
 * Carrega estatísticas do localStorage com validação
 */
export function getUsageStats(): CorpusUsageStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createEmptyStats();
    }

    const parsed = JSON.parse(stored) as CorpusUsageStats;
    
    // Validar estrutura
    if (!parsed.usage || !parsed.sessionStart || parsed.version !== 2) {
      console.warn('⚠️ Estatísticas inválidas, resetando');
      return createEmptyStats();
    }

    // Verificar se sessão expirou
    const now = Date.now();
    if (now - parsed.sessionStart > SESSION_DURATION) {
      // Nova sessão: resetar sessionCount
      Object.values(parsed.usage).forEach(entry => {
        entry.sessionCount = 0;
      });
      parsed.sessionStart = now;
    }

    return parsed;
  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
    return createEmptyStats();
  }
}

/**
 * Salva estatísticas com tratamento de quota exceeded
 */
export function saveUsageStats(stats: CorpusUsageStats): void {
  try {
    const compacted = compactStats(stats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
  } catch (e) {
    if ((e as any).name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage cheio, limpando dados antigos...');
      
      // Limpar dados antigos e retry
      cleanOldTracking();
      
      try {
        const minimal = compactStats(stats);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
      } catch (retryError) {
        console.error('❌ Falha definitiva ao salvar estatísticas');
      }
    } else {
      console.error('❌ Erro ao salvar estatísticas:', e);
    }
  }
}

/**
 * Registra uso de um corpus
 */
export function trackCorpusUsage(tipo: CorpusType, accessTimeMs?: number): void {
  const stats = getUsageStats();
  const now = Date.now();

  if (!stats.usage[tipo]) {
    stats.usage[tipo] = { count: 0, lastUsed: 0, sessionCount: 0, avgAccessTime: 0 };
  }

  const entry = stats.usage[tipo];
  
  // Atualizar contadores
  entry.count += 1;
  entry.sessionCount += 1;
  entry.lastUsed = now;

  // Atualizar tempo médio de acesso
  if (accessTimeMs) {
    entry.avgAccessTime = entry.avgAccessTime === 0
      ? accessTimeMs
      : (entry.avgAccessTime + accessTimeMs) / 2;
  }

  saveUsageStats(stats);
  console.log(`📊 Tracking: ${tipo} usado (total: ${entry.count}, sessão: ${entry.sessionCount})`);
}

/**
 * Calcula score de probabilidade para cada corpus
 */
function calculateCorpusScore(entry: CorpusUsageEntry, now: number): number {
  if (entry.count === 0) return 0;

  const daysSinceLastUse = (now - entry.lastUsed) / (24 * 60 * 60 * 1000);
  const recencyScore = 1 / (1 + daysSinceLastUse);
  const frequencyScore = Math.min(entry.count / 10, 1); // Normalizar para 0-1
  
  // Boost para sessão ativa
  const sessionBoost = entry.sessionCount > 0 ? 2.0 : 1.0;
  
  return (recencyScore * 0.4 + frequencyScore * 0.6) * sessionBoost;
}

/**
 * Heurística para determinar corpus padrão em cold start
 */
function getDefaultCorpus(): CorpusType {
  // Verificar se há pistas no localStorage
  const keys = Object.keys(localStorage);
  
  if (keys.some(k => k.includes('gaucho'))) return 'gaucho';
  if (keys.some(k => k.includes('nordestino'))) return 'nordestino';
  
  return DEFAULT_CORPUS;
}

/**
 * Determina qual corpus tem maior probabilidade de ser usado
 */
export function getMostLikelyCorpus(): CorpusType {
  const stats = getUsageStats();
  const now = Date.now();

  // Se há uso na sessão atual, priorizar
  const sessionCorpus = Object.entries(stats.usage).find(
    ([_, entry]) => entry.sessionCount > 0
  );

  if (sessionCorpus) {
    console.log(`🎯 Corpus baseado em sessão ativa: ${sessionCorpus[0]}`);
    return sessionCorpus[0] as CorpusType;
  }

  // Calcular scores para todos os corpus
  const scores = Object.entries(stats.usage).map(([tipo, entry]) => ({
    tipo: tipo as CorpusType,
    score: calculateCorpusScore(entry, now),
  }));

  // Ordenar por score
  scores.sort((a, b) => b.score - a.score);

  // Se nenhum corpus foi usado ainda (cold start)
  if (scores[0].score === 0) {
    const defaultCorpus = getDefaultCorpus();
    console.log(`🆕 Cold start: usando heurística padrão (${defaultCorpus})`);
    return defaultCorpus;
  }

  console.log(`🎯 Corpus mais provável: ${scores[0].tipo} (score: ${scores[0].score.toFixed(2)})`);
  return scores[0].tipo;
}

/**
 * Obtém estatísticas legíveis
 */
export function getReadableStats(): {
  mostUsed: CorpusType;
  totalUses: number;
  sessionActive: boolean;
} {
  const stats = getUsageStats();
  const now = Date.now();
  
  const entries = Object.entries(stats.usage) as [CorpusType, CorpusUsageEntry][];
  entries.sort((a, b) => b[1].count - a[1].count);

  return {
    mostUsed: entries[0]?.[0] || DEFAULT_CORPUS,
    totalUses: entries.reduce((sum, [_, entry]) => sum + entry.count, 0),
    sessionActive: now - stats.sessionStart < SESSION_DURATION,
  };
}
