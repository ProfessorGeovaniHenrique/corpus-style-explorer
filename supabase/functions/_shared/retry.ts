/**
 * Utilitário de retry com backoff exponencial para operações assíncronas
 * Usado para lidar com falhas transientes de rede/banco de dados
 * ✅ SPRINT 3: Expandido com configs e retry específico para Supabase
 */

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        console.error(`❌ Todas as ${maxRetries} tentativas falharam`);
        throw error;
      }
      
      const currentDelay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      console.log(`⚠️ Tentativa ${attempt}/${maxRetries} falhou. Retrying em ${currentDelay}ms...`);
      console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError;
}

/**
 * ✅ SPRINT 3: Retry específico para operações Supabase
 * Trata erros específicos de timeout e conexão
 */
export async function withSupabaseRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  return withRetry(fn, maxRetries, 200, 2);
}
