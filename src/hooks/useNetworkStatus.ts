import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook para detectar status de conexão de rede
 * Fornece feedback visual quando offline/online
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Se estava offline, mostrar toast de reconexão
      if (wasOffline) {
        toast.success('Conexão restabelecida!', {
          description: 'Salvamento na nuvem reativado',
          duration: 3000,
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      toast.warning('Sem conexão com internet', {
        description: 'Salvando apenas localmente',
        duration: 5000,
      });
    };

    // Listeners de eventos de rede
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
