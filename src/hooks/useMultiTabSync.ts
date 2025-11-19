import { useEffect, useCallback, useRef } from 'react';
import { EnrichmentSession } from '@/lib/enrichmentSchemas';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const CHANNEL_NAME = 'enrichment_sync';

type SyncMessage = {
  type: 'session_updated' | 'session_cleared' | 'request_sync';
  data?: EnrichmentSession;
  timestamp: number;
  tabId: string;
  senderId: string; // FASE 2.2: Para detecção de conflitos
};

/**
 * Hook para sincronização entre múltiplas abas com resolução de conflitos
 * FASE 2.2: Multi-Tab Conflict Resolution implementado
 */
export function useMultiTabSync(
  onSessionUpdate: (session: EnrichmentSession) => void,
  onSessionClear: () => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>(generateTabId());
  const lastUpdateRef = useRef<number>(0);
  const lastBroadcastRef = useRef<number>(0); // Timestamp do último broadcast desta aba

  /**
   * Broadcast atualização de sessão para outras abas
   * FASE 2.2: Inclui senderId para detecção de conflitos
   */
  const broadcastSessionUpdate = useCallback((session: EnrichmentSession) => {
    if (!channelRef.current) return;
    
    const now = Date.now();
    const message: SyncMessage = {
      type: 'session_updated',
      data: session,
      timestamp: now,
      tabId: tabIdRef.current,
      senderId: tabIdRef.current,
    };
    
    channelRef.current.postMessage(message);
    lastUpdateRef.current = now;
    lastBroadcastRef.current = now;
    
    logger.info('📡 Broadcast session update to other tabs');
  }, []);

  /**
   * Broadcast limpeza de sessão para outras abas
   */
  const broadcastSessionClear = useCallback(() => {
    if (!channelRef.current) return;
    
    const message: SyncMessage = {
      type: 'session_cleared',
      timestamp: Date.now(),
      tabId: tabIdRef.current,
      senderId: tabIdRef.current,
    };
    
    channelRef.current.postMessage(message);
    logger.info('📡 Broadcast session clear to other tabs');
  }, []);

  /**
   * Solicita sincronização (quando nova aba abre)
   */
  const requestSync = useCallback(() => {
    if (!channelRef.current) return;
    
    const message: SyncMessage = {
      type: 'request_sync',
      timestamp: Date.now(),
      tabId: tabIdRef.current,
      senderId: tabIdRef.current,
    };
    
    channelRef.current.postMessage(message);
    logger.info('📡 Requesting sync from other tabs');
  }, []);

  useEffect(() => {
    // Verificar se browser suporta Broadcast Channel
    if (!window.BroadcastChannel) {
      console.warn('⚠️ BroadcastChannel not supported, multi-tab sync disabled');
      return;
    }

    // Criar canal
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    // Listener para mensagens de outras abas
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const { type, data, timestamp, tabId, senderId } = event.data;
      
      // Ignorar mensagens da própria aba
      if (senderId === tabIdRef.current) {
        logger.debug('📨 Ignorando mensagem da própria aba');
        return;
      }
      
      // FASE 2.2: Detecção de conflito (mensagens com <5s de diferença)
      const timeDiff = Math.abs(timestamp - lastBroadcastRef.current);
      if (timeDiff < 5000 && lastBroadcastRef.current > 0) {
        logger.warn(`⚠️ Conflito detectado! Diferença de ${timeDiff}ms entre abas`);
        toast.warning('Conflito entre abas detectado', {
          description: 'Múltiplas abas editando simultaneamente. Usando última modificação.',
          duration: 4000,
        });
      }
      
      // Ignorar mensagens antigas (evitar loops) - Last-Write-Wins
      if (timestamp <= lastUpdateRef.current) {
        logger.debug('📨 Mensagem antiga ignorada');
        return;
      }
      
      logger.info(`📨 Received ${type} from tab ${tabId.slice(0, 12)}...`);
      
      switch (type) {
        case 'session_updated':
          if (data) {
            lastUpdateRef.current = timestamp;
            onSessionUpdate(data);
          }
          break;
          
        case 'session_cleared':
          onSessionClear();
          break;
          
        case 'request_sync':
          // Se temos dados, enviar para a aba que pediu
          logger.info('📡 Sync request received from new tab');
          break;
      }
    };

    // Solicitar sincronização ao abrir
    setTimeout(() => requestSync(), 100);

    // Cleanup
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [onSessionUpdate, onSessionClear, requestSync]);

  return {
    broadcastSessionUpdate,
    broadcastSessionClear,
    requestSync,
    tabId: tabIdRef.current,
  };
}

/**
 * Gera ID único para a aba
 */
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
