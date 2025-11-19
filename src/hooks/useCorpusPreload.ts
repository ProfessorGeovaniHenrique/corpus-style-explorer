/**
 * Hook para gerenciar pré-carregamento automático de corpus
 * Executa em idle time e cancela automaticamente em navegação
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { safeRequestIdleCallback } from '@/lib/polyfills';
import { getMostLikelyCorpus } from '@/lib/corpusUsageTracker';
import { preloadCorpus } from '@/lib/corpusPreloader';
import { electLeader, isLeaderElectionSupported } from '@/lib/leaderElection';
import { getCacheStats } from '@/lib/corpusIndexedDBCache';

const ENABLE_PRELOAD = localStorage.getItem('feature-preload') !== 'false';

export function useCorpusPreload() {
  const hasMounted = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { pathname } = useLocation();

  // Cancelar preload se usuário navegar para página que precisa de corpus
  useEffect(() => {
    if (pathname === '/dashboard-mvp') {
      if (abortControllerRef.current) {
        console.log('🛑 Navegação para Dashboard, cancelando preload');
        abortControllerRef.current.abort();
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (hasMounted.current || !ENABLE_PRELOAD) return;
    hasMounted.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Fase 1: Verificação rápida de cache
    const quickCheck = async () => {
      try {
        const stats = await getCacheStats();

        // Se não há cache, não vale a pena preload agora (cold start)
        if (stats.entries === 0) {
          console.log('⏭️ Preload cancelado: primeira sessão, aguardando uso real');
          return;
        }

        // Fase 2: Eleição de líder (se suportado)
        if (isLeaderElectionSupported()) {
          const isLeader = await electLeader();
          if (!isLeader) {
            console.log('⏭️ Esta tab não é líder, pulando preload');
            return;
          }
        } else {
          console.log('⚠️ BroadcastChannel não suportado, assumindo líder');
        }

        // Fase 3: Determinar corpus mais provável
        const mostLikely = getMostLikelyCorpus();
        console.log(`🎯 Corpus mais provável: ${mostLikely}`);

        // Fase 4: Preload de fato (idle callback)
        safeRequestIdleCallback(() => {
          if (!controller.signal.aborted) {
            preloadCorpus(mostLikely, controller.signal);
          }
        }, { timeout: 1000 });
      } catch (error) {
        console.error('❌ Erro na verificação de preload:', error);
      }
    };

    // Executar verificação (não-bloqueante)
    quickCheck();

    return () => {
      controller.abort();
    };
  }, []);
}
