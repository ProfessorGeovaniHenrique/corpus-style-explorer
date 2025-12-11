/**
 * 🔬 POS ENRICHMENT MODULE
 * 
 * Enriquece tokens com anotações POS usando pipeline híbrido 4-layer:
 * Layer 1: VA Grammar (zero-cost, ~60% coverage)
 * Layer 2: spaCy (pt_core_news_lg, ~30% coverage)
 * Layer 3: Gutenberg Lexicon (~5% coverage)
 * Layer 4: Gemini Flash (fallback, ~5% coverage)
 * 
 * FASE 1 - Sprint 4: Integração POS → Pipeline Semântico
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

export interface EnrichedToken {
  palavra: string;
  lema: string;
  pos: string;
  posDetalhada: string;
  features: Record<string, string>;
  source: 'va_grammar' | 'spacy' | 'gemini' | 'gutenberg';
  confidence: number;
}

interface TokenToEnrich {
  palavra: string;
  contextoEsquerdo: string;
  contextoDireito: string;
}

interface EnrichmentOptions {
  skipPOS?: boolean; // Skip detailed POS tagging - use fast local inference
}

/**
 * SPRINT SEMANTIC-PIPELINE-FIX: Inferência POS local básica (0ms)
 * Usa padrões morfológicos para inferir POS sem chamada externa
 */
function inferBasicPOS(palavra: string): { pos: string; confidence: number } {
  const lower = palavra.toLowerCase();
  
  // Verbos - terminações comuns
  if (/[aei]r$/.test(lower)) return { pos: 'VERB', confidence: 0.7 }; // infinitivo
  if (/[aei]ndo$/.test(lower)) return { pos: 'VERB', confidence: 0.8 }; // gerúndio
  if (/[aei]do$/.test(lower)) return { pos: 'VERB', confidence: 0.6 }; // particípio ou adj
  if (/ou$/.test(lower) && lower.length > 3) return { pos: 'VERB', confidence: 0.75 }; // pretérito
  if (/ava$|ia$|iam$/.test(lower)) return { pos: 'VERB', confidence: 0.8 }; // imperfeito
  
  // Advérbios
  if (/mente$/.test(lower) && lower.length > 6) return { pos: 'ADV', confidence: 0.9 };
  
  // Adjetivos - sufixos comuns
  if (/[aoe]s?o$|[aoe]s?a$/.test(lower) && lower.length > 4) return { pos: 'ADJ', confidence: 0.5 };
  if (/oso$|osa$|ável$|ível$|ante$|ente$/.test(lower)) return { pos: 'ADJ', confidence: 0.75 };
  
  // Substantivos - sufixos comuns
  if (/ção$|dade$|mento$|ismo$|ista$/.test(lower)) return { pos: 'NOUN', confidence: 0.8 };
  
  // Artigos e determinantes
  if (['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas'].includes(lower)) {
    return { pos: 'DET', confidence: 0.95 };
  }
  
  // Preposições comuns
  if (['de', 'em', 'para', 'por', 'com', 'sobre', 'sob', 'entre'].includes(lower)) {
    return { pos: 'ADP', confidence: 0.95 };
  }
  
  // Conjunções
  if (['e', 'ou', 'mas', 'porém', 'contudo', 'todavia', 'que', 'se', 'quando', 'porque'].includes(lower)) {
    return { pos: lower === 'e' || lower === 'ou' || lower === 'mas' ? 'CCONJ' : 'SCONJ', confidence: 0.9 };
  }
  
  // Pronomes
  if (['eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'me', 'te', 'se', 'nos', 'vos'].includes(lower)) {
    return { pos: 'PRON', confidence: 0.95 };
  }
  
  // Default: substantivo (mais comum em corpus)
  return { pos: 'NOUN', confidence: 0.4 };
}

/**
 * Enriquece tokens com POS usando pipeline híbrido via Edge Function
 * 
 * @param tokens - Array de tokens a serem enriquecidos
 * @param options - Opções de enriquecimento (skipPOS para pular chamada externa)
 * @returns Array de tokens enriquecidos com POS, lema e features
 */
export async function enrichTokensWithPOS(
  tokens: TokenToEnrich[],
  options?: EnrichmentOptions
): Promise<EnrichedToken[]> {
  
  if (tokens.length === 0) {
    return [];
  }

  // SPRINT SEMANTIC-PIPELINE-FIX: Skip POS para anotação semântica básica
  // Usa inferência local rápida em vez de chamada HTTP
  if (options?.skipPOS) {
    console.log(`⚡ POS Enrichment: SKIP mode - usando inferência local para ${tokens.length} tokens`);
    return tokens.map(t => {
      const inferred = inferBasicPOS(t.palavra);
      return {
        palavra: t.palavra,
        lema: t.palavra, // Sem lematização no modo skip
        pos: inferred.pos,
        posDetalhada: 'INFERRED',
        features: {},
        source: 'va_grammar' as const,
        confidence: inferred.confidence,
      };
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not configured, skipping POS enrichment');
      return tokens.map(t => ({
        palavra: t.palavra,
        lema: t.palavra,
        pos: 'UNKNOWN',
        posDetalhada: 'UNKNOWN',
        features: {},
        source: 'va_grammar' as const,
        confidence: 0.0,
      }));
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Construir texto com contextos (melhor para POS tagging)
    const reconstructedText = tokens.map((t, idx) => {
      if (idx === 0) return t.palavra;
      return t.palavra; // spaCy e Gemini processam contexto automaticamente
    }).join(' ');

    console.log(`🔬 POS Enrichment: processando ${tokens.length} tokens via 4-layer pipeline`);

    // Chamar Edge Function annotate-pos (4-layer pipeline)
    const { data, error } = await supabase.functions.invoke('annotate-pos', {
      body: { 
        text: reconstructedText,
        mode: 'full_pipeline' // Ativa todos os 4 layers
      }
    });

    if (error) {
      console.error('❌ POS enrichment failed:', error);
      // Fallback: retornar tokens sem POS
      return tokens.map(t => ({
        palavra: t.palavra,
        lema: t.palavra,
        pos: 'UNKNOWN',
        posDetalhada: 'UNKNOWN',
        features: {},
        source: 'va_grammar' as const,
        confidence: 0.0,
      }));
    }

    if (!data || !data.annotations) {
      console.warn('⚠️ POS enrichment returned no annotations');
      return tokens.map(t => ({
        palavra: t.palavra,
        lema: t.palavra,
        pos: 'UNKNOWN',
        posDetalhada: 'UNKNOWN',
        features: {},
        source: 'va_grammar' as const,
        confidence: 0.0,
      }));
    }

    // Mapear resultados POS de volta aos tokens originais
    const enrichedMap = new Map<string, EnrichedToken>();
    
    data.annotations.forEach((annotation: any) => {
      enrichedMap.set(annotation.palavra.toLowerCase(), {
        palavra: annotation.palavra,
        lema: annotation.lema || annotation.palavra,
        pos: annotation.pos || 'UNKNOWN',
        posDetalhada: annotation.posDetalhada || 'UNKNOWN',
        features: annotation.features || {},
        source: annotation.source || 'va_grammar',
        confidence: annotation.confidence || 0.85,
      });
    });

    // Mesclar com tokens originais
    const enrichedTokens = tokens.map(t => {
      const posData = enrichedMap.get(t.palavra.toLowerCase());
      if (posData) {
        return posData;
      }
      
      // Fallback: token não encontrado
      return {
        palavra: t.palavra,
        lema: t.palavra,
        pos: 'UNKNOWN',
        posDetalhada: 'UNKNOWN',
        features: {},
        source: 'va_grammar' as const,
        confidence: 0.0,
      };
    });

    const coverage = enrichedTokens.filter(t => t.pos !== 'UNKNOWN').length;
    const coverageRate = (coverage / tokens.length) * 100;
    
    console.log(`✅ POS Enrichment: ${coverage}/${tokens.length} tokens (${coverageRate.toFixed(1)}% coverage)`);
    
    // Log distribuição de sources
    const sourceDistribution = enrichedTokens.reduce((acc, t) => {
      acc[t.source] = (acc[t.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`📊 POS Sources:`, sourceDistribution);

    return enrichedTokens;

  } catch (error) {
    console.error('❌ Error in POS enrichment:', error);
    
    // Fallback: retornar tokens sem POS
    return tokens.map(t => ({
      palavra: t.palavra,
      lema: t.palavra,
      pos: 'UNKNOWN',
      posDetalhada: 'UNKNOWN',
      features: {},
      source: 'va_grammar' as const,
      confidence: 0.0,
    }));
  }
}

/**
 * Calcula estatísticas de cobertura POS
 */
export function calculatePOSCoverage(enrichedTokens: EnrichedToken[]) {
  const total = enrichedTokens.length;
  const covered = enrichedTokens.filter(t => t.pos !== 'UNKNOWN').length;
  const coverageRate = (covered / total) * 100;
  
  const sourceDistribution = enrichedTokens.reduce((acc, t) => {
    acc[t.source] = (acc[t.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const avgConfidence = enrichedTokens.reduce((sum, t) => sum + t.confidence, 0) / total;
  
  return {
    total,
    covered,
    coverageRate,
    sourceDistribution,
    avgConfidence,
    unknownWords: enrichedTokens.filter(t => t.pos === 'UNKNOWN').map(t => t.palavra),
  };
}
