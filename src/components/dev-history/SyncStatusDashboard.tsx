import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export function SyncStatusDashboard() {
  const { syncMetadata, triggerSync } = useSyncStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.loading('Sincronizando dados...', { id: 'sync' });
    
    try {
      const result = await triggerSync();
      
      if (result.success) {
        toast.success('Sincronização concluída!', { id: 'sync' });
      } else {
        toast.error('Erro na sincronização', { id: 'sync' });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const hasNeverSynced = !syncMetadata.lastSyncAt;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status de Sincronização
          </CardTitle>
          <Button onClick={handleSync} disabled={isSyncing} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar Agora
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            {hasNeverSynced ? (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            <div>
              <p className="font-medium">construction-log</p>
              <p className="text-sm text-muted-foreground">
                {syncMetadata.lastSyncAt 
                  ? formatDistanceToNow(syncMetadata.lastSyncAt, { addSuffix: true, locale: ptBR })
                  : 'Nunca sincronizado'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={hasNeverSynced ? 'secondary' : 'default'}>
              {syncMetadata.itemsSynced} itens
            </Badge>
            {syncMetadata.syncDurationMs > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {syncMetadata.syncDurationMs}ms
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}