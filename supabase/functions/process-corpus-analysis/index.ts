/**
 * 🎯 PROCESS CORPUS ANALYSIS - Edge Function Genérica
 * 
 * Substitui process-demo-corpus e process-nordestino-corpus
 * Processa qualquer corpus real do banco de dados
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { withInstrumentation } from "../_shared/instrumentation.ts";
import { createHealthCheck } from "../_shared/health-check.ts";
import { createEdgeLogger } from '../_shared/unified-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(withInstrumentation('process-corpus-analysis', async (req) => {
  const requestId = crypto.randomUUID();
  const log = createEdgeLogger('process-corpus-analysis', requestId);

  // Health check
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('health') === 'true') {
    const health = await createHealthCheck('process-corpus-analysis', '1.0.0');
    return new Response(JSON.stringify(health), {
      status: health.status === 'healthy' ? 200 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { corpusType, limit = 1000, enrichedOnly = false } = await req.json();

    log.info('Processing corpus', { corpusType, limit, enrichedOnly });

    if (!corpusType || !['gaucho', 'nordestino'].includes(corpusType)) {
      throw new Error('corpusType inválido. Use "gaucho" ou "nordestino"');
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar corpus_id
    const { data: corpus, error: corpusError } = await supabase
      .from('corpora')
      .select('id, name')
      .eq('normalized_name', corpusType === 'gaucho' ? 'gaucho_music' : 'nordestino_music')
      .single();

    if (corpusError || !corpus) {
      log.error('Corpus not found', corpusError);
      throw new Error(`Corpus ${corpusType} não encontrado`);
    }

    log.info('Corpus found', { corpusId: corpus.id, name: corpus.name });

    // Buscar músicas
    let query = supabase
      .from('songs')
      .select('id, title, lyrics')
      .eq('corpus_id', corpus.id)
      .not('lyrics', 'is', null);

    if (enrichedOnly) {
      query = query.eq('status', 'enriched');
    }

    query = query.limit(limit);

    const { data: songs, error: songsError } = await query;

    if (songsError) {
      log.error('Error fetching songs', songsError);
      throw songsError;
    }

    if (!songs || songs.length === 0) {
      log.warn('No songs found');
      return new Response(JSON.stringify({
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
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log.info('Songs loaded', { count: songs.length });

    // Concatenar letras
    const allLyrics = songs.map(s => s.lyrics).join(' ');

    // Tokenizar
    const tokens = allLyrics
      .toLowerCase()
      .replace(/[.,!?;:"()]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);

    // Calcular frequências
    const freqMap = new Map<string, number>();
    tokens.forEach(token => {
      freqMap.set(token, (freqMap.get(token) || 0) + 1);
    });

    const totalTokens = tokens.length;
    const uniqueWords = freqMap.size;

    log.info('Tokenization complete', { totalTokens, uniqueWords });

    // Buscar tagsets N1
    const { data: tagsets } = await supabase
      .from('semantic_tagset')
      .select('codigo, nome, cor')
      .eq('status', 'ativo')
      .eq('nivel_profundidade', 1);

    const n1Tagsets = tagsets || [];

    // Top 100 palavras mais frequentes
    const topWords = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);

    // Simular classificação (TODO: integrar com annotate-semantic-domain)
    const keywords = topWords.map(([palavra, freq]) => {
      const randomDomain = n1Tagsets[Math.floor(Math.random() * n1Tagsets.length)];
      const ll = Math.random() * 50 + 10;
      const mi = Math.random() * 8 + 2;

      return {
        palavra,
        frequencia: freq,
        ll: parseFloat(ll.toFixed(2)),
        mi: parseFloat(mi.toFixed(2)),
        significancia: ll > 15.13 ? 'Alta' : ll > 6.63 ? 'Média' : 'Baixa',
        dominio: randomDomain?.nome || 'Não Classificado',
        cor: randomDomain?.cor || '#6B7280',
        prosody: Math.random() > 0.6 ? 'Positiva' : Math.random() > 0.5 ? 'Negativa' : 'Neutra'
      };
    });

    // Agregar domínios
    const dominioMap = new Map();
    keywords.forEach(k => {
      if (!dominioMap.has(k.dominio)) {
        dominioMap.set(k.dominio, {
          palavras: [],
          ocorrencias: 0,
          llScores: [],
          miScores: []
        });
      }
      const dom = dominioMap.get(k.dominio);
      dom.palavras.push(k.palavra);
      dom.ocorrencias += k.frequencia;
      dom.llScores.push(k.ll);
      dom.miScores.push(k.mi);
    });

    const totalOcorrencias = Array.from(dominioMap.values())
      .reduce((sum: number, d: any) => sum + d.ocorrencias, 0);

    const dominios = Array.from(dominioMap.entries()).map(([nome, data]: [string, any]) => {
      const tagset = n1Tagsets.find(t => t.nome === nome);
      const avgLL = data.llScores.reduce((a: number, b: number) => a + b, 0) / data.llScores.length;
      const avgMI = data.miScores.reduce((a: number, b: number) => a + b, 0) / data.miScores.length;

      return {
        dominio: nome,
        descricao: tagset ? `Domínio semântico ${tagset.codigo}` : 'Domínio semântico',
        cor: tagset?.cor || '#6B7280',
        palavras: data.palavras,
        ocorrencias: data.ocorrencias,
        avgLL: parseFloat(avgLL.toFixed(2)),
        avgMI: parseFloat(avgMI.toFixed(2)),
        riquezaLexical: data.palavras.length,
        percentual: parseFloat(((data.ocorrencias / totalOcorrencias) * 100).toFixed(1))
      };
    }).sort((a, b) => b.percentual - a.percentual);

    // Cloud data
    const cloudData = dominios.slice(0, 15).map(d => ({
      codigo: d.dominio.substring(0, 3).toUpperCase(),
      nome: d.dominio,
      size: 50 + d.percentual * 2,
      color: d.cor,
      wordCount: d.riquezaLexical,
      avgScore: d.avgLL
    }));

    // Prosódia
    const positivas = keywords.filter(k => k.prosody === 'Positiva').length;
    const negativas = keywords.filter(k => k.prosody === 'Negativa').length;
    const neutras = keywords.filter(k => k.prosody === 'Neutra').length;

    const result = {
      keywords,
      dominios,
      cloudData,
      estatisticas: {
        totalPalavras: totalTokens,
        palavrasUnicas: uniqueWords,
        dominiosIdentificados: dominios.length,
        palavrasChaveSignificativas: keywords.filter(k => k.significancia === 'Alta').length,
        prosodiaDistribution: {
          positivas,
          negativas,
          neutras,
          percentualPositivo: parseFloat(((positivas / keywords.length) * 100).toFixed(1)),
          percentualNegativo: parseFloat(((negativas / keywords.length) * 100).toFixed(1)),
          percentualNeutro: parseFloat(((neutras / keywords.length) * 100).toFixed(1))
        }
      }
    };

    log.info('Processing complete', { 
      keywordsCount: keywords.length,
      domainsCount: dominios.length 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Error processing corpus', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}));
