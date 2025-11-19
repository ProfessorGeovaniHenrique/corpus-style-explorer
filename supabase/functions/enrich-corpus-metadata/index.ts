import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentRequest {
  artista: string;
  musica: string;
  album?: string;
  ano?: string;
  corpusType?: 'gaucho' | 'nordestino';
}

interface EnrichmentResult {
  compositor?: string;
  album?: string;
  ano?: string;
  fonte: 'musicbrainz' | 'ai-inferred' | 'not-found';
  confianca: number; // 0-100
  detalhes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artista, musica, album, ano, corpusType }: EnrichmentRequest = await req.json();
    
    console.log(`🔍 Enriquecendo: ${artista} - ${musica}`);

    // STEP 1: Try MusicBrainz API
    let result = await queryMusicBrainz(artista, musica);
    
    // STEP 2: If MusicBrainz fails, use Lovable AI
    if (result.fonte === 'not-found') {
      result = await queryLovableAI(artista, musica, album, ano, corpusType);
    }

    console.log(`✅ Resultado: ${result.fonte} (${result.confianca}% confiança)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Erro no enriquecimento:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        fonte: 'not-found',
        confianca: 0
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Query MusicBrainz API for metadata
 * https://musicbrainz.org/doc/MusicBrainz_API
 */
async function queryMusicBrainz(
  artista: string, 
  musica: string
): Promise<EnrichmentResult> {
  try {
    // MusicBrainz requires URL encoding and user agent
    const query = encodeURIComponent(`artist:"${artista}" AND recording:"${musica}"`);
    const url = `https://musicbrainz.org/ws/2/recording/?query=${query}&fmt=json&limit=5`;
    
    console.log(`📡 MusicBrainz query: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CorpusAnalyzer/1.0 (research@example.com)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ MusicBrainz returned ${response.status}`);
      return { fonte: 'not-found', confianca: 0 };
    }

    const data = await response.json();
    
    if (!data.recordings || data.recordings.length === 0) {
      console.log('📭 MusicBrainz: Nenhum resultado');
      return { fonte: 'not-found', confianca: 0 };
    }

    // Get best match (first result with highest score)
    const bestMatch = data.recordings[0];
    const score = bestMatch.score || 0; // MusicBrainz score 0-100
    
    // Extract composer from credits
    let compositor: string | undefined;
    const credits = bestMatch['artist-credit'] || [];
    
    if (credits.length > 0) {
      compositor = credits[0]?.name;
    }

    // Extract release info (album, year)
    let album: string | undefined;
    let ano: string | undefined;
    
    if (bestMatch.releases && bestMatch.releases.length > 0) {
      const release = bestMatch.releases[0];
      album = release.title;
      
      if (release.date) {
        ano = release.date.split('-')[0]; // Extract year from YYYY-MM-DD
      }
    }

    console.log(`✅ MusicBrainz: Compositor=${compositor}, Score=${score}`);

    return {
      compositor,
      album,
      ano,
      fonte: 'musicbrainz',
      confianca: score,
      detalhes: `MusicBrainz ID: ${bestMatch.id}`
    };

  } catch (error) {
    console.error('❌ MusicBrainz error:', error);
    return { fonte: 'not-found', confianca: 0 };
  }
}

/**
 * Query Lovable AI (Gemini) for metadata inference
 */
async function queryLovableAI(
  artista: string,
  musica: string,
  album?: string,
  ano?: string,
  corpusType?: string
): Promise<EnrichmentResult> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY não configurada');
      return { fonte: 'not-found', confianca: 0 };
    }

    const contextoCultural = corpusType === 'gaucho' 
      ? 'música gaúcha/regionalista do Rio Grande do Sul'
      : corpusType === 'nordestino'
      ? 'música nordestina/forró/baião do Nordeste brasileiro'
      : 'música popular brasileira';

    const prompt = `Você é um especialista em música popular brasileira, com profundo conhecimento sobre compositores, parcerias e histórico de gravações.

**TAREFA:** Identifique o compositor da seguinte ${contextoCultural}:

📌 **Artista/Intérprete:** ${artista}
🎵 **Música:** ${musica}
${album ? `💿 **Álbum:** ${album}` : ''}
${ano ? `📅 **Ano:** ${ano}` : ''}

**INSTRUÇÕES:**
1. Se você conhece o compositor com certeza, retorne APENAS o nome completo (ex: "Raul Torres e João Pacífico")
2. Se o artista é o próprio compositor (autoral), repita o nome do artista
3. Se for uma música tradicional/domínio público, responda "Tradicional"
4. Se você NÃO tiver certeza, responda "Desconhecido"

**IMPORTANTE:** 
- Para parcerias, liste ambos os nomes separados por "e" (ex: "Tonico e Tinoco")
- Não invente informações - apenas responda se tiver conhecimento confiável
- Priorize compositores brasileiros e regionais conhecidos

**RESPOSTA (apenas o nome):**`;

    console.log(`🤖 Consultando Lovable AI...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em música brasileira. Seja preciso e conciso.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Lovable AI error: ${response.status} - ${errorText}`);
      return { fonte: 'not-found', confianca: 0 };
    }

    const data = await response.json();
    const compositor = data.choices?.[0]?.message?.content?.trim();

    if (!compositor || compositor === 'Desconhecido') {
      console.log('🤖 AI: Compositor desconhecido');
      return { fonte: 'not-found', confianca: 0 };
    }

    // Parse response to extract composer name from complex responses
    let compositorExtraido = compositor;

    // Se a resposta contiver explicações, extrair apenas o nome
    if (compositor.includes('compost') || compositor.includes('autor')) {
      const nomeMatch = compositor.match(/(?:compositor(?:es)?|autor(?:es)?|parceria|por)\s*:?\s*([A-ZÇÁÉÍÓÚÂÊÔÃÕ][a-zçáéíóúâêôãõ]+(?:\s+[A-ZÇÁÉÍÓÚÂÊÔÃÕ][a-zçáéíóúâêôãõ]+)*(?:\s+e\s+[A-ZÇÁÉÍÓÚÂÊÔÃÕ][a-zçáéíóúâêôãõ]+(?:\s+[A-ZÇÁÉÍÓÚÂÊÔÃÕ][a-zçáéíóúâêôãõ]+)*)?)/i);
      
      if (nomeMatch) {
        compositorExtraido = nomeMatch[1].trim();
        console.log(`🎯 Nome extraído de contexto: ${compositorExtraido}`);
      }
    }

    // Validar que não é uma resposta genérica
    if (compositorExtraido.toLowerCase().includes('desconhecido') || 
        compositorExtraido.toLowerCase().includes('não encontr')) {
      return { fonte: 'not-found', confianca: 0 };
    }

    // Calcular confiança baseada em indicadores
    let confianca = 70; // Base

    // Aumentar confiança se:
    if (compositorExtraido.length > 5 && compositorExtraido.includes(' ')) {
      confianca += 10; // Nome completo provavelmente correto
    }

    if (artista.toLowerCase() === compositorExtraido.toLowerCase()) {
      confianca += 15; // Música autoral (alta confiança)
    }

    if (compositorExtraido.includes(' e ')) {
      confianca += 5; // Parceria identificada
    }

    // Diminuir confiança se:
    if (compositorExtraido.length < 5) {
      confianca -= 20; // Nome muito curto (suspeito)
    }

    if (!compositorExtraido.match(/^[A-ZÇÁÉÍÓÚÂÊÔÃÕ]/)) {
      confianca -= 15; // Não começa com maiúscula
    }

    confianca = Math.min(Math.max(confianca, 30), 95); // Limitar entre 30-95%

    console.log(`✅ AI inferiu: ${compositorExtraido} (${confianca}% confiança)`);

    return {
      compositor: compositorExtraido,
      fonte: 'ai-inferred',
      confianca,
      detalhes: `Gemini 2.5 Flash | Contexto: ${contextoCultural} | Confiança: ${confianca}%${
        compositorExtraido !== compositor ? ` | Original: "${compositor.slice(0, 100)}..."` : ''
      }`
    };

  } catch (error) {
    console.error('❌ Lovable AI error:', error);
    return { fonte: 'not-found', confianca: 0 };
  }
}
