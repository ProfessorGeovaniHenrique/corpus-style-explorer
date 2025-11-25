import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createEdgeLogger } from '../_shared/unified-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LexiconStats {
  gaucho: {
    total: number;
    validados: number;
    confianca_media: number;
    campeiros: number;
    platinismos: number;
  };
  navarro: {
    total: number;
    validados: number;
    confianca_media: number;
  };
  gutenberg: {
    total: number;
    validados: number;
    confianca_media: number;
  };
  rochaPombo: {
    total: number;
    validados: number;
  };
  unesp: {
    total: number;
  };
  overall: {
    total_entries: number;
    validation_rate: number;
    last_import: string | null;
    unique_words: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const log = createEdgeLogger('get-lexicon-stats', requestId);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    log.info('Fetching lexicon stats');

    // ✅ UPGRADE V2.0: Queries corrigidas para tipos reais de dicionário
    const [
      gauchoData,
      navarroData,
      gutenbergResult,
      rochaPomboResult,
      rochaPomboValidadosResult,
      unespResult,
      lastImportResult,
      uniqueWordsResult
    ] = await Promise.all([
      // Gaúcho: buscar todos os tipos gaúcho unificados
      supabase
        .from('dialectal_lexicon')
        .select('validado_humanamente, confianca_extracao, origem_regionalista, influencia_platina', { count: 'exact' })
        .in('tipo_dicionario', ['gaucho_unificado', 'gaucho_unificado_v2', 'dialectal_I', 'dialectal_II']),
      
      // Navarro: buscar pelo tipo correto
      supabase
        .from('dialectal_lexicon')
        .select('validado_humanamente, confianca_extracao', { count: 'exact' })
        .eq('tipo_dicionario', 'navarro_2014'),
      
      // Gutenberg
      supabase.rpc('get_gutenberg_stats'),
      
      // Rocha Pombo total
      supabase
        .from('lexical_synonyms')
        .select('*', { count: 'exact', head: true })
        .eq('fonte', 'rocha_pombo'),
      
      // Rocha Pombo validados
      supabase
        .from('lexical_synonyms')
        .select('*', { count: 'exact', head: true })
        .eq('fonte', 'rocha_pombo')
        .eq('validado_humanamente', true),
      
      // UNESP
      supabase
        .from('lexical_definitions')
        .select('*', { count: 'exact', head: true }),
      
      // Última importação
      supabase
        .from('dictionary_import_jobs')
        .select('tempo_fim')
        .eq('status', 'concluido')
        .order('tempo_fim', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Palavras únicas (estimativa via verbete_normalizado distinct)
      supabase
        .from('dialectal_lexicon')
        .select('verbete_normalizado', { count: 'exact', head: true })
    ]);

    // Processar Gaúcho
    const gauchoStats = {
      total: gauchoData.count || 0,
      validados: gauchoData.data?.filter(d => d.validado_humanamente).length || 0,
      confianca_media: gauchoData.data && gauchoData.data.length > 0
        ? gauchoData.data.reduce((acc, d) => acc + (d.confianca_extracao || 0), 0) / gauchoData.data.length
        : 0,
      campeiros: gauchoData.data?.filter(d => d.origem_regionalista?.includes('campeiro')).length || 0,
      platinismos: gauchoData.data?.filter(d => d.influencia_platina).length || 0,
    };

    // Processar Navarro
    const navarroStats = {
      total: navarroData.count || 0,
      validados: navarroData.data?.filter(d => d.validado_humanamente).length || 0,
      confianca_media: navarroData.data && navarroData.data.length > 0
        ? navarroData.data.reduce((acc, d) => acc + (d.confianca_extracao || 0), 0) / navarroData.data.length
        : 0,
    };

    // Processar Gutenberg
    const gutenbergData = gutenbergResult.data?.[0] || {
      total: 0,
      validados: 0,
      confianca_media: 0
    };

    const totalValidados = gauchoStats.validados + navarroStats.validados + (gutenbergData.validados || 0) + (rochaPomboValidadosResult.count || 0);
    const totalEntradas = gauchoStats.total + navarroStats.total + (gutenbergData.total || 0) + (rochaPomboResult.count || 0);

    const stats: LexiconStats = {
      gaucho: gauchoStats,
      navarro: navarroStats,
      gutenberg: {
        total: gutenbergData.total || 0,
        validados: gutenbergData.validados || 0,
        confianca_media: parseFloat(gutenbergData.confianca_media || '0'),
      },
      rochaPombo: {
        total: rochaPomboResult.count || 0,
        validados: rochaPomboValidadosResult.count || 0,
      },
      unesp: {
        total: unespResult.count || 0,
      },
      overall: {
        total_entries: totalEntradas + (unespResult.count || 0),
        validation_rate: totalEntradas > 0 ? totalValidados / totalEntradas : 0,
        last_import: lastImportResult.data?.tempo_fim || null,
        unique_words: uniqueWordsResult.count || 0,
      },
    };

    log.info('Stats fetched successfully', { totalEntries: stats.overall.total_entries });

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    log.error('Error fetching stats', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});