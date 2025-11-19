/**
 * Sistema de logging condicional
 * Logs ativos apenas em desenvolvimento
 * Performance otimizada para produção
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log informativo (apenas dev)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log de aviso (apenas dev)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log de erro (sempre ativo)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log de sucesso (apenas dev)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  },

  /**
   * Log de debug detalhado (apenas dev)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
