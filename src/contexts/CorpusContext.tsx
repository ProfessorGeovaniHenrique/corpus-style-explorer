import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { CorpusType } from '@/data/types/corpus-tools.types';
import { parseTSVCorpus, calculateTotalTokens } from '@/lib/corpusParser';
import { loadFullTextCorpus } from '@/lib/fullTextParser';
import { CorpusCompleto } from '@/data/types/full-text-corpus.types';
import { 
  loadCorpusFromCache, 
  saveCorpusToCache, 
  invalidateCache,
  cleanExpiredCache,
  generateSafeFilterKey,
  CorpusFilters as CacheFilters
} from '@/lib/corpusIndexedDBCache';
import { listenToCacheUpdates } from '@/lib/cacheSync';
import { cacheMetrics } from '@/lib/cacheMetrics';
import { trackCorpusUsage } from '@/lib/corpusUsageTracker';

/**
 * Carrega corpus específico para busca contextual isolada (sem alterar estado global)
 */
export async function loadSpecificCorpus(context: {
  corpusBase: CorpusType;
  mode: 'complete' | 'single';
  artistaA: string | null;
}): Promise<CorpusCompleto> {
  console.log('📦 loadSpecificCorpus chamado com:', context);
  
  const { corpusBase, mode, artistaA } = context;
  
  // Se modo completo, carregar corpus inteiro
  if (mode === 'complete') {
    return await loadFullTextCorpus(corpusBase);
  }
  
  // Modo single: filtrar por artista
  if (mode === 'single' && artistaA) {
    return await loadFullTextCorpus(corpusBase, {
      artistas: [artistaA]
    });
  }
  
  // Fallback: corpus completo
  console.warn('⚠️ Contexto inválido para loadSpecificCorpus, usando corpus completo');
  return await loadFullTextCorpus(corpusBase);
}

interface WordlistCache {
  words: Array<{ headword: string; freq: number }>;
  totalTokens: number;
  loadedAt: number;
}

interface FullTextCache {
  corpus: CorpusCompleto;
  loadedAt: number;
  source: 'memory' | 'indexeddb' | 'network';
}

export type CorpusFilters = CacheFilters;

interface CorpusContextType {
  // Wordlist cache
  getWordlistCache: (tipo: CorpusType, path: string) => Promise<WordlistCache>;
  
  // Full text cache
  getFullTextCache: (tipo: CorpusType, filters?: CorpusFilters) => Promise<FullTextCache>;
  
  // Cache management
  clearCache: () => void;
  isLoading: boolean;
}

const CorpusContext = createContext<CorpusContextType | undefined>(undefined);

// Cache com TTL de 30 minutos
const CACHE_TTL = 30 * 60 * 1000;

export function CorpusProvider({ children }: { children: ReactNode }) {
  const [wordlistCache, setWordlistCache] = useState<Map<string, WordlistCache>>(new Map());
  const [fullTextCache, setFullTextCache] = useState<Map<string, FullTextCache>>(new Map());
  const [decompressedMemoryCache, setDecompressedMemoryCache] = useState<Map<string, CorpusCompleto>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  
  // Promises de carregamento para prevenir race conditions
  const loadingPromises = useCallback(() => {
    const map = new Map<string, Promise<FullTextCache>>();
    return map;
  }, []);
  const [activeLoads] = useState(loadingPromises);
  
  // Cleanup de caches expirados ao montar
  useEffect(() => {
    cleanExpiredCache().then(removed => {
      if (removed > 0) {
        console.log(`🗑️ ${removed} caches expirados removidos ao iniciar`);
      }
    });
  }, []);
  
  // Escutar mudanças de cache de outras tabs
  useEffect(() => {
    const cleanup = listenToCacheUpdates((cacheKey, action) => {
      if (action === 'deleted' || action === 'cleared') {
        // Invalidar cache em memória
        setFullTextCache(prev => {
          const newCache = new Map(prev);
          if (action === 'cleared') {
            newCache.clear();
          } else {
            newCache.delete(cacheKey);
          }
          return newCache;
        });
        
        setDecompressedMemoryCache(prev => {
          const newCache = new Map(prev);
          if (action === 'cleared') {
            newCache.clear();
          } else {
            newCache.delete(cacheKey);
          }
          return newCache;
        });
      }
    });
    
    return cleanup;
  }, []);

  const getWordlistCache = useCallback(async (tipo: CorpusType, path: string): Promise<WordlistCache> => {
    const cacheKey = `${tipo}-${path}`;
    const cached = wordlistCache.get(cacheKey);
    
    // Verificar se cache é válido
    if (cached && (Date.now() - cached.loadedAt) < CACHE_TTL) {
      console.log(`✅ Cache hit: wordlist ${tipo}`);
      return cached;
    }

    console.log(`📂 Cache miss: carregando wordlist ${tipo}...`);
    setIsLoading(true);
    
    try {
      const response = await fetch(path);
      const text = await response.text();
      const parsedCorpus = parseTSVCorpus(text);
      const totalTokens = calculateTotalTokens(parsedCorpus);

      const cache: WordlistCache = {
        words: parsedCorpus,
        totalTokens,
        loadedAt: Date.now()
      };

      setWordlistCache(prev => new Map(prev).set(cacheKey, cache));
      console.log(`✅ Wordlist ${tipo} carregada e cacheada: ${parsedCorpus.length} palavras`);
      
      return cache;
    } finally {
      setIsLoading(false);
    }
  }, [wordlistCache]);

  const getFullTextCache = useCallback(async (tipo: CorpusType, filters?: CorpusFilters): Promise<FullTextCache> => {
    const startTime = performance.now();
    
    // Apenas gaucho e nordestino suportam full text
    if (tipo !== 'gaucho' && tipo !== 'nordestino') {
      throw new Error(`Full text corpus não disponível para tipo: ${tipo}`);
    }
    
    const filterKey = generateSafeFilterKey(filters);
    const cacheKey = `${tipo}-fulltext-${filterKey}`;
    
    // 🔒 Verificar se já está carregando (prevenir race conditions)
    const existingPromise = activeLoads.get(cacheKey);
    if (existingPromise) {
      console.log(`⏳ Aguardando carregamento em progresso: ${cacheKey}`);
      return existingPromise;
    }
    
    // 1️⃣ Tentar memória descomprimida (mais rápido)
    const memCorpus = decompressedMemoryCache.get(cacheKey);
    if (memCorpus) {
      console.log(`✅ Cache hit (memória): ${tipo} (${(performance.now() - startTime).toFixed(0)}ms)`);
      cacheMetrics.recordHit();
      return {
        corpus: memCorpus,
        loadedAt: Date.now(),
        source: 'memory'
      };
    }
    
    // 2️⃣ Criar promise de carregamento
    const loadPromise = (async (): Promise<FullTextCache> => {
      try {
        // 3️⃣ Tentar IndexedDB (persistente)
        const idbCached = await loadCorpusFromCache(tipo, filters);
        if (idbCached) {
          console.log(`✅ Cache hit (IndexedDB): ${tipo} (${(performance.now() - startTime).toFixed(0)}ms)`);
          
          // Salvar versão descomprimida em memória
          setDecompressedMemoryCache(prev => new Map(prev).set(cacheKey, idbCached));
          
          return {
            corpus: idbCached,
            loadedAt: Date.now(),
            source: 'indexeddb'
          };
        }
        
        // 4️⃣ Fetch do arquivo (último recurso)
        console.log(`📂 Cache miss completo: carregando ${tipo}...`);
        setIsLoading(true);
        
        const corpus = await loadFullTextCorpus(tipo, filters);
        
        // 🔥 TRACKING: Registrar uso do corpus
        const loadTime = performance.now() - startTime;
        trackCorpusUsage(tipo, loadTime);
        
        // 5️⃣ Salvar em AMBOS os caches
        const cache: FullTextCache = {
          corpus,
          loadedAt: Date.now(),
          source: 'network'
        };
        
        // Memória descomprimida
        setDecompressedMemoryCache(prev => new Map(prev).set(cacheKey, corpus));
        
        // IndexedDB comprimido (não bloquear resposta)
        saveCorpusToCache(tipo, corpus, filters).catch(err => 
          console.warn('⚠️ Falha ao salvar cache persistente:', err)
        );
        
        console.log(`✅ ${tipo} carregado: ${corpus.totalMusicas} músicas (${(performance.now() - startTime).toFixed(0)}ms)`);
        
        return cache;
        
      } finally {
        activeLoads.delete(cacheKey);
        setIsLoading(false);
      }
    })();
    
    activeLoads.set(cacheKey, loadPromise);
    return loadPromise;
    
  }, [decompressedMemoryCache, activeLoads]);

  const clearCache = useCallback(async () => {
    setWordlistCache(new Map());
    setFullTextCache(new Map());
    setDecompressedMemoryCache(new Map());
    
    // Limpar IndexedDB
    await invalidateCache();
    
    console.log('🗑️ Cache completo limpo (memória + IndexedDB)');
  }, []);

  return (
    <CorpusContext.Provider value={{
      getWordlistCache,
      getFullTextCache,
      clearCache,
      isLoading
    }}>
      {children}
    </CorpusContext.Provider>
  );
}

export function useCorpusCache() {
  const context = useContext(CorpusContext);
  if (!context) {
    throw new Error('useCorpusCache must be used within CorpusProvider');
  }
  return context;
}
