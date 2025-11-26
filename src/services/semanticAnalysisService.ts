/**
 * 🎯 SEMANTIC ANALYSIS SERVICE
 * 
 * Interface com annotate-semantic-domain edge function
 * para classificação semântica em tempo real
 */

import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('semanticAnalysisService');

export interface SemanticAnnotation {
  palavra: string;
  tagset_primario: string;
  tagset_codigo: string;
  dominio_nome: string;
  cor: string;
  confianca: number;
  prosody: 'Positiva' | 'Negativa' | 'Neutra';
}

export interface SemanticAnalysisResult {
  annotations: SemanticAnnotation[];
  totalPalavras: number;
  palavrasClassificadas: number;
  dominiosEncontrados: number;
}

/**
 * Analisa domínios semânticos de uma lista de palavras
 */
export async function analyzeSemanticDomains(
  words: string[],
  context?: string
): Promise<SemanticAnalysisResult> {
  try {
    log.info('Analyzing semantic domains', { wordsCount: words.length });

    // Chamar annotate-semantic-domain para cada palavra
    const { data, error } = await supabase.functions.invoke('annotate-semantic-domain', {
      body: { words, context }
    });

    if (error) {
      log.error('Error calling annotate-semantic-domain', error);
      throw error;
    }

    if (!data || !data.annotations) {
      throw new Error('Resposta inválida da edge function');
    }

    const annotations: SemanticAnnotation[] = data.annotations;
    const dominiosUnicos = new Set(annotations.map(a => a.dominio_nome));

    log.info('Analysis complete', { 
      annotated: annotations.length,
      domains: dominiosUnicos.size 
    });

    return {
      annotations,
      totalPalavras: words.length,
      palavrasClassificadas: annotations.length,
      dominiosEncontrados: dominiosUnicos.size
    };
  } catch (error) {
    log.error('Error analyzing semantic domains', error as Error);
    throw error;
  }
}

/**
 * Busca tagset por código
 */
export async function getTagsetByCode(codigo: string) {
  try {
    const { data, error } = await supabase
      .from('semantic_tagset')
      .select('*')
      .eq('codigo', codigo)
      .eq('status', 'ativo')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    log.error('Error fetching tagset', error as Error, { codigo });
    return null;
  }
}

/**
 * Lista todos os domínios N1 ativos
 */
export async function getAllN1Domains() {
  try {
    const { data, error } = await supabase
      .from('semantic_tagset')
      .select('codigo, nome, cor, nivel_profundidade')
      .eq('status', 'ativo')
      .eq('nivel_profundidade', 1)
      .order('codigo');

    if (error) throw error;
    
    log.info('N1 domains loaded', { count: data?.length || 0 });
    return data || [];
  } catch (error) {
    log.error('Error fetching N1 domains', error as Error);
    return [];
  }
}
