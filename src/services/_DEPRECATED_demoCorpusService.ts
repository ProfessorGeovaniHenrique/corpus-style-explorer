/**
 * ⚠️ DEPRECATED - DEMO CORPUS SERVICE
 * 
 * Este arquivo está OBSOLETO. Use corpusDataService.ts para dados reais.
 * 
 * Mantido temporariamente apenas para referência histórica.
 * Carregava dados mockup de 33 palavras da música "Quando o Verso Vem pras Casa"
 */

import { supabase } from '@/integrations/supabase/client';

export interface DemoKeyword {
  palavra: string;
  frequencia: number;
  ll: number;
  mi: number;
  significancia: string;
  dominio: string;
  cor: string;
  prosody: string;
}

export interface DemoDomain {
  dominio: string;
  descricao: string;
  cor: string;
  palavras: string[];
  ocorrencias: number;
  avgLL: number;
  avgMI: number;
  riquezaLexical: number;
  percentual: number;
}

export interface DemoCloudData {
  codigo: string;
  nome: string;
  size: number;
  color: string;
  wordCount: number;
  avgScore: number;
}

export interface DemoAnalysisResult {
  keywords: DemoKeyword[];
  dominios: DemoDomain[];
  cloudData: DemoCloudData[];
  estatisticas: {
    totalPalavras: number;
    palavrasUnicas: number;
    dominiosIdentificados: number;
    palavrasChaveSignificativas: number;
    prosodiaDistribution: {
      positivas: number;
      negativas: number;
      neutras: number;
      percentualPositivo: number;
      percentualNegativo: number;
      percentualNeutro: number;
    };
  };
}

let cachedData: DemoAnalysisResult | null = null;

/**
 * @deprecated Use corpusDataService.getCorpusAnalysisResults('gaucho') instead
 */
export async function getDemoAnalysisResults(): Promise<DemoAnalysisResult> {
  console.warn('⚠️ DEPRECATED: getDemoAnalysisResults() está obsoleto. Use getCorpusAnalysisResults() de corpusDataService.ts');

  // Retornar cache se disponível
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log('📊 [DEPRECATED] Buscando análise do corpus demo...');

    const { data, error } = await supabase.functions.invoke('process-demo-corpus');

    if (error) {
      console.error('Erro ao buscar análise demo:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Nenhum dado retornado da edge function');
    }

    cachedData = data as DemoAnalysisResult;

    console.log(`✅ [DEPRECATED] Análise carregada: ${cachedData.keywords.length} palavras-chave`);

    return cachedData;
  } catch (error) {
    console.error('Erro ao processar corpus demo:', error);
    throw error;
  }
}

export function clearDemoCache() {
  cachedData = null;
}
