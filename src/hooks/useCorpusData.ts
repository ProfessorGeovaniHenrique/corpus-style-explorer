/**
 * 🎯 USE CORPUS DATA - Hook Unificado para Dados Reais
 * 
 * Substitui useCorpusComparison com dados do banco real
 */

import { useState, useEffect } from 'react';
import { getCorpusAnalysisResults, CorpusAnalysisResult } from '@/services/corpusDataService';
import { toast } from 'sonner';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('useCorpusData');

interface UseCorpusDataOptions {
  loadGaucho?: boolean;
  loadNordestino?: boolean;
  enrichedOnly?: boolean;
  limit?: number;
}

export function useCorpusData(options: UseCorpusDataOptions = {}) {
  const {
    loadGaucho = true,
    loadNordestino = true,
    enrichedOnly = false,
    limit
  } = options;

  const [gauchoData, setGauchoData] = useState<CorpusAnalysisResult | null>(null);
  const [nordestinoData, setNordestinoData] = useState<CorpusAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCorpora = async () => {
      setIsLoading(true);
      setError(null);

      try {
        log.info('Loading corpora', { loadGaucho, loadNordestino });

        const promises: Promise<CorpusAnalysisResult>[] = [];

        if (loadGaucho) {
          promises.push(
            getCorpusAnalysisResults('gaucho', { enrichedOnly, limit })
          );
        }

        if (loadNordestino) {
          promises.push(
            getCorpusAnalysisResults('nordestino', { enrichedOnly, limit })
          );
        }

        const results = await Promise.all(promises);

        if (loadGaucho) {
          setGauchoData(results[0]);
          log.info('Gaucho data loaded', { 
            keywords: results[0].keywords.length,
            domains: results[0].dominios.length 
          });
        }

        if (loadNordestino) {
          const nordestinoIndex = loadGaucho ? 1 : 0;
          setNordestinoData(results[nordestinoIndex]);
          log.info('Nordestino data loaded', { 
            keywords: results[nordestinoIndex].keywords.length,
            domains: results[nordestinoIndex].dominios.length 
          });
        }

        toast.success('Corpora carregados com sucesso');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        log.error('Error loading corpora', err as Error);
        setError(errorMsg);
        toast.error('Erro ao carregar corpora');
      } finally {
        setIsLoading(false);
      }
    };

    loadCorpora();
  }, [loadGaucho, loadNordestino, enrichedOnly, limit]);

  return {
    gauchoData,
    nordestinoData,
    isLoading,
    error
  };
}
