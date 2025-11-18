import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SyncMetadata {
  lastSyncAt: Date | null;
  itemsSynced: number;
  syncDurationMs: number;
}

export function useSyncStatus() {
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata>({
    lastSyncAt: null,
    itemsSynced: 0,
    syncDurationMs: 0,
  });

  const fetchSyncMetadata = async () => {
    const { data } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('source', 'construction-log')
      .single();

    if (data) {
      setSyncMetadata({
        lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : null,
        itemsSynced: data.items_synced || 0,
        syncDurationMs: data.sync_duration_ms || 0,
      });
    }
  };

  const triggerSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-construction-log', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;
      console.log('✅ Sincronização manual concluída:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchSyncMetadata();

    // Realtime subscription para sync_metadata
    const channel = supabase
      .channel('sync_metadata_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sync_metadata' },
        () => {
          console.log('🔄 Metadata de sincronização atualizado!');
          fetchSyncMetadata();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    syncMetadata,
    triggerSync,
    refetch: fetchSyncMetadata,
  };
}