/**
 * Sistema de eleição de líder para coordenar preload entre múltiplas tabs
 * Previne desperdício de banda garantindo que apenas uma tab execute preload
 */

const ELECTION_CHANNEL = 'corpus-preload-election';
const ELECTION_WINDOW = 200; // ms

/**
 * Elege uma tab como líder para executar preload
 * Usa algoritmo determinístico baseado em timestamp+random
 * 
 * @returns true se esta tab foi eleita líder, false caso contrário
 */
export async function electLeader(): Promise<boolean> {
  try {
    const channel = new BroadcastChannel(ELECTION_CHANNEL);
    const tabId = `tab-${Date.now()}-${Math.random()}`;
    
    return new Promise((resolve) => {
      const candidates = new Set<string>([tabId]);
      
      // Escutar outros candidatos
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'candidate') {
          candidates.add(e.data.id);
        }
      };
      
      channel.addEventListener('message', handler);
      
      // Anunciar candidatura
      channel.postMessage({ type: 'candidate', id: tabId });
      
      // Após janela de eleição, determinar líder
      setTimeout(() => {
        channel.removeEventListener('message', handler);
        
        // Eleição determinística: menor ID lexicográfico ganha
        const sorted = Array.from(candidates).sort();
        const isLeader = sorted[0] === tabId;
        
        if (isLeader) {
          channel.postMessage({ type: 'elected', id: tabId });
          console.log(`👑 Esta tab foi eleita líder para preload`);
        } else {
          console.log(`🙇 Esta tab não é líder (líder: ${sorted[0].substring(0, 20)}...)`);
        }
        
        channel.close();
        resolve(isLeader);
      }, ELECTION_WINDOW);
    });
  } catch (error) {
    console.error('❌ Erro na eleição de líder:', error);
    // Em caso de erro, assumir que é líder (fallback seguro)
    return true;
  }
}

/**
 * Verifica se BroadcastChannel é suportado
 */
export function isLeaderElectionSupported(): boolean {
  return 'BroadcastChannel' in window;
}
