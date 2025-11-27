import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Trash2, Database, Activity } from 'lucide-react';
import { useBatchSeedingExecution } from '@/hooks/useBatchSeedingExecution';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BatchSeedingControlProps {
  semanticLexiconCount: number;
  status: 'empty' | 'partial' | 'complete';
}

export function BatchSeedingControl({ semanticLexiconCount, status }: BatchSeedingControlProps) {
  const { isExecuting, logs, progress, executeBatchSeeding, clearLogs } = useBatchSeedingExecution();

  const getStatusConfig = () => {
    switch (status) {
      case 'empty':
        return { 
          label: '⚠️ Vazio', 
          variant: 'destructive' as const,
          description: 'Léxico semântico não inicializado' 
        };
      case 'partial':
        return { 
          label: '🟡 Parcial', 
          variant: 'secondary' as const,
          description: 'Léxico parcialmente populado' 
        };
      case 'complete':
        return { 
          label: '✅ Completo', 
          variant: 'default' as const,
          description: 'Léxico completamente populado' 
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Batch Seeding - Léxico Semântico
          </CardTitle>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Entradas no Léxico</p>
            <p className="text-2xl font-bold">{semanticLexiconCount.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Meta</p>
            <p className="text-2xl font-bold">2.000+</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Restantes</p>
            <p className="text-2xl font-bold text-muted-foreground">
              ~{Math.max(0, 2000 - semanticLexiconCount).toLocaleString()}
            </p>
          </div>
        </div>

        {isExecuting && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Activity className="h-4 w-4 animate-pulse text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Processamento em andamento</p>
              <p className="text-xs text-muted-foreground">
                Aplicando regras morfológicas e classificação Gemini batch
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Logs de Execução</p>
              <Button variant="ghost" size="sm" onClick={clearLogs}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[200px] rounded border p-3">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono">
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' '}
                    <span className={
                      log.type === 'error' ? 'text-destructive' :
                      log.type === 'success' ? 'text-green-600' :
                      log.type === 'warning' ? 'text-yellow-600' :
                      'text-foreground'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={isExecuting}
            >
              <Play className="h-4 w-4 mr-2" />
              {isExecuting ? 'Executando Batch Seeding...' : 'Executar Batch Seeding'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Batch Seeding</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Esta operação irá processar ~2.000 palavras de alta frequência do léxico 
                  Gutenberg e Dialectal, aplicando regras morfológicas e Gemini batch.
                </p>
                <p className="font-medium">
                  Tempo estimado: 15-20 minutos
                </p>
                <p className="text-destructive">
                  ⚠️ Esta operação consome créditos de API do Gemini
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={executeBatchSeeding}>
                Confirmar Execução
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
