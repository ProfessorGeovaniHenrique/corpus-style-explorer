# 🛡️ Shared Utilities - Edge Functions

Módulos reutilizáveis para garantir resiliência, validação, rate limiting e CORS nas edge functions.

## 📦 Módulos Disponíveis

### 0. **cors.ts** - CORS Headers Compartilhados (Sprint 2 Refactoring)

Módulo centralizado para headers CORS e tratamento de preflight requests.

```typescript
import { corsHeaders, handleCorsPreflightRequest, createCorsResponse, createErrorResponse } from "../_shared/cors.ts";

// No início do handler
const corsResponse = handleCorsPreflightRequest(req);
if (corsResponse) return corsResponse;

// Resposta com CORS
return createCorsResponse({ success: true, data });

// Erro com CORS
return createErrorResponse('Algo deu errado', 500);
```

**Exports:**
- `corsHeaders` - Headers CORS padrão
- `handleCorsPreflightRequest(req)` - Retorna Response para OPTIONS ou null
- `createCorsResponse(data, status)` - JSON response com CORS
- `createErrorResponse(error, status)` - Error response com CORS

---

### 1. **validation.ts** - Validação de Entrada

Schemas Zod para validação de payloads + middleware reutilizável.

```typescript
import { cancelJobSchema, validate, createValidationMiddleware } from "../_shared/validation.ts";

// Validação direta
const result = validate(cancelJobSchema, requestBody);
if (!result.success) {
  return new Response(JSON.stringify({ error: result.error }), { status: 400 });
}

// Middleware automático
const validateRequest = createValidationMiddleware(cancelJobSchema);
const validation = await validateRequest(req);
```

**Schemas disponíveis:**
- `cancelJobSchema` - Cancelamento de jobs
- `dictionaryImportSchema` - Importação de dicionários
- `annotationSchema` - Anotação de corpus

**Funções auxiliares:**
- `validatePayloadSize(payload, maxBytes)` - Valida tamanho total
- `sanitizeString(input)` - Remove caracteres perigosos

---

### 2. **rate-limit.ts** - Rate Limiting com Upstash Redis (Sprint 2)

Implementa sliding window rate limiting para proteger edge functions.

```typescript
import { checkRateLimit, RateLimitPresets, createRateLimitHeaders } from "../_shared/rate-limit.ts";

// Verificar rate limit
const rateLimitResult = await checkRateLimit(
  `cancel-job:${userId}`,
  RateLimitPresets.STRICT
);

if (!rateLimitResult.success) {
  return new Response(
    JSON.stringify({ error: rateLimitResult.error }),
    { 
      status: 429, 
      headers: createRateLimitHeaders(rateLimitResult)
    }
  );
}
```

**Presets disponíveis:**
- `STRICT` - 5 req/min (operações sensíveis)
- `NORMAL` - 20 req/min (operações normais)
- `RELAXED` - 100 req/min (operações leves)
- `HEAVY_IMPORT` - 10 req/hora (importações pesadas)

**Headers HTTP retornados:**
- `X-RateLimit-Limit` - Limite total
- `X-RateLimit-Remaining` - Requisições restantes
- `X-RateLimit-Reset` - Timestamp de reset

---

### 3. **circuit-breaker.ts** - Circuit Breaker Pattern (Sprint 3)

Protege contra falhas em cascata com circuit breaker pattern.

```typescript
import { withCircuitBreaker, CircuitBreakerPresets } from "../_shared/circuit-breaker.ts";

const result = await withCircuitBreaker(
  'external-service',
  async () => {
    // Operação que pode falhar
    return await callExternalAPI();
  },
  async () => {
    // Fallback opcional se circuit estiver aberto
    return cachedResult;
  },
  CircuitBreakerPresets.CRITICAL
);
```

**Estados do Circuit Breaker:**
- `CLOSED` - Funcionando normalmente
- `OPEN` - Bloqueando requisições (após threshold de falhas)
- `HALF_OPEN` - Testando recuperação

**Presets disponíveis:**
- `CRITICAL` - 3 falhas → abre, reset em 30s
- `NORMAL` - 5 falhas → abre, reset em 1min
- `RELAXED` - 10 falhas → abre, reset em 2min

---

### 4. **retry.ts** - Retry com Backoff Exponencial (Sprint 3)

Retry consistente com backoff exponencial e jitter.

```typescript
import { withRetry, withSupabaseRetry } from "../_shared/retry.ts";

// Retry genérico
const result = await withRetry(
  async () => {
    return await riskyOperation();
  },
  5,    // maxRetries
  500,  // initialDelayMs
  2     // backoffMultiplier
);

// Retry específico para Supabase (5 tentativas, 200ms inicial)
const data = await withSupabaseRetry(async () => {
  return await supabase.from('table').select();
});
```

**Características:**
- Backoff exponencial com jitter (±20%)
- Evita thundering herd problem
- Logs detalhados de cada tentativa

---

### 5. **timeout.ts** - Timeouts Configuráveis (Sprint 3)

Timeouts consistentes via env vars para todas as operações.

```typescript
import { withTimeout, Timeouts } from "../_shared/timeout.ts";

// Timeout simples
const result = await withTimeout(
  async () => {
    return await longRunningOperation();
  },
  Timeouts.JOB_CANCELLATION, // 30s
  'Operação excedeu timeout'
);

// Timeout com cleanup
const result = await withTimeoutAndCleanup(
  async () => {
    return await operation();
  },
  5000,
  async () => {
    // Cleanup se timeout
    await rollback();
  }
);
```

**Timeouts configuráveis via ENV:**
- `TIMEOUT_DICTIONARY_IMPORT_MS` - Padrão: 5min
- `TIMEOUT_CORPUS_ANNOTATION_MS` - Padrão: 10min
- `TIMEOUT_JOB_CANCELLATION_MS` - Padrão: 30s
- `TIMEOUT_DATABASE_MS` - Padrão: 10s
- `TIMEOUT_HTTP_MS` - Padrão: 30s

---

## 🎯 Exemplo Completo: Edge Function Resiliente

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createValidationMiddleware, mySchema } from "../_shared/validation.ts";
import { checkRateLimit, RateLimitPresets, createRateLimitHeaders } from "../_shared/rate-limit.ts";
import { withCircuitBreaker, CircuitBreakerPresets } from "../_shared/circuit-breaker.ts";
import { withSupabaseRetry } from "../_shared/retry.ts";
import { withTimeout, Timeouts } from "../_shared/timeout.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1️⃣ Autenticação
    const { user } = await authenticate(req);

    // 2️⃣ Rate Limiting
    const rateLimitResult = await checkRateLimit(
      `my-endpoint:${user.id}`,
      RateLimitPresets.NORMAL
    );

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.error }),
        { 
          status: 429, 
          headers: createRateLimitHeaders(rateLimitResult)
        }
      );
    }

    // 3️⃣ Validação
    const validateRequest = createValidationMiddleware(mySchema);
    const validation = await validateRequest(req);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400 }
      );
    }

    const { data } = validation;

    // 4️⃣ Operação Resiliente (Circuit Breaker + Retry + Timeout)
    const result = await withTimeout(
      () => withCircuitBreaker(
        'my-service',
        () => withSupabaseRetry(async () => {
          // Operação idempotente com banco
          return await supabase
            .from('my_table')
            .upsert(data) // IDEMPOTENTE
            .select()
            .single();
        }),
        undefined, // sem fallback
        CircuitBreakerPresets.NORMAL
      ),
      Timeouts.DATABASE_OPERATION
    );

    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { 
          ...corsHeaders, 
          ...createRateLimitHeaders(rateLimitResult),
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

---

## 🚀 Benefícios da Arquitetura Resiliente

### Sprint 2 (Validação + Rate Limiting)
✅ **Validação consistente** com Zod schemas  
✅ **Proteção contra abuse** com rate limiting  
✅ **Tamanho de payload** controlado (10MB máx)  
✅ **Sanitização de inputs** para prevenir XSS  

### Sprint 3 (Resiliência)
✅ **Circuit breaker** previne falhas em cascata  
✅ **Retry inteligente** com backoff exponencial  
✅ **Timeouts configuráveis** via env vars  
✅ **Idempotência** com upserts no banco  

---

## 📊 Métricas de Melhoria

**Antes dos Sprints de Refatoração:**
- Race conditions em cancelamentos simultâneos
- Sem proteção contra abuse (rate limiting)
- Timeouts hardcoded no código
- Falhas em cascata sem circuit breaker
- Retry ad-hoc e inconsistente
- CORS duplicado em 61 edge functions (~1,200 linhas)

**Depois dos Sprints de Refatoração:**
- ✅ Zero race conditions (advisory locks)
- ✅ Rate limit configurável por endpoint
- ✅ Timeouts via ENV (fácil ajuste)
- ✅ Proteção contra falhas em cascata
- ✅ Retry consistente em todas edge functions
- ✅ CORS centralizado em módulo único (~50 linhas)

---

## 🔧 Configuração de Environment Variables

Adicione ao seu projeto Supabase (Settings → Edge Functions → Secrets):

```bash
# Timeouts (em milisegundos)
TIMEOUT_DICTIONARY_IMPORT_MS=300000
TIMEOUT_CORPUS_ANNOTATION_MS=600000
TIMEOUT_JOB_CANCELLATION_MS=30000
TIMEOUT_DATABASE_MS=10000
TIMEOUT_HTTP_MS=30000

# Upstash Redis (necessário para rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```
