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
    
    addLog('🚀 Iniciando batch seeding do léxico semântico...', 'info');

    try {
      // Invoke edge function com parâmetros corretos
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

      // Parse resposta correta da edge function
      if (data.mode === 'processing') {
        addLog(`✅ Chunk processado: ${data.chunk_processed} palavras`, 'success');
        addLog(`📊 Morfológico: ${data.results.morfologico}, Herança: ${data.results.heranca}, Gemini: ${data.results.gemini}`, 'info');
        if (data.results.failed > 0) {
          addLog(`⚠️ Falhas: ${data.results.failed}`, 'warning');
        }
        
        // Iniciar polling de progresso
        pollJobProgress();
      } else if (data.mode === 'complete') {
        addLog('✅ Batch seeding concluído!', 'success');
        setProgress(100);
        toast.success('Batch seeding concluído com sucesso');
        setIsExecuting(false);
      }

    } catch (error) {
      console.error('Batch seeding error:', error);
      addLog(`❌ Erro fatal: ${error}`, 'error');
      setIsExecuting(false);
    }
  };

  const pollJobProgress = async () => {
    let previousCount = 0;
    
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
        
        // Só loga se houve mudança
        if (currentCount !== previousCount) {
          const delta = currentCount - previousCount;
          addLog(`📈 Progresso: ${currentCount}/${estimatedTotal} palavras (+${delta})`, 'info');
          previousCount = currentCount;
        }

        // Considera completo quando atingir 95% ou mais (2000 palavras)
        if (newProgress >= 95) {
          clearInterval(pollInterval);
          addLog('✅ Batch seeding concluído com sucesso!', 'success');
          toast.success(`Batch seeding concluído: ${currentCount} palavras processadas`);
          setIsExecuting(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
        addLog('❌ Erro ao monitorar progresso', 'error');
        setIsExecuting(false);
      }
    }, 5000); // Poll every 5s

    // Auto-stop after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isExecuting) {
        addLog('⏱️ Timeout: processo excedeu 30 minutos', 'warning');
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
