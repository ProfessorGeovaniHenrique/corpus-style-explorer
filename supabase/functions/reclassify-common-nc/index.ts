import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Mapeamento de palavras comuns frequentemente classificadas como NC
 * para seus tagsets corretos baseados em análise linguística
 */
const COMMON_WORDS_MAP: Record<string, { tagset: string; nome: string; confianca: number }> = {
  // ============================================
  // VERBOS DE ESTADO (AC.EST)
  // ============================================
  'serve': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.92 },
  'tinha': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'tenho': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'tem': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'temos': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'tinham': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'fiquem': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.90 },
  'fica': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.92 },
  'ficou': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.92 },
  'ficar': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.92 },
  'estão': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'estava': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'estavam': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'faltava': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.90 },
  'viveu': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.88 },
  'vive': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.88 },
  'é': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.98 },
  'era': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.98 },
  'são': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.98 },
  'foram': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'há': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.95 },
  'houve': { tagset: 'AC.EST', nome: 'Ação - Estado', confianca: 0.92 },
  
  // ============================================
  // VERBOS COGNITIVOS (AC.COG)
  // ============================================
  'sei': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.95 },
  'sabe': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.95 },
  'sabia': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.95 },
  'penso': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.92 },
  'pensa': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.92 },
  'pensou': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.92 },
  'acho': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.90 },
  'achou': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.90 },
  'lembro': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.92 },
  'lembra': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.92 },
  'entendo': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.90 },
  'entende': { tagset: 'AC.COG', nome: 'Ação - Cognitiva', confianca: 0.90 },
  
  // ============================================
  // VERBOS DE MOVIMENTO (AC.MOV)
  // ============================================
  'deixou': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.88 },
  'deixa': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.88 },
  'paira': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.85 },
  'vem': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.92 },
  'venho': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.92 },
  'veio': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.92 },
  'vai': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.95 },
  'vou': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.95 },
  'foi': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.92 },
  'cai': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.88 },
  'caiu': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.88 },
  'vaza': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.85 },
  'encosta': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.85 },
  'atora': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.80 },
  'sai': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.92 },
  'saiu': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.92 },
  'chega': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.90 },
  'chegou': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.90 },
  'volta': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.90 },
  'voltou': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.90 },
  'passa': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.88 },
  'passou': { tagset: 'AC.MOV', nome: 'Ação - Movimento', confianca: 0.88 },
  
  // ============================================
  // VERBOS DE TRANSFORMAÇÃO (AC.TRF)
  // ============================================
  'desaba': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.85 },
  'expande': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.85 },
  'avulta': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.80 },
  'acaba': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.88 },
  'acabou': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.88 },
  'deu': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.85 },
  'virou': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.88 },
  'vira': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.88 },
  'mudou': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.90 },
  'muda': { tagset: 'AC.TRF', nome: 'Ação - Transformação', confianca: 0.90 },
  
  // ============================================
  // ABSTRAÇÕES ESPACIAIS (AB.ESP)
  // ============================================
  'fora': { tagset: 'AB.ESP', nome: 'Abstração - Espacial', confianca: 0.88 },
  'dentro': { tagset: 'AB.ESP', nome: 'Abstração - Espacial', confianca: 0.90 },
  'longe': { tagset: 'AB.ESP', nome: 'Abstração - Espacial', confianca: 0.90 },
  'perto': { tagset: 'AB.ESP', nome: 'Abstração - Espacial', confianca: 0.90 },
  'além': { tagset: 'AB.ESP', nome: 'Abstração - Espacial', confianca: 0.88 },
  'aquém': { tagset: 'AB.ESP', nome: 'Abstração - Espacial', confianca: 0.85 },
  
  // ============================================
  // ABSTRAÇÕES TEMPORAIS (AB.TMP)
  // ============================================
  'ontem': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.95 },
  'hoje': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.95 },
  'amanhã': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.95 },
  'antes': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.92 },
  'depois': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.92 },
  'agora': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.95 },
  'sempre': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.90 },
  'nunca': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.90 },
  'já': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.92 },
  'ainda': { tagset: 'AB.TMP', nome: 'Abstração - Temporal', confianca: 0.90 },
  
  // ============================================
  // MARCADORES GRAMATICAIS - ADVÉRBIOS (MG.ADV)
  // ============================================
  'bem': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.90 },
  'mal': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.90 },
  'mais': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.92 },
  'menos': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.92 },
  'muito': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.95 },
  'pouco': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.92 },
  'tanto': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.90 },
  'tão': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.92 },
  'assim': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.88 },
  'só': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.90 },
  'também': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.92 },
  'então': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.88 },
  'lá': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.90 },
  'cá': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.90 },
  'aqui': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.92 },
  'ali': { tagset: 'MG.ADV', nome: 'Advérbio', confianca: 0.92 },
  
  // ============================================
  // MARCADORES GRAMATICAIS - INTERJEIÇÕES (MG.INT)
  // ============================================
  'né': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.95 },
  'ah': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.92 },
  'oh': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.92 },
  'eh': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.90 },
  'ui': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.88 },
  'ai': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.92 },
  'oi': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.90 },
  'tchê': { tagset: 'MG.INT', nome: 'Interjeição (Regional)', confianca: 0.95 },
  'bah': { tagset: 'MG.INT', nome: 'Interjeição (Regional)', confianca: 0.95 },
  'eita': { tagset: 'MG.INT', nome: 'Interjeição (Regional)', confianca: 0.95 },
  'oxe': { tagset: 'MG.INT', nome: 'Interjeição (Regional)', confianca: 0.95 },
  'uai': { tagset: 'MG.INT', nome: 'Interjeição (Regional)', confianca: 0.95 },
  'opa': { tagset: 'MG.INT', nome: 'Interjeição', confianca: 0.92 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = 'analyze' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`[reclassify-common-nc] Mode: ${mode}`);
    
    if (mode === 'analyze') {
      // Análise: contar quantas palavras NC seriam afetadas
      const palavrasComuns = Object.keys(COMMON_WORDS_MAP);
      
      const { data: ncWords, error } = await supabase
        .from('semantic_disambiguation_cache')
        .select('palavra')
        .eq('tagset_codigo', 'NC')
        .in('palavra', palavrasComuns);
      
      if (error) throw error;
      
      const foundWords = ncWords?.map(w => w.palavra) || [];
      const mappedWords = foundWords.map(p => ({
        palavra: p,
        ...COMMON_WORDS_MAP[p.toLowerCase()]
      }));
      
      return new Response(JSON.stringify({
        success: true,
        mode: 'analyze',
        total_common_words_in_map: palavrasComuns.length,
        nc_words_found: foundWords.length,
        words_to_reclassify: mappedWords
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (mode === 'execute') {
      // Execução: reclassificar palavras NC
      const results = {
        reclassified: 0,
        errors: 0,
        details: [] as Array<{ palavra: string; tagset: string; success: boolean }>
      };
      
      for (const [palavra, mapping] of Object.entries(COMMON_WORDS_MAP)) {
        const { data, error } = await supabase
          .from('semantic_disambiguation_cache')
          .update({
            tagset_codigo: mapping.tagset,
            tagset_nome: mapping.nome,
            confianca: mapping.confianca,
            fonte: 'batch_curation_common_words'
          })
          .eq('palavra', palavra)
          .eq('tagset_codigo', 'NC')
          .select('id');
        
        if (error) {
          console.error(`Error reclassifying ${palavra}:`, error.message);
          results.errors++;
          results.details.push({ palavra, tagset: mapping.tagset, success: false });
        } else if (data && data.length > 0) {
          results.reclassified += data.length;
          results.details.push({ palavra, tagset: mapping.tagset, success: true });
          console.log(`[reclassify-common-nc] Reclassified ${palavra} -> ${mapping.tagset} (${data.length} entries)`);
        }
      }
      
      // Contar NC restantes
      const { count: remainingNC } = await supabase
        .from('semantic_disambiguation_cache')
        .select('*', { count: 'exact', head: true })
        .eq('tagset_codigo', 'NC');
      
      return new Response(JSON.stringify({
        success: true,
        mode: 'execute',
        reclassified: results.reclassified,
        errors: results.errors,
        remaining_nc: remainingNC || 0,
        details: results.details.filter(d => d.success)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Invalid mode. Use "analyze" or "execute"'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[reclassify-common-nc] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
