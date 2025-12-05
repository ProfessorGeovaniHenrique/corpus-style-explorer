import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SemanticRefinementJob {
  id: string;
  status: 'pendente' | 'processando' | 'pausado' | 'concluido' | 'erro' | 'cancelado';
  domain_filter: 'MG' | 'DS' | null;
  model: 'gemini' | 'gpt5';
  total_words: number;
  processed: number;
  refined: number;
  errors: number;
  current_offset: number;
  last_chunk_at: string | null;
  tempo_inicio: string | null;
  tempo_fim: string | null;
  is_cancelling: boolean;
  created_at: string;
}

export function useSemanticRefinementJob() {
  const [activeJob, setActiveJob] = useState<SemanticRefinementJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active job on mount
  const fetchActiveJob = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('semantic_refinement_jobs')
        .select('*')
        .in('status', ['pendente', 'processando', 'pausado'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveJob(data as SemanticRefinementJob | null);
    } catch (error) {
      console.error('[useSemanticRefinementJob] Error fetching job:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveJob();
  }, [fetchActiveJob]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!activeJob?.id) return;

    const channel = supabase
      .channel(`refinement-job-${activeJob.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'semantic_refinement_jobs',
          filter: `id=eq.${activeJob.id}`,
        },
        (payload) => {
          setActiveJob(payload.new as SemanticRefinementJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJob?.id]);

  // Start new job
  const startJob = useCallback(async (
    domain_filter: 'MG' | 'DS' | null,
    model: 'gemini' | 'gpt5' = 'gemini'
  ) => {
    try {
      setIsLoading(true);

      // Count words first
      let countQuery = supabase
        .from('semantic_disambiguation_cache')
        .select('id', { count: 'exact', head: true })
        .is('tagset_n2', null)
        .neq('tagset_codigo', 'NC');

      if (domain_filter === 'MG') {
        countQuery = countQuery.eq('tagset_codigo', 'MG');
      } else if (domain_filter === 'DS') {
        countQuery = countQuery.neq('tagset_codigo', 'MG');
      }

      const { count } = await countQuery;

      if (!count || count === 0) {
        toast.info('Nenhuma palavra N1 para refinar');
        return;
      }

      // Cancel existing jobs
      await supabase
        .from('semantic_refinement_jobs')
        .update({ status: 'cancelado', is_cancelling: true })
        .in('status', ['pendente', 'processando', 'pausado']);

      // Create new job
      const { data: newJob, error } = await supabase
        .from('semantic_refinement_jobs')
        .insert({
          domain_filter,
          model,
          total_words: count,
          status: 'processando',
          tempo_inicio: new Date().toISOString(),
          last_chunk_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setActiveJob(newJob as SemanticRefinementJob);
      toast.success(`Iniciando refinamento de ${count.toLocaleString()} palavras`);

      // Trigger first chunk
      const response = await supabase.functions.invoke('refine-domain-batch', {
        body: { jobId: newJob.id },
      });

      if (response.error) {
        console.error('[useSemanticRefinementJob] Start error:', response.error);
      }

    } catch (error) {
      console.error('[useSemanticRefinementJob] Error starting job:', error);
      toast.error('Erro ao iniciar refinamento');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pause job
  const pauseJob = useCallback(async () => {
    if (!activeJob?.id) return;

    try {
      const { error } = await supabase
        .from('semantic_refinement_jobs')
        .update({ status: 'pausado' })
        .eq('id', activeJob.id);

      if (error) throw error;
      
      setActiveJob(prev => prev ? { ...prev, status: 'pausado' } : null);
      toast.info('Refinamento pausado');
    } catch (error) {
      console.error('[useSemanticRefinementJob] Error pausing:', error);
      toast.error('Erro ao pausar');
    }
  }, [activeJob?.id]);

  // Resume job
  const resumeJob = useCallback(async () => {
    if (!activeJob?.id) return;

    try {
      const { error } = await supabase
        .from('semantic_refinement_jobs')
        .update({ 
          status: 'processando',
          last_chunk_at: new Date().toISOString(),
        })
        .eq('id', activeJob.id);

      if (error) throw error;

      setActiveJob(prev => prev ? { ...prev, status: 'processando' } : null);
      toast.success('Refinamento retomado');

      // Trigger next chunk
      await supabase.functions.invoke('refine-domain-batch', {
        body: { jobId: activeJob.id },
      });
    } catch (error) {
      console.error('[useSemanticRefinementJob] Error resuming:', error);
      toast.error('Erro ao retomar');
    }
  }, [activeJob?.id]);

  // Cancel job
  const cancelJob = useCallback(async () => {
    if (!activeJob?.id) return;

    try {
      const { error } = await supabase
        .from('semantic_refinement_jobs')
        .update({ 
          status: 'cancelado',
          is_cancelling: true,
          tempo_fim: new Date().toISOString(),
        })
        .eq('id', activeJob.id);

      if (error) throw error;

      setActiveJob(null);
      toast.info('Refinamento cancelado');
    } catch (error) {
      console.error('[useSemanticRefinementJob] Error cancelling:', error);
      toast.error('Erro ao cancelar');
    }
  }, [activeJob?.id]);

  // Calculate progress
  const progress = activeJob 
    ? Math.min(100, Math.round((activeJob.processed / activeJob.total_words) * 100))
    : 0;

  // Calculate ETA
  const calculateEta = useCallback(() => {
    if (!activeJob || activeJob.processed === 0 || activeJob.status !== 'processando') {
      return null;
    }

    const elapsed = activeJob.tempo_inicio 
      ? Date.now() - new Date(activeJob.tempo_inicio).getTime()
      : 0;
    
    const rate = activeJob.processed / (elapsed / 1000); // words per second
    const remaining = activeJob.total_words - activeJob.processed;
    const etaSeconds = remaining / rate;

    if (etaSeconds < 60) return 'menos de 1 minuto';
    if (etaSeconds < 3600) return `~${Math.ceil(etaSeconds / 60)} minutos`;
    return `~${Math.ceil(etaSeconds / 3600)} horas`;
  }, [activeJob]);

  return {
    activeJob,
    isLoading,
    progress,
    eta: calculateEta(),
    startJob,
    pauseJob,
    resumeJob,
    cancelJob,
    refetch: fetchActiveJob,
  };
}
