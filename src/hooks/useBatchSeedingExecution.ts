import { useState } from 'react';
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

  const addLog = (message: string, type: BatchSeedingLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      message,
      type
    }]);
  };

  const executeBatchSeeding = async () => {
    setIsExecuting(true);
    setLogs([]);
    setProgress(0);
    
    addLog('Iniciando batch seeding do léxico semântico...', 'info');

    try {
      // Invoke edge function
      const { data, error } = await supabase.functions.invoke('batch-seed-semantic-lexicon', {
        body: {
          wave: 1, // Start with wave 1
          chunkSize: 50
        }
      });

      if (error) {
        addLog(`Erro ao executar batch seeding: ${error.message}`, 'error');
        toast.error('Erro ao executar batch seeding');
        throw error;
      }

      addLog(`Batch seeding iniciado: ${data.message}`, 'success');
      
      // Start polling for progress
      const jobId = data.jobId;
      if (jobId) {
        pollJobProgress(jobId);
      } else {
        setProgress(100);
        addLog('Batch seeding concluído', 'success');
        toast.success('Batch seeding concluído com sucesso');
        setIsExecuting(false);
      }

    } catch (error) {
      console.error('Batch seeding error:', error);
      addLog(`Erro fatal: ${error}`, 'error');
      setIsExecuting(false);
    }
  };

  const pollJobProgress = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { count: lexiconCount, error } = await supabase
          .from('semantic_lexicon')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        const currentCount = lexiconCount || 0;
        const estimatedTotal = 2000;
        const newProgress = Math.min((currentCount / estimatedTotal) * 100, 100);
        
        setProgress(newProgress);
        addLog(`Progresso: ${currentCount}/${estimatedTotal} palavras processadas`, 'info');

        if (newProgress >= 100) {
          clearInterval(pollInterval);
          addLog('Batch seeding concluído com sucesso!', 'success');
          toast.success('Batch seeding concluído');
          setIsExecuting(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
        addLog('Erro ao monitorar progresso', 'error');
        setIsExecuting(false);
      }
    }, 5000); // Poll every 5s

    // Auto-stop after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isExecuting) {
        addLog('Timeout: processo excedeu 30 minutos', 'warning');
        setIsExecuting(false);
      }
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
