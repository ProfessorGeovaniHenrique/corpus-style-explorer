import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReprocessCriteria {
  includeNC: boolean;
  includeLowConfidence: boolean;
  confidenceThreshold?: number;
  includeGenericN1: boolean;
  artistId?: string;
}

interface ReprocessStats {
  total: number;
  nc: number;
  lowConfidence: number;
  genericN1: number;
}

interface ReprocessJob {
  id: string;
  status: string;
  criteria: any; // Json from database
  total_candidates: number;
  processed: number;
  improved: number;
  unchanged: number;
  failed: number;
  chunks_processed: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export function useSemanticReprocessing() {
  const [stats, setStats] = useState<ReprocessStats | null>(null);
  const [job, setJob] = useState<ReprocessJob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Analisar candidatos sem processar
  const analyzeCandidates = useCallback(async (criteria: ReprocessCriteria) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reprocess-unclassified', {
        body: { mode: 'analyze', criteria }
      });

      if (error) throw error;
      
      setStats(data.stats);
      toast.success(`${data.stats.total} palavras candidatas identificadas`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Erro ao analisar candidatos');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Iniciar reprocessamento
  const startReprocessing = useCallback(async (criteria: ReprocessCriteria) => {
    setIsReprocessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reprocess-unclassified', {
        body: { mode: 'reprocess', criteria }
      });

      if (error) throw error;

      toast.success('Reprocessamento iniciado');
      
      // Buscar job criado
      const { data: jobData } = await supabase
        .from('semantic_reprocess_jobs')
        .select('*')
        .eq('id', data.jobId)
        .single();

      if (jobData) {
        setJob(jobData);
      }
    } catch (error) {
      console.error('Reprocess error:', error);
      toast.error('Erro ao iniciar reprocessamento');
      setIsReprocessing(false);
    }
  }, []);

  // Cancelar reprocessamento
  const cancelReprocessing = useCallback(async () => {
    if (!job) return;

    try {
      await supabase
        .from('semantic_reprocess_jobs')
        .update({ status: 'cancelado' })
        .eq('id', job.id);

      toast.info('Reprocessamento cancelado');
      setJob(null);
      setIsReprocessing(false);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Erro ao cancelar');
    }
  }, [job]);

  // Monitorar progresso do job
  useEffect(() => {
    if (!job || job.status === 'concluido' || job.status === 'cancelado') {
      setIsReprocessing(false);
      return;
    }

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('semantic_reprocess_jobs')
        .select('*')
        .eq('id', job.id)
        .single();

      if (data) {
        setJob(data);
        
        if (data.status === 'concluido') {
          toast.success(
            `Reprocessamento concluído: ${data.improved} palavras melhoradas, ${data.unchanged} inalteradas`
          );
          setIsReprocessing(false);
        } else if (data.status === 'erro') {
          toast.error('Erro durante reprocessamento');
          setIsReprocessing(false);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [job]);

  return {
    stats,
    job,
    isAnalyzing,
    isReprocessing,
    analyzeCandidates,
    startReprocessing,
    cancelReprocessing,
  };
}
