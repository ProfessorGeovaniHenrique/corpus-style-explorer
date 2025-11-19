/**
 * Sistema de pré-carregamento inteligente de corpus
 * Valida condições de rede, quota e executa preload de baixa prioridade
 */

import { CorpusType } from '@/data/types/corpus-tools.types';
import { loadCorpusFromCache, saveCorpusToCache } from './corpusIndexedDBCache';
import { parseFullTextCorpus } from './fullTextParser';
import { isDataSaverEnabled, isSlowConnection } from './polyfills';
import { broadcastCacheUpdate } from './cacheSync';
import { cacheMetrics } from './cacheMetrics';
import { toast } from 'sonner';

// Estimativas de tamanho (fallback)
const FALLBACK_SIZES: Record<CorpusType, number> = {
  'gaucho': 2.1 * 1024 * 1024,      // 2.1 MB
  'nordestino': 1.8 * 1024 * 1024,  // 1.8 MB
};

/**
 * Obtém caminhos dos arquivos do corpus
 */
function getCorpusPaths(tipo: CorpusType): string[] {
  const base = '/corpus';
  
  switch (tipo) {
    case 'gaucho':
      return [
        `${base}/corpus_gaucho_completo_full.txt`,
        `${base}/corpus_gaucho_completo_full_part2.txt`,
        `${base}/corpus_gaucho_completo_full_part3.txt`,
      ];
    case 'nordestino':
      return [`${base}/corpus_nordestino_full.txt`];
    default:
      return [];
  }
}

/**
 * Obtém tamanho real do corpus via HEAD request
 */
async function getActualCorpusSize(tipo: CorpusType): Promise<number> {
  const paths = getCorpusPaths(tipo);
  
  try {
    const sizes = await Promise.all(
      paths.map(async path => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(path, { 
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          const contentLength = response.headers.get('Content-Length');
          return parseInt(contentLength || '0', 10);
        } catch (error) {
          clearTimeout(timeoutId);
          return 0;
        }
      })
    );
    
    const total = sizes.reduce((sum, s) => sum + s, 0);
    return total > 0 ? total : FALLBACK_SIZES[tipo];
  } catch (error) {
    console.warn('⚠️ Falha ao obter tamanho, usando fallback');
    return FALLBACK_SIZES[tipo];
  }
}

/**
 * Verifica se há quota suficiente no IndexedDB
 */
async function ensureSufficientQuota(requiredBytes: number): Promise<boolean> {
  if (!navigator.storage?.estimate) {
    console.warn('⚠️ Storage API não disponível, assumindo quota suficiente');
    return true;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const available = (estimate.quota || 0) - (estimate.usage || 0);
    
    // Requer 100% de margem de segurança
    if (available < requiredBytes * 2) {
      console.warn(`⚠️ Quota insuficiente: ${(available / 1024 / 1024).toFixed(1)}MB disponível, ${(requiredBytes * 2 / 1024 / 1024).toFixed(1)}MB necessário`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar quota:', error);
    return true; // Assumir OK em caso de erro
  }
}

/**
 * Verifica se deve executar preload baseado em condições de rede
 */
export function shouldPreload(): boolean {
  // 1. Data Saver ativado
  if (isDataSaverEnabled()) {
    console.log('⏭️ Preload cancelado: Data Saver ativo');
    return false;
  }

  // 2. Conexão lenta (< 3G)
  if (isSlowConnection()) {
    console.log('⏭️ Preload cancelado: Conexão lenta detectada');
    return false;
  }

  // 3. Verificar bateria (se disponível) - não-bloqueante
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      if (battery.level < 0.2) {
        console.log('⚠️ Bateria baixa detectada (não-bloqueante)');
      }
    }).catch(() => {
      // Ignorar erro
    });
  }

  return true;
}

/**
 * Carrega corpus completo (usado pelo preload)
 */
async function loadFullTextCorpus(
  tipo: CorpusType,
  signal?: AbortSignal
): Promise<any> {
  const paths = getCorpusPaths(tipo);
  
  const responses = await Promise.all(
    paths.map(async path => {
      const response = await fetch(path, { 
        signal,
        // @ts-ignore - priority não é padrão mas funciona em Chrome
        priority: 'low'
      });
      return response.text();
    })
  );

  const combinedText = responses.join('\n');
  return parseFullTextCorpus(combinedText, tipo);
}

/**
 * Executa pré-carregamento de um corpus
 */
export async function preloadCorpus(
  tipo: CorpusType,
  signal: AbortSignal
): Promise<void> {
  console.log(`🚀 Verificando viabilidade de preload para ${tipo}...`);

  // 1. Validações preliminares
  if (!shouldPreload()) {
    return;
  }

  // 2. Obter tamanho estimado
  const size = await getActualCorpusSize(tipo);
  console.log(`📊 Tamanho estimado: ${(size / 1024 / 1024).toFixed(1)}MB`);

  // 3. Verificar quota
  const hasQuota = await ensureSufficientQuota(size);
  if (!hasQuota) {
    console.log('⏭️ Preload cancelado: Quota insuficiente');
    return;
  }

  // 4. Verificar se já existe em cache
  try {
    const cached = await loadCorpusFromCache(tipo);
    if (cached) {
      console.log(`✅ Corpus ${tipo} já em cache, preload desnecessário`);
      return;
    }
  } catch (error) {
    // Continuar com preload
  }

  // 5. Executar preload
  console.log(`🚀 Iniciando preload de ${tipo}...`);
  const startTime = Date.now();

  try {
    const corpus = await loadFullTextCorpus(tipo, signal);
    
    if (signal.aborted) {
      console.log('⏹️ Preload cancelado pelo usuário');
      return;
    }

    const loadTime = Date.now() - startTime;
    console.log(`✅ Preload concluído em ${loadTime}ms`);

    // 6. Salvar em cache (não-bloqueante)
    saveCorpusToCache(tipo, corpus).then(() => {
      console.log(`💾 Corpus ${tipo} salvo no cache`);
      
      // Notificar outras tabs
      broadcastCacheUpdate(`${tipo}-fulltext-none`, 'saved');
      
      // Métrica
      cacheMetrics.recordSave();
      
      // Feedback visual discreto
      toast.success('Corpus pré-carregado', {
        description: `${tipo} está pronto para análise rápida`,
        duration: 3000,
        position: 'bottom-right'
      });
    }).catch(err => {
      console.warn('⚠️ Falha ao cachear após preload:', err);
    });

  } catch (error) {
    if (signal.aborted) {
      console.log('⏹️ Preload cancelado durante carregamento');
    } else {
      console.error('❌ Erro no preload:', error);
      cacheMetrics.recordError();
    }
  }
}
