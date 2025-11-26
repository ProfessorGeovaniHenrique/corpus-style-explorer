/**
 * ⚠️ DEPRECATED - Use useCorpusData instead
 * 
 * Este hook ainda usa dados mockup.
 * Migre para useCorpusData que busca dados reais do banco.
 */

import { useState, useEffect } from 'react';
import { getCorpusAnalysisResults, CorpusAnalysisResult } from '@/services/corpusDataService';
import { toast } from 'sonner';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('useCorpusComparison');

/**
 * @deprecated Use useCorpusData({ loadGaucho: true, loadNordestino: true })
 */
export function useCorpusComparison() {
  log.warn('DEPRECATED: useCorpusComparison is deprecated. Use useCorpusData instead.');

  const [gauchoData, setGauchoData] = useState<CorpusAnalysisResult | null>(null);
  const [nordestinoData, setNordestinoData] = useState<CorpusAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadCorpora = async () => {
      setIsLoading(true);
      try {
        log.info('Loading corpora from real database');

        // Corpus Gaúcho - dados reais
        const gaucho = await getCorpusAnalysisResults('gaucho', { limit: 1000 });
        setGauchoData(gaucho);
        
        // Corpus Nordestino - dados reais
        const nordestino = await getCorpusAnalysisResults('nordestino', { limit: 1000 });
        setNordestinoData(nordestino);
        
        toast.success('Corpora carregados com sucesso');
      } catch (error) {
        log.error('Error loading corpora', error as Error);
        toast.error('Erro ao carregar corpora para comparação');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCorpora();
  }, []);
  
  return {
    gauchoData,
    nordestinoData,
    isLoading
  };
}
