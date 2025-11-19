/**
 * ✅ SPRINT 3: Circuit Breaker Pattern
 * Implementa proteção contra falhas em cascata em serviços externos
 */

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

interface CircuitBreakerConfig {
  failureThreshold: number;    // Número de falhas para abrir o circuito
  resetTimeout: number;         // Tempo em ms antes de tentar HALF_OPEN
  halfOpenMaxAttempts: number;  // Tentativas em estado HALF_OPEN
}

/**
 * Circuit Breaker in-memory (para edge functions stateless)
 * Em produção, considere usar Redis para estado compartilhado
 */
class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED',
  };

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Executa operação com proteção de circuit breaker
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    // 1️⃣ Verificar estado do circuito
    if (this.state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;
      
      // Se passou o resetTimeout, tentar HALF_OPEN
      if (timeSinceLastFailure >= this.config.resetTimeout) {
        console.log('🔄 Circuit Breaker: Tentando HALF_OPEN');
        this.state.state = 'HALF_OPEN';
        this.state.failures = 0;
      } else {
        console.warn(`⚡ Circuit Breaker: OPEN - bloqueando requisição`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(
          `Circuit breaker aberto. Tentando novamente em ${
            Math.ceil((this.config.resetTimeout - timeSinceLastFailure) / 1000)
          }s`
        );
      }
    }

    // 2️⃣ Executar operação
    try {
      const result = await operation();
      
      // Sucesso - resetar estado
      if (this.state.state === 'HALF_OPEN') {
        console.log('✅ Circuit Breaker: HALF_OPEN → CLOSED (recuperado)');
        this.state.state = 'CLOSED';
        this.state.failures = 0;
      }
      
      return result;
    } catch (error) {
      // Falha - incrementar contador
      this.state.failures++;
      this.state.lastFailureTime = Date.now();

      console.error(
        `❌ Circuit Breaker: Falha ${this.state.failures}/${this.config.failureThreshold}`,
        error
      );

      // Verificar se deve abrir o circuito
      if (
        this.state.state === 'CLOSED' &&
        this.state.failures >= this.config.failureThreshold
      ) {
        console.warn('⚡ Circuit Breaker: CLOSED → OPEN (limite atingido)');
        this.state.state = 'OPEN';
      } else if (this.state.state === 'HALF_OPEN') {
        console.warn('⚡ Circuit Breaker: HALF_OPEN → OPEN (falha na recuperação)');
        this.state.state = 'OPEN';
      }

      if (fallback) {
        return await fallback();
      }

      throw error;
    }
  }

  /**
   * Retorna estado atual do circuit breaker
   */
  getState() {
    return this.state;
  }

  /**
   * Reseta manualmente o circuit breaker (útil para testes)
   */
  reset() {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    };
  }
}

/**
 * Configs de circuit breaker pré-definidos
 */
export const CircuitBreakerPresets = {
  // Crítico: falha rápido, recupera rápido
  CRITICAL: {
    failureThreshold: 3,
    resetTimeout: 30_000, // 30s
    halfOpenMaxAttempts: 2,
  },
  
  // Normal: tolerante, recuperação moderada
  NORMAL: {
    failureThreshold: 5,
    resetTimeout: 60_000, // 1min
    halfOpenMaxAttempts: 3,
  },
  
  // Relaxado: muito tolerante
  RELAXED: {
    failureThreshold: 10,
    resetTimeout: 120_000, // 2min
    halfOpenMaxAttempts: 5,
  },
} as const;

/**
 * Registry global de circuit breakers (um por serviço)
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Obtém ou cria um circuit breaker para um serviço
 */
export function getCircuitBreaker(
  serviceName: string,
  config: CircuitBreakerConfig = CircuitBreakerPresets.NORMAL
): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(config));
  }
  return circuitBreakers.get(serviceName)!;
}

/**
 * Wrapper para executar operações com circuit breaker
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  fallback?: () => T | Promise<T>,
  config?: CircuitBreakerConfig
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName, config);
  return breaker.execute(operation, fallback);
}
