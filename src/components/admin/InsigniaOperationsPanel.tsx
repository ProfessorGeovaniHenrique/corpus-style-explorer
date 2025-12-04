import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, PlayCircle, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDetectConflicts } from '@/hooks/useInsigniaAnalysis';
import { useQueryClient } from '@tanstack/react-query';

interface OperationLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export function InsigniaOperationsPanel() {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const queryClient = useQueryClient();
  const detectConflicts = useDetectConflicts();

  const addLog = (message: string, type: OperationLog['type'] = 'info') => {
    setLogs(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      message, 
      type 
    }]);
  };

  const clearLogs = () => setLogs([]);

  const handleBackfill = async () => {
    setIsBackfilling(true);
    setProgress(0);
    clearLogs();
    addLog('Iniciando backfill de insígnias...', 'info');

    try {
      // First analyze
      const analyzeResponse = await supabase.functions.invoke('backfill-insignia-attribution', {
        body: { mode: 'analyze' },
      });

      if (analyzeResponse.error) throw analyzeResponse.error;
      
      const { to_process } = analyzeResponse.data;
      addLog(`${to_process} entradas a processar`, 'info');

      if (to_process === 0) {
        addLog('Nenhuma entrada para processar', 'success');
        return;
      }

      // Execute backfill
      setProgress(30);
      const backfillResponse = await supabase.functions.invoke('backfill-insignia-attribution', {
        body: { mode: 'backfill' },
      });

      if (backfillResponse.error) throw backfillResponse.error;

      setProgress(100);
      addLog(`Backfill concluído: ${backfillResponse.data.processed} entradas`, 'success');
      toast.success('Backfill concluído');
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
    } catch (error: any) {
      addLog(`Erro: ${error.message}`, 'error');
      toast.error(`Erro no backfill: ${error.message}`);
    } finally {
      setIsBackfilling(false);
    }
  };

  const handleReprocess = async () => {
    setIsReprocessing(true);
    setProgress(0);
    clearLogs();
    addLog('Iniciando reprocessamento...', 'info');

    try {
      // First analyze
      const analyzeResponse = await supabase.functions.invoke('reprocess-insignias', {
        body: { mode: 'analyze' },
      });

      if (analyzeResponse.error) throw analyzeResponse.error;
      
      const { without_insignias } = analyzeResponse.data;
      addLog(`${without_insignias} entradas sem insígnias`, 'info');

      if (without_insignias === 0) {
        addLog('Todas as entradas já possuem insígnias', 'success');
        return;
      }

      // Execute reprocess
      setProgress(30);
      const reprocessResponse = await supabase.functions.invoke('reprocess-insignias', {
        body: { mode: 'reprocess', batch_size: 500 },
      });

      if (reprocessResponse.error) throw reprocessResponse.error;

      setProgress(100);
      addLog(`Reprocessamento concluído: ${reprocessResponse.data.processed} entradas`, 'success');
      toast.success('Reprocessamento concluído');
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
    } catch (error: any) {
      addLog(`Erro: ${error.message}`, 'error');
      toast.error(`Erro no reprocessamento: ${error.message}`);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDetectConflicts = async () => {
    addLog('Detectando conflitos...', 'info');
    try {
      const result = await detectConflicts.mutateAsync();
      addLog(`${result.total_conflicts} conflitos detectados`, result.total_conflicts > 0 ? 'warning' : 'success');
      
      if (result.total_conflicts > 0) {
        toast.warning(`${result.total_conflicts} conflitos encontrados`);
      } else {
        toast.success('Nenhum conflito detectado');
      }
    } catch (error: any) {
      addLog(`Erro: ${error.message}`, 'error');
    }
  };

  const handleCleanIncorrect = async () => {
    setIsCleaning(true);
    clearLogs();
    addLog('Limpando insígnias incorretas...', 'info');

    try {
      // First detect conflicts
      const result = await detectConflicts.mutateAsync();
      
      if (result.total_conflicts === 0) {
        addLog('Nenhum conflito para limpar', 'success');
        return;
      }

      // Clean conflicts by removing incorrect insignias
      const conflictIds = result.conflicts.map((c: any) => c.id);
      
      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({ insignias_culturais: [] })
        .in('id', conflictIds);

      if (error) throw error;

      addLog(`${conflictIds.length} entradas limpas`, 'success');
      toast.success(`${conflictIds.length} insígnias incorretas removidas`);
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
    } catch (error: any) {
      addLog(`Erro: ${error.message}`, 'error');
      toast.error(`Erro na limpeza: ${error.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const isOperating = isBackfilling || isReprocessing || isCleaning || detectConflicts.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Operações de Insígnias
        </CardTitle>
        <CardDescription>
          Execute operações em massa para gerenciar insígnias culturais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={handleBackfill} 
            disabled={isOperating}
            variant="default"
            className="flex items-center gap-2"
          >
            {isBackfilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Backfill
          </Button>
          
          <Button 
            onClick={handleReprocess} 
            disabled={isOperating}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {isReprocessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reprocessar
          </Button>
          
          <Button 
            onClick={handleDetectConflicts} 
            disabled={isOperating}
            variant="outline"
            className="flex items-center gap-2"
          >
            {detectConflicts.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Detectar Conflitos
          </Button>
          
          <Button 
            onClick={handleCleanIncorrect} 
            disabled={isOperating}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isCleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Limpar Incorretas
          </Button>
        </div>

        {/* Progress Bar */}
        {isOperating && progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress}% concluído</p>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Log de Execução</span>
              <Button variant="ghost" size="sm" onClick={clearLogs}>
                Limpar
              </Button>
            </div>
            <ScrollArea className="h-32 rounded-md border p-2">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground">[{log.timestamp}]</span>
                    {log.type === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />}
                    {log.type === 'error' && <AlertTriangle className="h-3 w-3 text-destructive mt-0.5" />}
                    {log.type === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />}
                    <span className={
                      log.type === 'error' ? 'text-destructive' : 
                      log.type === 'success' ? 'text-green-600' :
                      log.type === 'warning' ? 'text-yellow-600' : ''
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
