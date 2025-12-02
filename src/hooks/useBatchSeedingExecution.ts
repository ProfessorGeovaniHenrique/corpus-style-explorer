import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BatchSeedingLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export function useBatchSeedingExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<BatchSeedingLog[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Refs para controle de intervalos - evita memory leaks
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const addLog = (message: string, type: BatchSeedingLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      message,
      type
    }]);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const executeBatchSeeding = async () => {
    setIsExecuting(true);
    setLogs([]);
    setProgress(0);
    
    addLog('🚀 Iniciando batch seeding do léxico semântico...', 'info');

    try {
      const { data, error } = await supabase.functions.invoke('batch-seed-semantic-lexicon', {
        body: {
          mode: 'seed',
          limit: 50,
          offset: 0,
          source: 'all'
        }
      });

      if (error) {
        addLog(`❌ Erro ao executar batch seeding: ${error.message}`, 'error');
        toast.error('Erro ao executar batch seeding');
        throw error;
      }

      if (data.mode === 'processing') {
        addLog(`✅ Chunk processado: ${data.chunk_processed} palavras`, 'success');
        addLog(`📊 Status: Gemini: ${data.stats?.gemini || 0}, Regras: ${data.stats?.morfologico || 0}, Herança: ${data.stats?.heranca || 0}`, 'info');
        
        if (data.has_more) {
          addLog(`⏳ Continuação agendada: offset ${data.next_offset}`, 'info');
          pollJobProgress();
        } else {
          addLog('✅ Batch seeding concluído!', 'success');
          toast.success('Batch seeding concluído');
          setIsExecuting(false);
        }
      } else if (data.mode === 'completed') {
        addLog('✅ Batch seeding já estava completo', 'success');
        setProgress(100);
        setIsExecuting(false);
      } else {
        addLog(`📋 Modo: ${data.mode}`, 'info');
        if (data.candidates) {
          addLog(`📈 Candidatos encontrados: ${data.candidates}`, 'info');
        }
      }

    } catch (error) {
      console.error('Batch seeding error:', error);
      setIsExecuting(false);
    }
  };

  const pollJobProgress = async () => {
    let previousCount = 0;
    
    // Limpar intervalos anteriores
    stopPolling();
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { count: lexiconCount, error } = await supabase
          .from('semantic_lexicon')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        const currentCount = lexiconCount || 0;
        const estimatedTotal = 2000;
        const newProgress = Math.min((currentCount / estimatedTotal) * 100, 100);
        
        setProgress(newProgress);
        
        if (currentCount !== previousCount) {
          const delta = currentCount - previousCount;
          addLog(`📈 Progresso: ${currentCount}/${estimatedTotal} palavras (+${delta})`, 'info');
          previousCount = currentCount;
        }

        if (newProgress >= 95) {
          stopPolling();
          addLog('✅ Batch seeding concluído com sucesso!', 'success');
          toast.success(`Batch seeding concluído: ${currentCount} palavras processadas`);
          setIsExecuting(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        stopPolling();
        addLog('❌ Erro ao monitorar progresso', 'error');
        setIsExecuting(false);
      }
    }, 5000);

    // Auto-stop after 30 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      addLog('⏱️ Timeout: processo excedeu 30 minutos', 'warning');
      setIsExecuting(false);
    }, 30 * 60 * 1000);
  };

  const clearLogs = () => {
    setLogs([]);
    setProgress(0);
  };

  return {
    isExecuting,
    logs,
    progress,
    executeBatchSeeding,
    clearLogs
  };
}
