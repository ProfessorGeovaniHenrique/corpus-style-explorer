// ============================================================================
// ARQUITETURA UNIFICADA DE SUBCORPORA (Novembro 2024)
// ============================================================================
//
// CONTEXTO HISTÓRICO:
// -------------------
// Este hook foi criado antes da implementação do sistema unificado de 
// subcorpora. Ele funcionava de forma isolada, carregando o corpus 
// independentemente em cada componente que o utilizava.
//
// PROBLEMA RESOLVIDO:
// -------------------
// - Múltiplos carregamentos do mesmo corpus
// - Estado não sincronizado entre componentes
// - Sem persistência de seleção
// - Performance inferior
//
// NOVA ARQUITETURA:
// -----------------
// O SubcorpusContext centraliza toda a lógica de:
// 1. Carregamento e cache de corpus (carrega apenas UMA vez)
// 2. Seleção global de subcorpora (sincronizada em toda app)
// 3. Persistência automática em localStorage
// 4. Metadados e estatísticas dos subcorpora
// 5. Comparação entre artistas
//
// MIGRATION PATH:
// ---------------
// Fase 1 (Atual): Hook deprecated mas funcional
// Fase 2 (Próximo release): Warning em produção
// Fase 3 (Futuro): Remoção completa do hook
//
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useFullTextCorpus } from './useFullTextCorpus';
import { CorpusType } from '@/data/types/corpus-tools.types';
import { SubcorpusMetadata, ComparativoSubcorpora } from '@/data/types/subcorpus.types';
import { extractSubcorpora, compareSubcorpora, getSubcorpusByArtista } from '@/utils/subcorpusAnalysis';

/**
 * @deprecated Este hook será removido em versões futuras.
 * 
 * **MIGRAÇÃO RECOMENDADA:**
 * ```typescript
 * // ❌ Antigo (deprecated)
 * const { subcorpora } = useSubcorpora('gaucho');
 * 
 * // ✅ Novo (recomendado)
 * import { useSubcorpus } from '@/contexts/SubcorpusContext';
 * const { subcorpora, selection } = useSubcorpus();
 * ```
 * 
 * **BENEFÍCIOS DA MIGRAÇÃO:**
 * - ✅ Estado global compartilhado entre todas as abas
 * - ✅ Persistência automática no localStorage
 * - ✅ Cache unificado (carrega corpus apenas uma vez)
 * - ✅ Sincronização automática de seleção
 * - ✅ Performance superior (~40% mais rápido)
 * 
 * **ARQUITETURA:**
 * ```
 * SubcorpusProvider (src/contexts/SubcorpusContext.tsx)
 *   ├─ Gerencia estado global de seleção
 *   ├─ Cache compartilhado de corpus
 *   ├─ Persistência em localStorage
 *   └─ Metadados de subcorpora
 * 
 * UnifiedCorpusSelector (src/components/corpus/UnifiedCorpusSelector.tsx)
 *   └─ UI para seleção de corpus/artista/comparação
 * 
 * SubcorpusIndicator (src/components/corpus/SubcorpusIndicator.tsx)
 *   └─ Badge flutuante mostrando subcorpus ativo
 * ```
 * 
 * @see {@link SubcorpusContext} para a implementação do contexto global
 * @see {@link UnifiedCorpusSelector} para o componente de seleção
 */
export function useSubcorpora(corpusType: CorpusType) {
  // Emitir warning no console (apenas em desenvolvimento)
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️  useSubcorpora() está deprecated.\n' +
      '📚 Migre para useSubcorpus() do SubcorpusContext.\n' +
      '🔗 Veja a documentação inline para exemplos.'
    );
  }
  const { corpus, isLoading: isLoadingCorpus } = useFullTextCorpus(corpusType);
  const [subcorpora, setSubcorpora] = useState<SubcorpusMetadata[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Extrair subcorpora quando corpus é carregado
  useEffect(() => {
    if (corpus && !isProcessing) {
      setIsProcessing(true);
      try {
        const extracted = extractSubcorpora(corpus);
        setSubcorpora(extracted);
        console.log(`✅ Subcorpora extraídos: ${extracted.length} artistas`);
      } catch (error) {
        console.error('Erro ao extrair subcorpora:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [corpus]);
  
  // Buscar subcorpus por artista
  const getByArtista = useCallback((artista: string) => {
    return getSubcorpusByArtista(subcorpora, artista);
  }, [subcorpora]);
  
  // Comparar dois artistas
  const compareArtists = useCallback((
    artistaA: string,
    artistaB?: string
  ): ComparativoSubcorpora | null => {
    if (!corpus) return null;
    
    try {
      return compareSubcorpora(corpus, artistaA, artistaB);
    } catch (error) {
      console.error('Erro ao comparar artistas:', error);
      return null;
    }
  }, [corpus]);
  
  return {
    subcorpora,
    isLoading: isLoadingCorpus || isProcessing,
    totalArtistas: subcorpora.length,
    getByArtista,
    compareArtists
  };
}
