import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('useSemanticAnnotationJob');

// SPRINT SEMANTIC-HEALTH-FIX: Constantes para detecção de jobs stuck
const STUCK_DETECTION_MINUTES = 10; // Considerar stuck após 10 min sem progresso
const MAX_AUTO_RESUME_RETRIES = 3;
const AUTO_RESUME_DELAY_MS = 5000; // 5 segundos entre tentativas

interface SemanticAnnotationJob {
  id: string;
  artist_id: string;
  artist_name: string;
  status: string;
  total_songs: number;
  total_words: number;
  processed_words: number;
  cached_words: number;
  new_words: number;
  current_song_index: number;
  current_word_index: number;
  chunk_size: number;
  chunks_processed: number;
  last_chunk_at: string | null;
  tempo_inicio: string;
  tempo_fim: string | null;
  erro_mensagem: string | null;
}

interface UseSemanticAnnotationJobResult {
  job: SemanticAnnotationJob | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  progress: number;
  eta: string | null;
  wordsPerSecond: number | null;
  startJob: (artistName: string) => Promise<string | null>;
  cancelPolling: () => void;
  resumeJob: (jobId: string, forceLock?: boolean) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  checkExistingJob: (artistName: string) => Promise<SemanticAnnotationJob | null>;
  checkRecentlyCompleted: (artistName: string) => Promise<SemanticAnnotationJob | null>;
  isResuming: boolean;
  // SPRINT SEMANTIC-HEALTH-FIX: Novos indicadores
  isStuck: boolean;
  minutesSinceLastActivity: number | null;
  needsAttention: boolean;
}

/**
 * Hook para gerenciar jobs de anotação semântica com polling e ETA
 * SPRINT SEMANTIC-HEALTH-FIX: Adicionado detecção de stuck e auto-resume
 */
export function useSemanticAnnotationJob(): UseSemanticAnnotationJobResult {
  const [job, setJob] = useState<SemanticAnnotationJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<number | null>(null);
  
  // SPRINT SEMANTIC-HEALTH-FIX: Estado para auto-resume
  const [autoResumeCount, setAutoResumeCount] = useState(0);
  const [isAutoResuming, setIsAutoResuming] = useState(false);
  const autoResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // FIX-REACT-QUEUE-BUG: Ref para resumeJob evitando closure stale
  const resumeJobRef = useRef<((jobId: string, forceLock?: boolean) => Promise<void>) | null>(null);

  const isProcessing = job?.status === 'iniciado' || job?.status === 'processando';
  const progress = job && job.total_words > 0 
    ? (job.processed_words / job.total_words) * 100 
    : 0;

  // SPRINT SEMANTIC-HEALTH-FIX: Calcular se job está stuck
  const minutesSinceLastActivity = job?.last_chunk_at 
    ? Math.round((Date.now() - new Date(job.last_chunk_at).getTime()) / 60000)
    : null;
  
  const isStuck = isProcessing && 
    minutesSinceLastActivity !== null && 
    minutesSinceLastActivity >= STUCK_DETECTION_MINUTES;
  
  const needsAttention = isStuck || (job?.status === 'pausado' && !job?.erro_mensagem?.includes('concluído'));

  // Calcular velocidade e ETA
  const calculateETA = useCallback((): { eta: string | null; wordsPerSecond: number | null } => {
    if (!job || !isProcessing) return { eta: null, wordsPerSecond: null };

    const startTime = new Date(job.tempo_inicio).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - startTime) / 1000;

    if (elapsedSeconds < 1 || job.processed_words === 0) {
      return { eta: null, wordsPerSecond: null };
    }

    const wordsPerSecond = job.processed_words / elapsedSeconds;
    const remainingWords = job.total_words - job.processed_words;
    const etaSeconds = remainingWords / wordsPerSecond;

    // Formatar ETA
    if (etaSeconds < 60) {
      return { eta: `~${Math.round(etaSeconds)}s`, wordsPerSecond };
    } else if (etaSeconds < 3600) {
      return { eta: `~${Math.round(etaSeconds / 60)}min`, wordsPerSecond };
    } else {
      const hours = Math.floor(etaSeconds / 3600);
      const mins = Math.round((etaSeconds % 3600) / 60);
      return { eta: `~${hours}h ${mins}min`, wordsPerSecond };
    }
  }, [job, isProcessing]);

  const { eta, wordsPerSecond } = calculateETA();

  /**
   * Iniciar novo job de anotação
   */
  const startJob = useCallback(async (artistName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      log.info('Starting annotation job', { artistName });

      const { data, error: invokeError } = await supabase.functions.invoke(
        'annotate-artist-songs',
        {
          body: { artistName }
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data.success || !data.jobId) {
        throw new Error(data.error || 'Erro ao iniciar job');
      }

      const jobId = data.jobId;
      log.info('Job started', { jobId, artistName });

      // Buscar job inicial
      await fetchJob(jobId);

      // Iniciar polling
      startPolling(jobId);

      return jobId;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      log.error('Error starting job', err as Error);
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buscar status do job
   */
  const fetchJob = useCallback(async (jobId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('semantic_annotation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setJob(data);

      // Se job terminou, parar polling
      if (data.status === 'concluido' || data.status === 'erro' || data.status === 'cancelado') {
        cancelPolling();
        log.info('Job finished', { jobId, status: data.status });
      }

    } catch (err) {
      log.error('Error fetching job', err as Error);
      setError(err instanceof Error ? err.message : 'Erro ao buscar job');
    }
  }, []);

  /**
   * Iniciar polling do job
   */
  const startPolling = useCallback((jobId: string) => {
    // Parar polling anterior se existir
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    // Polling a cada 2 segundos
    const intervalId = window.setInterval(() => {
      fetchJob(jobId);
    }, 2000);

    setPollingIntervalId(intervalId);
    log.info('Polling started', { jobId });
  }, [pollingIntervalId, fetchJob]);

  /**
   * Cancelar polling
   */
  const cancelPolling = useCallback(() => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
      log.info('Polling cancelled');
    }
  }, [pollingIntervalId]);
  
  /**
   * Verificar se há job existente para o artista (ativo ou recentemente concluído)
   */
  const checkExistingJob = useCallback(async (artistName: string): Promise<SemanticAnnotationJob | null> => {
    try {
      // Primeiro: buscar job ativo (processando/pausado)
      const { data: activeJob, error: activeError } = await supabase
        .from('semantic_annotation_jobs')
        .select('*')
        .eq('artist_name', artistName)
        .in('status', ['processando', 'pausado'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeError && activeError.code !== 'PGRST116') {
        throw activeError;
      }
      
      if (activeJob) return activeJob;
      
      return null;
    } catch (err) {
      log.error('Error checking existing job', err as Error);
      return null;
    }
  }, []);
  
  /**
   * Verificar se artista foi anotado recentemente (últimos 7 dias)
   */
  const checkRecentlyCompleted = useCallback(async (artistName: string): Promise<SemanticAnnotationJob | null> => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('semantic_annotation_jobs')
        .select('*')
        .eq('artist_name', artistName)
        .eq('status', 'concluido')
        .gte('tempo_fim', sevenDaysAgo)
        .order('tempo_fim', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || null;
    } catch (err) {
      log.error('Error checking recently completed job', err as Error);
      return null;
    }
  }, []);
  
  /**
   * Retomar job pausado
   * SPRINT SEMANTIC-HEALTH-FIX: Adicionado forceLock para jobs stuck
   */
  const resumeJob = useCallback(async (jobId: string, forceLock = false): Promise<void> => {
    if (isResuming || isAutoResuming) return; // Prevenir cliques múltiplos
    setIsResuming(true);
    
    try {
      log.info('Resuming job', { jobId, forceLock });
      
      // Buscar job para obter posição atual
      const { data: jobData, error: fetchError } = await supabase
        .from('semantic_annotation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (fetchError || !jobData) {
        throw new Error('Job não encontrado');
      }
      
      // SPRINT SEMANTIC-HEALTH-FIX: Reset last_chunk_at mais antigo para forceLock
      const resetTime = forceLock 
        ? new Date(Date.now() - 2 * 60000).toISOString() // 2 minutos atrás para forçar lock
        : new Date(Date.now() - 60000).toISOString(); // 1 minuto atrás normal
      
      await supabase
        .from('semantic_annotation_jobs')
        .update({ 
          status: 'processando', 
          last_chunk_at: resetTime,
          erro_mensagem: null // Limpar mensagem de erro anterior
        })
        .eq('id', jobId);
      
      setJob({ ...jobData, status: 'processando', erro_mensagem: null });
      
      // CRÍTICO: Invocar Edge Function para continuar processamento
      const { data, error: invokeError } = await supabase.functions.invoke(
        'annotate-artist-songs',
        {
          body: { 
            jobId,
            continueFrom: {
              songIndex: jobData.current_song_index,
              wordIndex: jobData.current_word_index,
            }
          }
        }
      );
      
      if (invokeError) {
        log.warn('Erro ao invocar Edge Function', { error: invokeError.message });
        // Não lançar erro - o polling vai detectar o status
      }
      
      // Iniciar polling
      startPolling(jobId);
      
      // Reset auto-resume counter on manual resume
      setAutoResumeCount(0);
      
      log.info('Job resumed and Edge Function invoked', { jobId, forceLock });
    } catch (err) {
      log.error('Error resuming job', err as Error);
      setError(err instanceof Error ? err.message : 'Erro ao retomar job');
    } finally {
      setIsResuming(false);
    }
  }, [isResuming, isAutoResuming, startPolling]);
  
  /**
   * Cancelar job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<void> => {
    try {
      log.info('Cancelling job', { jobId });
      
      await supabase
        .from('semantic_annotation_jobs')
        .update({ 
          status: 'cancelado',
          tempo_fim: new Date().toISOString()
        })
        .eq('id', jobId);
      
      cancelPolling();
      setJob(null);
      
      log.info('Job cancelled', { jobId });
    } catch (err) {
      log.error('Error cancelling job', err as Error);
      setError(err instanceof Error ? err.message : 'Erro ao cancelar job');
    }
  }, [cancelPolling]);

  // FIX-REACT-QUEUE-BUG: Atualizar ref quando resumeJob mudar
  useEffect(() => {
    resumeJobRef.current = resumeJob;
  }, [resumeJob]);

  // FIX-REACT-QUEUE-BUG: Auto-restore ao montar - usando async/await direto
  useEffect(() => {
    const savedJobId = localStorage.getItem('active-annotation-job-id');
    if (!savedJobId) return;
    
    const restoreJob = async () => {
      log.info('Restaurando job salvo', { jobId: savedJobId });
      
      const { data, error } = await supabase
        .from('semantic_annotation_jobs')
        .select('*')
        .eq('id', savedJobId)
        .single();
      
      if (error || !data) {
        log.warn('Job salvo não encontrado, removendo do localStorage');
        localStorage.removeItem('active-annotation-job-id');
        return;
      }
      
      setJob(data);
      
      if (data.status === 'processando' || data.status === 'pausado') {
        startPolling(savedJobId);
      }
    };
    
    restoreJob();
  }, [startPolling]);

  // FIX-REACT-QUEUE-BUG: Auto-resume para jobs stuck - SEM resumeJob nas deps
  useEffect(() => {
    // Limpar timeout anterior
    if (autoResumeTimeoutRef.current) {
      clearTimeout(autoResumeTimeoutRef.current);
      autoResumeTimeoutRef.current = null;
    }
    
    // Condições para auto-resume:
    // 1. Job está stuck (processando sem progresso por 10+ min)
    // 2. Não está já retomando
    // 3. Não excedeu limite de tentativas
    const jobId = job?.id;
    if (!isStuck || isResuming || isAutoResuming || autoResumeCount >= MAX_AUTO_RESUME_RETRIES || !jobId) {
      return;
    }
    
    log.info('Job está stuck, iniciando auto-resume', { 
      jobId, 
      minutesSinceLastActivity,
      attempt: autoResumeCount + 1 
    });
    
    autoResumeTimeoutRef.current = setTimeout(async () => {
      setIsAutoResuming(true);
      setAutoResumeCount(prev => prev + 1);
      
      try {
        // FIX-REACT-QUEUE-BUG: Usar ref para evitar closure stale
        if (resumeJobRef.current) {
          await resumeJobRef.current(jobId, true);
          log.info('Auto-resume bem-sucedido', { jobId });
        }
      } catch (err) {
        log.error('Auto-resume falhou', err as Error);
      } finally {
        setIsAutoResuming(false);
      }
    }, AUTO_RESUME_DELAY_MS);
    
    return () => {
      if (autoResumeTimeoutRef.current) {
        clearTimeout(autoResumeTimeoutRef.current);
      }
    };
  }, [isStuck, isResuming, isAutoResuming, autoResumeCount, job?.id, minutesSinceLastActivity]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      if (autoResumeTimeoutRef.current) {
        clearTimeout(autoResumeTimeoutRef.current);
      }
    };
  }, [pollingIntervalId]);

  return {
    job,
    isLoading,
    isProcessing,
    error,
    progress,
    eta,
    wordsPerSecond,
    startJob,
    cancelPolling,
    resumeJob,
    cancelJob,
    checkExistingJob,
    checkRecentlyCompleted,
    isResuming,
    // SPRINT SEMANTIC-HEALTH-FIX: Novos indicadores
    isStuck,
    minutesSinceLastActivity,
    needsAttention,
  };
}
