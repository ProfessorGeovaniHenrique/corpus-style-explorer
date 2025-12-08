/**
 * 🚦 USE RATE LIMITER
 * Sprint AUD-C2: Hook unificado para rate limiting no frontend
 */

import { useState, useRef, useCallback } from 'react';

interface RateLimiterConfig {
  /** Número máximo de requisições na janela */
  maxRequests: number;
  /** Tamanho da janela em ms (default: 60000 = 1 minuto) */
  windowMs?: number;
  /** Delay mínimo entre requisições em ms (default: 0) */
  minDelayMs?: number;
}

interface RateLimiterState {
  /** Requisições restantes na janela atual */
  remaining: number;
  /** Timestamp de quando a janela reseta */
  resetAt: number | null;
  /** Se está atualmente limitado */
  isLimited: boolean;
  /** Tempo em ms até poder fazer próxima requisição */
  waitTimeMs: number;
}

interface RateLimiterResult {
  /** Estado atual do rate limiter */
  state: RateLimiterState;
  /** Verifica se pode fazer requisição (não bloqueia) */
  canRequest: () => boolean;
  /** Registra que uma requisição foi feita */
  recordRequest: () => void;
  /** Registra que recebeu 429 da API */
  record429: (retryAfterMs?: number) => void;
  /** Aguarda até poder fazer requisição (retorna Promise) */
  waitForSlot: () => Promise<void>;
  /** Reseta o rate limiter */
  reset: () => void;
}

/**
 * Hook para controle de rate limiting no frontend
 * 
 * @example
 * ```tsx
 * const { canRequest, recordRequest, record429, waitForSlot } = useRateLimiter({
 *   maxRequests: 10,
 *   windowMs: 60000,
 *   minDelayMs: 200
 * });
 * 
 * const makeRequest = async () => {
 *   if (!canRequest()) {
 *     await waitForSlot();
 *   }
 *   recordRequest();
 *   try {
 *     const response = await fetch(...);
 *     if (response.status === 429) {
 *       record429();
 *     }
 *   } catch (error) {...}
 * };
 * ```
 */
export function useRateLimiter(config: RateLimiterConfig): RateLimiterResult {
  const { maxRequests, windowMs = 60000, minDelayMs = 0 } = config;
  
  // Timestamps das requisições na janela atual
  const requestTimestamps = useRef<number[]>([]);
  // Timestamp da última requisição (para minDelay)
  const lastRequestAt = useRef<number>(0);
  // Se recebeu 429, timestamp de quando pode tentar novamente
  const blockedUntil = useRef<number>(0);
  
  const [state, setState] = useState<RateLimiterState>({
    remaining: maxRequests,
    resetAt: null,
    isLimited: false,
    waitTimeMs: 0
  });
  
  // Limpa requisições antigas fora da janela
  const cleanOldRequests = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    requestTimestamps.current = requestTimestamps.current.filter(ts => ts > windowStart);
  }, [windowMs]);
  
  // Atualiza estado baseado nas requisições atuais
  const updateState = useCallback(() => {
    cleanOldRequests();
    const now = Date.now();
    
    const currentRequests = requestTimestamps.current.length;
    const remaining = Math.max(0, maxRequests - currentRequests);
    
    // Calcula quando a janela reseta (quando a requisição mais antiga expira)
    const oldestRequest = requestTimestamps.current[0];
    const resetAt = oldestRequest ? oldestRequest + windowMs : null;
    
    // Verifica se está bloqueado por 429
    const isBlocked429 = blockedUntil.current > now;
    
    // Verifica se atingiu o limite de requisições
    const isLimitedByWindow = currentRequests >= maxRequests;
    
    // Verifica delay mínimo
    const timeSinceLastRequest = now - lastRequestAt.current;
    const needsMinDelay = minDelayMs > 0 && timeSinceLastRequest < minDelayMs;
    
    const isLimited = isBlocked429 || isLimitedByWindow || needsMinDelay;
    
    // Calcula tempo de espera
    let waitTimeMs = 0;
    if (isBlocked429) {
      waitTimeMs = blockedUntil.current - now;
    } else if (isLimitedByWindow && resetAt) {
      waitTimeMs = resetAt - now;
    } else if (needsMinDelay) {
      waitTimeMs = minDelayMs - timeSinceLastRequest;
    }
    
    setState({
      remaining,
      resetAt,
      isLimited,
      waitTimeMs: Math.max(0, waitTimeMs)
    });
    
    return { isLimited, waitTimeMs };
  }, [cleanOldRequests, maxRequests, windowMs, minDelayMs]);
  
  const canRequest = useCallback((): boolean => {
    const { isLimited } = updateState();
    return !isLimited;
  }, [updateState]);
  
  const recordRequest = useCallback(() => {
    const now = Date.now();
    requestTimestamps.current.push(now);
    lastRequestAt.current = now;
    updateState();
  }, [updateState]);
  
  const record429 = useCallback((retryAfterMs = 30000) => {
    blockedUntil.current = Date.now() + retryAfterMs;
    updateState();
  }, [updateState]);
  
  const waitForSlot = useCallback(async (): Promise<void> => {
    const { isLimited, waitTimeMs } = updateState();
    
    if (!isLimited) return;
    
    // Aguarda o tempo necessário
    await new Promise(resolve => setTimeout(resolve, waitTimeMs + 50));
    
    // Verifica novamente após aguardar
    const newState = updateState();
    if (newState.isLimited) {
      // Recursivamente aguarda se ainda limitado
      await waitForSlot();
    }
  }, [updateState]);
  
  const reset = useCallback(() => {
    requestTimestamps.current = [];
    lastRequestAt.current = 0;
    blockedUntil.current = 0;
    setState({
      remaining: maxRequests,
      resetAt: null,
      isLimited: false,
      waitTimeMs: 0
    });
  }, [maxRequests]);
  
  return {
    state,
    canRequest,
    recordRequest,
    record429,
    waitForSlot,
    reset
  };
}

/**
 * Configurações pré-definidas para casos comuns
 */
export const RateLimitPresets = {
  /** Para APIs com limite rigoroso (Gemini) */
  STRICT: { maxRequests: 10, windowMs: 60000, minDelayMs: 200 },
  /** Para APIs moderadas */
  NORMAL: { maxRequests: 30, windowMs: 60000, minDelayMs: 100 },
  /** Para APIs relaxadas */
  RELAXED: { maxRequests: 60, windowMs: 60000, minDelayMs: 50 },
  /** Para chat/conversação */
  CHAT: { maxRequests: 20, windowMs: 60000, minDelayMs: 500 },
} as const;
