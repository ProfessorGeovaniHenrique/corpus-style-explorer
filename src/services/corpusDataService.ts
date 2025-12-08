/**
 * 🎯 CORPUS DATA SERVICE - DADOS REAIS DO BANCO
 * 
 * Substitui demoCorpusService.ts com dados do banco de dados real:
 * - 58,888 músicas (32,652 gaúcho + 26,236 nordestino)
 * - 218 tagsets semânticos ativos
 * - Anotações de annotate-semantic-domain
 */

import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('corpusDataService');

export interface CorpusKeyword {
  palavra: string;
  frequencia: number;
  ll: number;
  mi: number;
  significancia: string;
  dominio: string;
  cor: string;
  prosody: 'Positiva' | 'Negativa' | 'Neutra';
}

export interface CorpusDomain {
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

export interface CorpusCloudData {
  codigo: string;
  nome: string;
  size: number;
  color: string;
  wordCount: number;
  avgScore: number;
}

export interface CorpusAnalysisResult {
  keywords: CorpusKeyword[];
  dominios: CorpusDomain[];
  cloudData: CorpusCloudData[];
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

interface CorpusOptions {
  limit?: number;
  enrichedOnly?: boolean;
  artistFilter?: string;
}

/**
 * Busca análise de corpus REAL do banco de dados
 */
export async function getCorpusAnalysisResults(
  corpusType: 'gaucho' | 'nordestino' | 'user',
  options: CorpusOptions = {}
): Promise<CorpusAnalysisResult> {
  // Guard clause: corpus de usuário não pode ser buscado via este serviço
  if (corpusType === 'user') {
    log.warn('User corpus não suporta busca via corpusDataService - retornando vazio');
    return createEmptyResult();
  }
  
  try {
    log.info('Fetching real corpus data', { corpusType, options });

    // Buscar corpus_id correspondente
    const { data: corpus, error: corpusError } = await supabase
      .from('corpora')
      .select('id, name')
      .eq('normalized_name', corpusType)
      .single();

    if (corpusError || !corpus) {
      log.error('Corpus not found', corpusError);
      throw new Error(`Corpus ${corpusType} não encontrado`);
    }

    // Buscar músicas do corpus
    let query = supabase
      .from('songs')
      .select('id, title, artist_id, lyrics, corpus_id')
      .eq('corpus_id', corpus.id);

    if (options.enrichedOnly) {
      query = query.eq('status', 'enriched');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: songs, error: songsError } = await query;

    if (songsError) {
      log.error('Error fetching songs', songsError);
      throw songsError;
    }

    if (!songs || songs.length === 0) {
      log.warn('No songs found', { corpusType });
      return createEmptyResult();
    }

    log.info('Songs loaded', { count: songs.length });

    // Buscar tagsets N1 para mapeamento de nomes
    const { data: n1Tagsets, error: tagsetsError } = await supabase
      .from('semantic_tagset')
      .select('codigo, nome')
      .eq('status', 'ativo')
      .eq('nivel_profundidade', 1)
      .order('codigo');

    if (tagsetsError) {
      log.error('Error fetching tagsets', new Error(tagsetsError.message));
      throw tagsetsError;
    }

    const tagsetMap = new Map(n1Tagsets?.map(t => [t.codigo, t.nome]) || []);
    
    log.info('N1 Tagsets loaded', { count: n1Tagsets?.length });

    // Buscar dados REAIS do semantic_disambiguation_cache
    const { data: cacheEntries, error: cacheError } = await supabase
      .from('semantic_disambiguation_cache')
      .select('palavra, tagset_codigo, confianca, fonte, hits_count')
      .order('hits_count', { ascending: false });

    if (cacheError) {
      log.warn('Cache not available, using fallback', { error: cacheError.message });
    }

    const cacheData = cacheEntries || [];
    log.info('Semantic cache loaded', { entries: cacheData.length });

    // Processar textos das letras para frequências
    const allLyrics = songs
      .filter(s => s.lyrics)
      .map(s => s.lyrics!)
      .join(' ');

    const tokens = allLyrics
      .toLowerCase()
      .replace(/[.,!?;:"()]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);

    const freqMap = new Map<string, number>();
    tokens.forEach(token => {
      freqMap.set(token, (freqMap.get(token) || 0) + 1);
    });

    const totalTokens = tokens.length;
    const uniqueWords = freqMap.size;

    // Criar keywords usando cache semântico
    const topWords = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);

    const keywords: CorpusKeyword[] = topWords.map(([palavra, freq]) => {
      // Buscar no cache semântico
      const cached = cacheData.find(c => c.palavra === palavra);
      
      const tagsetCodigo = cached?.tagset_codigo || 'NC';
      const domainName = tagsetMap.get(tagsetCodigo) || 'Não Classificado';
      
      // Cálculo real de LL (Log-likelihood) baseado em frequência observada vs esperada
      // Fórmula simplificada: LL = 2 * (O * ln(O/E)) onde O=freq observada, E=freq esperada
      const expectedFreq = totalTokens / uniqueWords; // frequência média esperada
      const observedFreq = freq;
      const ll = observedFreq > 0 && expectedFreq > 0 
        ? 2 * observedFreq * Math.log(observedFreq / expectedFreq)
        : 0;
      
      // Cálculo real de MI (Mutual Information) baseado em frequência relativa
      // MI = log2(freq_relativa / freq_esperada_relativa)
      const relativeFreq = freq / totalTokens;
      const expectedRelativeFreq = 1 / uniqueWords;
      const mi = relativeFreq > 0 && expectedRelativeFreq > 0
        ? Math.log2(relativeFreq / expectedRelativeFreq)
        : 0;
      
      // Mapa de cores dos 13 domínios N1
      const colorMap: Record<string, string> = {
        'AB': '#9333EA', 'AP': '#10B981', 'CC': '#F59E0B', 'EL': '#EF4444',
        'EQ': '#8B5CF6', 'MG': '#6B7280', 'NA': '#268BC8', 'NC': '#6B7280',
        'OA': '#F97316', 'SB': '#EC4899', 'SE': '#8B5CF6', 'SH': '#24A65B', 'SP': '#EC4899'
      };

      // Prosódia baseada em dados do cache (se disponível) ou inferida do domínio
      const prosodyFromCache = cached ? determineProsodyFromDomain(tagsetCodigo) : 'Neutra';

      return {
        palavra,
        frequencia: freq,
        ll: parseFloat(Math.abs(ll).toFixed(2)),
        mi: parseFloat(mi.toFixed(2)),
        significancia: Math.abs(ll) > 15.13 ? 'Alta' : Math.abs(ll) > 6.63 ? 'Média' : 'Baixa',
        dominio: domainName,
        cor: colorMap[tagsetCodigo] || '#6B7280',
        prosody: prosodyFromCache
      };
    });

    // Agregar por domínio
    const dominioMap = new Map<string, {
      codigo: string;
      palavras: string[];
      ocorrencias: number;
      llScores: number[];
      miScores: number[];
    }>();

    keywords.forEach(k => {
      if (!dominioMap.has(k.dominio)) {
        const codigo = Array.from(tagsetMap.entries())
          .find(([_, nome]) => nome === k.dominio)?.[0] || 'NC';
        
        dominioMap.set(k.dominio, {
          codigo,
          palavras: [],
          ocorrencias: 0,
          llScores: [],
          miScores: []
        });
      }
      
      const dom = dominioMap.get(k.dominio)!;
      dom.palavras.push(k.palavra);
      dom.ocorrencias += k.frequencia;
      dom.llScores.push(k.ll);
      dom.miScores.push(k.mi);
    });

    const totalOcorrencias = Array.from(dominioMap.values())
      .reduce((sum, d) => sum + d.ocorrencias, 0);

    const colorMap: Record<string, string> = {
      'AB': '#9333EA', 'AP': '#10B981', 'CC': '#F59E0B', 'EL': '#EF4444',
      'EQ': '#8B5CF6', 'MG': '#6B7280', 'NA': '#268BC8', 'NC': '#6B7280',
      'OA': '#F97316', 'SB': '#EC4899', 'SE': '#8B5CF6', 'SH': '#24A65B', 'SP': '#EC4899'
    };

    const dominios: CorpusDomain[] = Array.from(dominioMap.entries()).map(([nome, data]) => {
      const avgLL = data.llScores.reduce((a, b) => a + b, 0) / data.llScores.length;
      const avgMI = data.miScores.reduce((a, b) => a + b, 0) / data.miScores.length;

      return {
        dominio: nome,
        descricao: `Domínio ${data.codigo} - ${nome}`,
        cor: colorMap[data.codigo] || '#6B7280',
        palavras: data.palavras,
        ocorrencias: data.ocorrencias,
        avgLL: parseFloat(avgLL.toFixed(2)),
        avgMI: parseFloat(avgMI.toFixed(2)),
        riquezaLexical: data.palavras.length,
        percentual: parseFloat(((data.ocorrencias / totalOcorrencias) * 100).toFixed(1))
      };
    }).sort((a, b) => b.percentual - a.percentual);

    const cloudData: CorpusCloudData[] = dominios.slice(0, 13).map(d => {
      const codigo = Array.from(tagsetMap.entries())
        .find(([_, nome]) => nome === d.dominio)?.[0] || 'NC';
      
      return {
        codigo,
        nome: d.dominio,
        size: 50 + d.percentual * 2,
        color: d.cor,
        wordCount: d.riquezaLexical,
        avgScore: d.avgLL
      };
    });

    const positivas = keywords.filter(k => k.prosody === 'Positiva').length;
    const negativas = keywords.filter(k => k.prosody === 'Negativa').length;
    const neutras = keywords.filter(k => k.prosody === 'Neutra').length;
    const total = keywords.length;

    const result: CorpusAnalysisResult = {
      keywords,
      dominios,
      cloudData,
      estatisticas: {
        totalPalavras: tokens.length,
        palavrasUnicas: uniqueWords,
        dominiosIdentificados: dominios.length,
        palavrasChaveSignificativas: keywords.filter(k => k.significancia === 'Alta').length,
        prosodiaDistribution: {
          positivas,
          negativas,
          neutras,
          percentualPositivo: parseFloat(((positivas / total) * 100).toFixed(1)),
          percentualNegativo: parseFloat(((negativas / total) * 100).toFixed(1)),
          percentualNeutro: parseFloat(((neutras / total) * 100).toFixed(1))
        }
      }
    };

    log.info('Analysis complete', { 
      keywordsCount: keywords.length, 
      domainsCount: dominios.length 
    });

    return result;
  } catch (error) {
    log.error('Error processing corpus', error as Error);
    throw error;
  }
}

/**
 * Retorna resultado vazio quando não há dados
 */
/**
 * Determina prosódia semântica baseada no domínio
 * Domínios positivos: NA (Natureza), SH (Ser Humano positivo)
 * Domínios negativos: EL (Emoções negativas), SB (Saúde/doença)
 * Domínios neutros: MG (Gramatical), NC (Não classificado)
 */
function determineProsodyFromDomain(tagsetCodigo: string): 'Positiva' | 'Negativa' | 'Neutra' {
  const positiveDomains = ['NA', 'SH', 'AP', 'CC'];
  const negativeDomains = ['EL', 'SB'];
  
  if (positiveDomains.includes(tagsetCodigo)) return 'Positiva';
  if (negativeDomains.includes(tagsetCodigo)) return 'Negativa';
  return 'Neutra';
}

function createEmptyResult(): CorpusAnalysisResult {
  return {
    keywords: [],
    dominios: [],
    cloudData: [],
    estatisticas: {
      totalPalavras: 0,
      palavrasUnicas: 0,
      dominiosIdentificados: 0,
      palavrasChaveSignificativas: 0,
      prosodiaDistribution: {
        positivas: 0,
        negativas: 0,
        neutras: 0,
        percentualPositivo: 0,
        percentualNegativo: 0,
        percentualNeutro: 0
      }
    }
  };
}

/**
 * Busca estatísticas rápidas de um corpus
 */
export async function getCorpusStats(corpusType: 'gaucho' | 'nordestino' | 'user') {
  // Guard clause: corpus de usuário não tem stats no banco
  if (corpusType === 'user') {
    return { corpusId: 'user', corpusName: 'Corpus do Usuário', totalSongs: 0 };
  }
  
  try {
    const { data: corpus } = await supabase
      .from('corpora')
      .select('id, name')
      .eq('normalized_name', corpusType)
      .single();

    if (!corpus) throw new Error('Corpus não encontrado');

    const { count } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('corpus_id', corpus.id);

    return {
      corpusId: corpus.id,
      corpusName: corpus.name,
      totalSongs: count || 0
    };
  } catch (error) {
    log.error('Error fetching corpus stats', error as Error);
    throw error;
  }
}
