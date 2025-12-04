import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface InsigniaAnalysis {
  palavra: string;
  insignias_sugeridas: string[];
  confianca: number;
  justificativa: string;
  conflito_detectado: boolean;
}

const INSIGNIA_PROMPT = `Você é um especialista em culturas regionais brasileiras. Analise a palavra fornecida e determine suas insígnias culturais.

Insígnias disponíveis:
- Gaúcho: cultura do Rio Grande do Sul, lida campeira, tradição gauchesca
- Nordestino: cultura do Nordeste brasileiro, sertão, forró, baião
- Caipira: cultura do interior de SP, MG, GO, viola caipira
- Platino: influência argentina/uruguaia, espanhol platino
- Indígena: origem indígena brasileira, tupi-guarani
- Afro-Brasileiro: origem africana/afro-brasileira, candomblé, capoeira

IMPORTANTE: 
- Uma palavra pode ter MÚLTIPLAS insígnias (ex: "xergão" é Gaúcho E Platino)
- Palavras comuns/genéricas NÃO devem ter insígnias (ex: "amor", "sol", "casa")
- Apenas atribua insígnias para palavras com clara identidade cultural regional

Retorne APENAS um JSON válido no formato:
{
  "insignias": ["Gaúcho"],
  "confianca": 0.95,
  "justificativa": "Termo típico da lida campeira gaúcha"
}

Se a palavra NÃO tiver identidade cultural regional clara, retorne:
{
  "insignias": [],
  "confianca": 0.90,
  "justificativa": "Palavra comum sem marcador cultural específico"
}`;

async function analyzeWithGemini(palavras: string[], corpusAtual?: string): Promise<InsigniaAnalysis[]> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY não configurada');
  }

  const results: InsigniaAnalysis[] = [];
  
  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < palavras.length; i += batchSize) {
    const batch = palavras.slice(i, i + batchSize);
    
    const prompt = `${INSIGNIA_PROMPT}

${corpusAtual ? `Contexto: Estas palavras aparecem no corpus de música ${corpusAtual}.` : ''}

Analise as seguintes palavras e retorne um array JSON com a análise de cada uma:

Palavras: ${batch.join(', ')}

Retorne APENAS um array JSON válido como:
[
  {"palavra": "gateado", "insignias": ["Gaúcho"], "confianca": 0.95, "justificativa": "..."},
  {"palavra": "sertão", "insignias": ["Nordestino"], "confianca": 0.90, "justificativa": "..."}
]`;

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Você é um especialista em culturas regionais brasileiras. Responda APENAS com JSON válido.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error(`Gemini API error: ${response.status}`);
        // Add empty results for failed batch
        batch.forEach(palavra => {
          results.push({
            palavra,
            insignias_sugeridas: [],
            confianca: 0,
            justificativa: 'Erro na análise',
            conflito_detectado: false,
          });
        });
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.forEach((item: any) => {
          const conflito = corpusAtual ? detectConflict(item.insignias || [], corpusAtual) : false;
          results.push({
            palavra: item.palavra,
            insignias_sugeridas: item.insignias || [],
            confianca: item.confianca || 0.5,
            justificativa: item.justificativa || '',
            conflito_detectado: conflito,
          });
        });
      }
    } catch (error: any) {
      console.error('Error processing batch:', error);
      batch.forEach(palavra => {
        results.push({
          palavra,
          insignias_sugeridas: [],
          confianca: 0,
          justificativa: `Erro: ${error?.message || 'Unknown error'}`,
          conflito_detectado: false,
        });
      });
    }
    
    // Rate limiting delay
    if (i + batchSize < palavras.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

function detectConflict(insignias: string[], corpusAtual: string): boolean {
  const corpusLower = corpusAtual.toLowerCase();
  
  if (corpusLower.includes('nordestino')) {
    // Nordestino corpus should not have ONLY Gaúcho insignia
    if (insignias.length === 1 && insignias[0] === 'Gaúcho') {
      return true;
    }
  }
  
  if (corpusLower.includes('gaucho') || corpusLower.includes('gaúcho')) {
    // Gaúcho corpus should not have ONLY Nordestino insignia
    if (insignias.length === 1 && insignias[0] === 'Nordestino') {
      return true;
    }
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, palavras, palavra, corpus_atual } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (mode === 'single') {
      // Single word analysis
      if (!palavra) {
        return new Response(
          JSON.stringify({ error: 'Palavra é obrigatória' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = await analyzeWithGemini([palavra], corpus_atual);
      return new Response(
        JSON.stringify({ success: true, result: results[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'batch') {
      // Batch analysis
      if (!palavras || !Array.isArray(palavras) || palavras.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Array de palavras é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = await analyzeWithGemini(palavras, corpus_atual);
      return new Response(
        JSON.stringify({ success: true, results, total: results.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'detect_conflicts') {
      // Detect conflicts in existing data
      const { data: conflicts, error } = await supabase
        .from('semantic_disambiguation_cache')
        .select(`
          id,
          palavra,
          insignias_culturais,
          song_id,
          artist_id
        `)
        .not('insignias_culturais', 'is', null)
        .limit(1000);

      if (error) throw error;

      // Get song and artist corpus info
      const conflictResults: any[] = [];
      
      for (const entry of conflicts || []) {
        if (!entry.insignias_culturais || entry.insignias_culturais.length === 0) continue;
        
        let corpusType: string | null = null;
        
        if (entry.song_id) {
          const { data: songData } = await supabase
            .from('songs')
            .select('corpus_id, corpora!inner(normalized_name)')
            .eq('id', entry.song_id)
            .single();
          
          corpusType = (songData?.corpora as any)?.normalized_name || null;
        } else if (entry.artist_id) {
          const { data: artistData } = await supabase
            .from('artists')
            .select('corpus_id, corpora!inner(normalized_name)')
            .eq('id', entry.artist_id)
            .single();
          
          corpusType = (artistData?.corpora as any)?.normalized_name || null;
        }

        if (corpusType && detectConflict(entry.insignias_culturais, corpusType)) {
          conflictResults.push({
            id: entry.id,
            palavra: entry.palavra,
            insignias_atuais: entry.insignias_culturais,
            corpus: corpusType,
            conflito: true,
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          conflicts: conflictResults,
          total_conflicts: conflictResults.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'apply_suggestion') {
      // Apply suggested insignias to a word
      const { id, insignias } = await req.json();
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({
          insignias_culturais: insignias || [],
          fonte: 'manual',
          confianca: 1.0,
        })
        .eq('id', id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Mode inválido. Use: single, batch, detect_conflicts, apply_suggestion' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
