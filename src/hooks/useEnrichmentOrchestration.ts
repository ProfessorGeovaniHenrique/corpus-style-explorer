/**
 * Hook para gerenciar orquestração de enriquecimento por corpus
 * Sprint AUD-P3: Batch Execution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('useEnrichmentOrchestration');

export interface CorpusStatus {
  id: string;
  name: string;
  type: string;
  pendingCount: number;
  isCompleted: boolean;
  isActive: boolean;
  songsProcessed: number;
  songsFailed: number;
}

export interface OrchestrationState {
  isRunning: boolean;
  currentCorpusIndex: number;
  currentCorpusId: string | null;
  currentCorpusName: string | null;
  currentJobId: string | null;
  completedCorpora: string[];
  totalProcessed: number;
  totalFailed: number;
  startedAt: string | null;
  lastActivity: string | null;
}

export interface OrchestrationData {
  state: OrchestrationState;
  corpora: CorpusStatus[];
  orphansCleaned: number;
}

// FIX: Polling intervals mais conservadores
const POLL_INTERVAL_ACTIVE = 5000;  // 5 segundos quando ativo
const POLL_INTERVAL_IDLE = 15000;   // 15 segundos quando ocioso
const REALTIME_DEBOUNCE_MS = 2000;  // Debounce de 2s para updates realtime

export function useEnrichmentOrchestration() {
  const [data, setData] = useState<OrchestrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Buscar status da orquestração (com proteção contra chamadas simultâneas)
  const fetchStatus = useCallback(async () => {
    // Evitar chamadas simultâneas
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'orchestrate-corpus-enrichment',
        { body: { action: 'status' } }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar status');
      }

      // Atualizar ref de isRunning para polling dinâmico
      isRunningRef.current = result.state.isRunning;

      setData({
        state: result.state,
        corpora: result.corpora,
        orphansCleaned: result.orphansCleaned,
      });
      setError(null);
    } catch (err) {
      log.error('Error fetching status', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Iniciar processamento
  const start = useCallback(async (corpusId?: string, jobType: 'metadata' | 'youtube' | 'full' = 'metadata') => {
    setIsStarting(true);
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'orchestrate-corpus-enrichment',
        { 
          body: { 
            action: 'start',
            corpusId,
            jobType,
          } 
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!result.success) {
        toast.error(result.error || 'Erro ao iniciar');
        return false;
      }

      toast.success(result.message || 'Processamento iniciado!');
      await fetchStatus();
      return true;
    } catch (err) {
      log.error('Error starting', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar');
      return false;
    } finally {
      setIsStarting(false);
    }
  }, [fetchStatus]);

  // Parar processamento
  const stop = useCallback(async () => {
    setIsStopping(true);
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'orchestrate-corpus-enrichment',
        { body: { action: 'stop' } }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!result.success) {
        toast.error(result.error || 'Erro ao parar');
        return false;
      }

      toast.info(result.message || 'Processamento parado');
      await fetchStatus();
      return true;
    } catch (err) {
      log.error('Error stopping', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao parar');
      return false;
    } finally {
      setIsStopping(false);
    }
  }, [fetchStatus]);

  // Pular corpus atual
  const skip = useCallback(async (jobType: 'metadata' | 'youtube' | 'full' = 'metadata') => {
    setIsSkipping(true);
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'orchestrate-corpus-enrichment',
        { body: { action: 'skip', jobType } }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!result.success) {
        toast.error(result.error || 'Erro ao pular');
        return false;
      }

      toast.info(result.message || 'Corpus pulado');
      await fetchStatus();
      return true;
    } catch (err) {
      log.error('Error skipping', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao pular');
      return false;
    } finally {
      setIsSkipping(false);
    }
  }, [fetchStatus]);

  // Limpar jobs órfãos
  const cleanup = useCallback(async () => {
    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'orchestrate-corpus-enrichment',
        { body: { action: 'cleanup' } }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (result.orphansCleaned > 0) {
        toast.success(`${result.orphansCleaned} jobs órfãos limpos`);
      } else {
        toast.info('Nenhum job órfão encontrado');
      }

      await fetchStatus();
      return result.orphansCleaned;
    } catch (err) {
      log.error('Error cleaning up', err);
      toast.error(err instanceof Error ? err.message : 'Erro na limpeza');
      return 0;
    }
  }, [fetchStatus]);

  // Setup inicial e cleanup
  useEffect(() => {
    // Fetch inicial
    fetchStatus();
    
    // Polling dinâmico com intervalo baseado em ref (evita loop de dependências)
    const setupPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      const interval = isRunningRef.current ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
      pollIntervalRef.current = setInterval(() => {
        fetchStatus();
        // Ajustar intervalo se estado mudou
        const newInterval = isRunningRef.current ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
        if (newInterval !== interval) {
          setupPolling();
        }
      }, interval);
    };
    
    setupPolling();
    
    // Subscription realtime com debounce para evitar sobrecarga
    channelRef.current = supabase
      .channel('enrichment-orchestration-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrichment_jobs' },
        () => {
          // Debounce realtime updates
          if (realtimeDebounceRef.current) {
            clearTimeout(realtimeDebounceRef.current);
          }
          realtimeDebounceRef.current = setTimeout(() => {
            log.debug('Realtime update - refetching orchestration status');
            fetchStatus();
          }, REALTIME_DEBOUNCE_MS);
        }
      )
      .subscribe();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchStatus]);

  // Calcular métricas
  const totalPending = data?.corpora.reduce((sum, c) => sum + c.pendingCount, 0) || 0;
  const totalCompleted = data?.corpora.filter(c => c.isCompleted).length || 0;
  const progress = data?.state.isRunning && data.state.totalProcessed > 0
    ? Math.round((data.state.totalProcessed / (data.state.totalProcessed + totalPending)) * 100)
    : 0;

  // Calcular ETA
  const calculateETA = useCallback(() => {
    if (!data?.state.isRunning || !data.state.startedAt || data.state.totalProcessed === 0) {
      return null;
    }

    const elapsedMs = Date.now() - new Date(data.state.startedAt).getTime();
    const rate = data.state.totalProcessed / (elapsedMs / 1000); // songs per second
    const remaining = totalPending;
    const etaSeconds = remaining / rate;

    return {
      rate: rate * 60, // songs per minute
      remainingMinutes: Math.round(etaSeconds / 60),
      remainingHours: Math.round(etaSeconds / 3600 * 10) / 10,
    };
  }, [data, totalPending]);

  return {
    // Estado
    data,
    isLoading,
    error,

    // Flags de ação
    isStarting,
    isStopping,
    isSkipping,

    // Métricas
    totalPending,
    totalCompleted,
    progress,
    eta: calculateETA(),

    // Ações
    start,
    stop,
    skip,
    cleanup,
    refetch: fetchStatus,
  };
}
