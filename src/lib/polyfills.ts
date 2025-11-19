/**
 * Polyfills e fallbacks para APIs não suportadas em navegadores antigos
 */

interface IdleCallbackOptions {
  timeout?: number;
}

/**
 * Polyfill robusto para requestIdleCallback
 * Safari iOS < 16.4 não suporta nativamente
 */
export function safeRequestIdleCallback(
  callback: () => void,
  options?: IdleCallbackOptions
): void {
  const hasRequestIdleCallback = 'requestIdleCallback' in window;
  
  if (hasRequestIdleCallback) {
    (window as any).requestIdleCallback(callback, options);
    return;
  }
  
  // Fallback: aguardar load + delay adaptativo
  if (document.readyState === 'complete') {
    // Página já carregada, executar após próximo frame
    requestAnimationFrame(() => {
      setTimeout(callback, 100);
    });
  } else {
    // Aguardar load completo
    const loadHandler = () => setTimeout(callback, 500);
    (window as Window).addEventListener('load', loadHandler, { once: true });
  }
}

/**
 * Detecta se Data Saver está ativado
 */
export function isDataSaverEnabled(): boolean {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    return conn?.saveData === true;
  }
  return false;
}

/**
 * Obtém tipo de conexão efetiva
 */
export function getEffectiveConnectionType(): string {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    return conn?.effectiveType || '4g';
  }
  return '4g';
}

/**
 * Verifica se conexão é lenta (< 3G)
 */
export function isSlowConnection(): boolean {
  const type = getEffectiveConnectionType();
  return type === '2g' || type === 'slow-2g';
}
