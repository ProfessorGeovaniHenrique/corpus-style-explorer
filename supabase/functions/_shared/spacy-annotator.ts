/**
 * Layer 2: spaCy Fallback Annotator
 * Chama microserviço Python externo para anotar palavras desconhecidas
 */

import type { AnnotatedToken } from './hybrid-pos-annotator.ts';

const SPACY_API_URL = Deno.env.get('SPACY_API_URL');
const SPACY_TIMEOUT_MS = 5000; // 5s timeout
const SPACY_RETRY_ATTEMPTS = 1;

interface SpacyResponse {
  annotations: Array<{
    palavra: string;
    lema: string;
    pos: string;
    posDetalhada: string;
    features: Record<string, string>;
    confidence: number;
  }>;
}

interface SpacyHealthResponse {
  status: string;
  model: string;
}

/**
 * Verifica saúde da API spaCy
 */
export async function checkSpacyHealth(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
  if (!SPACY_API_URL) {
    return { healthy: false, responseTime: 0, error: 'SPACY_API_URL não configurado' };
  }

  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout para health check
    
    const response = await fetch(`${SPACY_API_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return { 
        healthy: false, 
        responseTime, 
        error: `HTTP ${response.status}` 
      };
    }
    
    const data: SpacyHealthResponse = await response.json();
    return { 
      healthy: data.status === 'healthy', 
      responseTime 
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error 
      ? (error.name === 'AbortError' ? 'timeout' : error.message)
      : 'unknown error';
    
    return { 
      healthy: false, 
      responseTime, 
      error: errorMessage 
    };
  }
}

/**
 * Anota tokens usando spaCy como fallback para Layer 1
 */
export async function annotateWithSpacy(
  unknownTokens: AnnotatedToken[],
  fullText: string
): Promise<AnnotatedToken[]> {
  if (!SPACY_API_URL) {
    console.warn('⚠️ SPACY_API_URL não configurado - pulando Layer 2');
    return unknownTokens;
  }

  if (unknownTokens.length === 0) {
    return [];
  }

  // Verificar saúde antes de processar
  const health = await checkSpacyHealth();
  if (!health.healthy) {
    console.warn(`⚠️ spaCy API unhealthy (${health.error}) - pulando Layer 2`);
    return unknownTokens;
  }

  // Retry logic
  for (let attempt = 0; attempt <= SPACY_RETRY_ATTEMPTS; attempt++) {
    try {
      const words = unknownTokens.map(t => t.palavra);
      
      // Chamada HTTP com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SPACY_TIMEOUT_MS);
      
      const response = await fetch(`${SPACY_API_URL}/annotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: words, fullText }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`spaCy API error: ${response.status}`);
      }
      
      const data: SpacyResponse = await response.json();
      
      // Mapear resultado para AnnotatedToken
      const annotated = data.annotations.map((ann, i) => ({
        ...unknownTokens[i],
        lema: ann.lema,
        pos: ann.pos,
        posDetalhada: ann.posDetalhada,
        features: ann.features,
        source: 'spacy' as const,
        confianca: ann.confidence
      }));
      
      console.log(`✅ Layer 2 (spaCy): ${annotated.filter(t => t.pos !== 'UNKNOWN').length}/${unknownTokens.length} tokens cobertos`);
      
      return annotated;
      
    } catch (error) {
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (isAbortError) {
        console.error(`⏱️ spaCy timeout excedido (>${SPACY_TIMEOUT_MS}ms) - tentativa ${attempt + 1}/${SPACY_RETRY_ATTEMPTS + 1}`);
      } else {
        console.error(`❌ Erro ao chamar spaCy (tentativa ${attempt + 1}/${SPACY_RETRY_ATTEMPTS + 1}):`, errorMessage);
      }
      
      // Não fazer retry se foi timeout ou última tentativa
      if (isAbortError || attempt === SPACY_RETRY_ATTEMPTS) {
        break;
      }
      
      // Aguardar 500ms antes de retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Graceful degradation: retornar tokens inalterados
  console.warn(`⚠️ Layer 2 falhou após ${SPACY_RETRY_ATTEMPTS + 1} tentativas - fallback para Layer 1`);
  return unknownTokens;
}
