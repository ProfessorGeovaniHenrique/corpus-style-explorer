import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('useSemanticEnrichment');

interface LevelCoverage {
  1: number;
  2: number;
  3: number;
  4: number;
}

export function useSemanticEnrichment() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [levelCoverage, setLevelCoverage] = useState<LevelCoverage>({
    1: 100,
    2: 0,
    3: 0,
    4: 0,
  });

  /**
   * Verifica cobertura real de cada nível para uma música
   */
  const checkCoverage = useCallback(async (songId: string) => {
    try {
      log.info('Checking coverage', { songId });
      
      const { data, error } = await supabase
        .from('semantic_disambiguation_cache')
        .select('tagset_n1, tagset_n2, tagset_n3, tagset_n4')
        .eq('song_id', songId);

      if (error) throw error;
      if (!data || data.length === 0) {
        log.warn('No data found for coverage check', { songId });
        return;
      }

      const total = data.length;
      const levels = {
        1: data.filter(d => d.tagset_n1).length,
        2: data.filter(d => d.tagset_n2).length,
        3: data.filter(d => d.tagset_n3).length,
        4: data.filter(d => d.tagset_n4).length,
      };

      const coverage: LevelCoverage = {
        1: (levels[1] / total) * 100,
        2: (levels[2] / total) * 100,
        3: (levels[3] / total) * 100,
        4: (levels[4] / total) * 100,
      };

      setLevelCoverage(coverage);
      log.info('Coverage calculated', { songId, coverage });
    } catch (error) {
      log.error('Error checking coverage', error as Error);
      toast.error('Erro ao verificar cobertura de níveis');
    }
  }, []);

  /**
   * Enriquece palavras para um nível específico
   */
  const enrichToLevel = useCallback(async (songId: string, targetLevel: number) => {
    setIsEnriching(true);
    setProgress(0);

    try {
      log.info('Starting enrichment', { songId, targetLevel });
      toast.info(`Iniciando enriquecimento para Nível ${targetLevel}...`);

      // 1. Buscar palavras que precisam enriquecimento
      const { data: words, error: fetchError } = await supabase
        .from('semantic_disambiguation_cache')
        .select('palavra, tagset_codigo, tagset_n1')
        .eq('song_id', songId)
        .is(`tagset_n${targetLevel}`, null); // Palavras sem o nível alvo

      if (fetchError) throw fetchError;

      if (!words || words.length === 0) {
        toast.info(`Todas as palavras já possuem classificação N${targetLevel}`);
        setIsEnriching(false);
        return;
      }

      log.info('Words to enrich', { count: words.length, targetLevel });

      // 2. Preparar payload para enriquecimento
      const wordsToEnrich = words.map(w => ({
        palavra: w.palavra,
        tagset_n1: w.tagset_n1 || w.tagset_codigo.split('.')[0],
        contexto: '', // Contexto pode ser adicionado se necessário
      }));

      // 3. Chamar edge function de enriquecimento em batches de 20
      const BATCH_SIZE = 20;
      const batches = Math.ceil(wordsToEnrich.length / BATCH_SIZE);

      for (let i = 0; i < batches; i++) {
        const batch = wordsToEnrich.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        
        log.info('Enriching batch', { batch: i + 1, of: batches, words: batch.length });

        const { error: enrichError } = await supabase.functions.invoke('enrich-semantic-level', {
          body: { palavras: batch },
        });

        if (enrichError) {
          log.error('Batch enrichment error', enrichError);
          throw enrichError;
        }

        // Atualizar progresso
        const currentProgress = ((i + 1) / batches) * 100;
        setProgress(currentProgress);
      }

      // 4. Re-verificar cobertura
      await checkCoverage(songId);

      toast.success(`Enriquecimento N${targetLevel} concluído com sucesso!`);
      log.info('Enrichment completed', { songId, targetLevel });
    } catch (error) {
      log.error('Enrichment failed', error as Error);
      toast.error('Erro ao enriquecer dados semânticos');
    } finally {
      setIsEnriching(false);
      setProgress(0);
    }
  }, [checkCoverage]);

  return {
    isEnriching,
    progress,
    levelCoverage,
    checkCoverage,
    enrichToLevel,
  };
}
