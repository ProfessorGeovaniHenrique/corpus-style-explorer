import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { createEdgeLogger } from "../_shared/unified-logger.ts";
import { corsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const log = createEdgeLogger('generate-artist-bio', requestId);
  
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { artistId, artistName } = await req.json();

    if (!artistId || !artistName) {
      log.warn('Missing required parameters', { artistId, artistName });
      return new Response(
        JSON.stringify({ error: 'artistId e artistName são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info('Biography generation started', { artistId, artistName });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const cacheKey = `artist_bio:${artistName.toLowerCase()}`;
    const { data: cachedBio } = await supabase
      .from('gemini_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    log.logDatabaseQuery('gemini_cache', 'select', cachedBio ? 1 : 0);

    let biography: string;
    let source: string;

    if (cachedBio) {
      log.logCacheHit(cacheKey, 'hit');
      biography = cachedBio.composer || '';
      source = 'cache';
      
      // FASE 4: PROTEÇÃO PREVENTIVA - Detectar e corrigir cache contaminado
      if (biography.includes('IA Generativa')) {
        log.warn('Contaminated cache detected, autocorrecting', { artistName });
        biography = biography.replace('(Fonte: IA Generativa)', '(Fonte: Base de Conhecimento Digital)');
        
        const { error: cacheUpdateError } = await supabase
          .from('gemini_cache')
          .update({ composer: biography })
          .eq('id', cachedBio.id);
        
        if (cacheUpdateError) {
          log.error('Failed to correct cache', new Error(cacheUpdateError.message), { artistName });
        } else {
          log.info('Cache autocorrected successfully', { artistName });
        }
      }
      
      // Update cache hit stats
      await supabase
        .from('gemini_cache')
        .update({
          hits_count: (cachedBio.hits_count || 0) + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq('id', cachedBio.id);
    } else {
      log.logCacheHit(cacheKey, 'miss');
      
      // Step 1: Try Wikipedia first
      log.info('Attempting Wikipedia search', { artistName });
      const wikipediaBio = await fetchWikipediaBio(artistName, log);

      if (wikipediaBio) {
        biography = wikipediaBio;
        source = 'wikipedia';
        log.info('Wikipedia biography found', { artistName });
      } else {
        // Step 2: Try Gemini 2.5 Pro
        if (geminiApiKey) {
          try {
            log.info('Wikipedia not found, trying Gemini 2.5 Pro', { artistName });
            
            const prompt = `Escreva uma biografia resumida, envolvente e informativa (máximo de 3 parágrafos) para o artista musical "${artistName}".
Foque no estilo musical, principais sucessos e importância histórica, especialmente no contexto da música gaúcha se aplicável.
Responda em Português do Brasil.
Retorne APENAS o texto da biografia, sem aspas ou formatação JSON.`;

            const apiTimer = log.startTimer();
            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [{ text: prompt }]
                  }],
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 800
                  }
                })
              }
            );

            const duration = apiTimer.end('gemini-biography');

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
              
              // VALIDAÇÃO CRÍTICA: Verificar se biografia tem conteúdo
              if (!geminiText || geminiText.trim().length < 50) {
                log.warn('Gemini returned empty or insufficient biography', { 
                  artistName, 
                  responseLength: geminiText.length,
                  rawResponse: JSON.stringify(geminiData).substring(0, 500)
                });
                throw new Error(`Biografia não disponível para ${artistName}`);
              }
              
              biography = geminiText;
              source = 'gemini_pro';
              
              log.logApiCall('gemini', 'biography', 'POST', 200, duration);
              log.info('Gemini 2.5 Pro biography generated', { artistName, biographyLength: biography.length });

              // Log API usage
              await supabase.from('gemini_api_usage').insert({
                function_name: 'generate-artist-bio',
                request_type: 'biography_generation',
                model_used: 'gemini-2.5-pro',
                success: true,
                tokens_input: geminiData.usageMetadata?.promptTokenCount || 0,
                tokens_output: geminiData.usageMetadata?.candidatesTokenCount || 0,
                metadata: { artist_name: artistName }
              });
            } else {
              log.logApiCall('gemini', 'biography', 'POST', geminiResponse.status, duration);
              throw new Error('Gemini API error');
            }
          } catch (geminiError) {
            log.error('Gemini API failed', geminiError instanceof Error ? geminiError : new Error(String(geminiError)), { artistName });
            throw new Error('Gemini API key configured but request failed');
          }
        } else {
          throw new Error('No API keys configured for biography generation');
        }
      }

      // Cache the result - only if valid
      if (biography && biography.trim().length >= 50) {
        await supabase.from('gemini_cache').insert({
          cache_key: cacheKey,
          artist: artistName,
          title: artistName,
          composer: biography,
          confidence: 'high',
          tokens_used: biography.length,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else {
        log.warn('Skipping cache - biography too short', { artistName, biographyLength: biography?.length || 0 });
      }
    }

    // Update artist table
    const { error: updateError } = await supabase
      .from('artists')
      .update({
        biography,
        biography_source: source,
        biography_updated_at: new Date().toISOString()
      })
      .eq('id', artistId);

    log.logDatabaseQuery('artists', 'update', 1);

    if (updateError) {
      log.error('Failed to update artist biography', new Error(updateError.message), { artistId, artistName });
      throw updateError;
    }

    log.info('Biography updated successfully', {
      artistName,
      artistId,
      source,
      biographyLength: biography.length,
      hasFonteText: biography.includes('Fonte:'),
      fonteExtracted: biography.match(/\(Fonte: ([^)]+)\)/)?.[1] || 'none'
    });

    return new Response(
      JSON.stringify({
        success: true,
        biography,
        source
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.fatal('Biography generation failed', error instanceof Error ? error : new Error(String(error)));
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false,
        requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchWikipediaBio(artistName: string, log: any): Promise<string | null> {
  try {
    const encodedName = encodeURIComponent(artistName);
    const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodedName}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MusicEnrichmentBot/1.0'
      }
    });

    if (response.status === 404) {
      log.debug('Wikipedia page not found', { artistName });
      return null;
    }

    if (!response.ok) {
      log.warn('Wikipedia API error', { artistName, status: response.status });
      return null;
    }

    const data = await response.json();

    if (data.extract && data.extract.trim()) {
      log.info('Wikipedia extract found', { artistName, length: data.extract.length });
      return `${data.extract}\n\n(Fonte: Wikipédia)`;
    }

    return null;

  } catch (error) {
    log.error('Wikipedia fetch failed', error instanceof Error ? error : new Error(String(error)), { artistName });
    return null;
  }
}

async function fetchAIBiography(artistName: string, apiKey: string, log: any): Promise<string> {
  const prompt = `Você é uma enciclopédia factual especializada em música brasileira.

Resuma a carreira do artista musical "${artistName}".

REGRAS CRÍTICAS:
1. Se você NÃO tiver informações CONFIÁVEIS e VERIFICADAS sobre este artista específico, responda APENAS: "Biografia não disponível no momento"
2. NÃO invente fatos, datas, álbuns, prêmios ou colaborações
3. NÃO confunda com outros artistas de nome similar
4. Se tiver dúvida, seja conservador e admita a falta de informação
5. Foque em fatos verificáveis: carreira musical, gênero, período de atividade
6. Máximo de 3-4 parágrafos

Retorne APENAS o texto da biografia, sem introduções ou explicações adicionais.`;

  try {
    const apiTimer = log.startTimer();
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
    });

    const duration = apiTimer.end('lovable-ai-biography');

    if (!response.ok) {
      const errorText = await response.text();
      log.logApiCall('lovable-ai', 'biography', 'POST', response.status, duration);

      if (response.status === 429) {
        log.warn('Lovable AI rate limit exceeded', { artistName });
        return 'Biografia temporariamente indisponível (limite de requisições atingido). Tente novamente em alguns instantes.';
      }

      if (response.status === 402) {
        log.warn('Lovable AI credits exhausted', { artistName });
        return 'Biografia temporariamente indisponível (créditos insuficientes).';
      }

      return 'Biografia não disponível no momento.';
    }

    log.logApiCall('lovable-ai', 'biography', 'POST', 200, duration);

    const data = await response.json();
    const biography = data.choices?.[0]?.message?.content || 'Biografia não disponível no momento.';

    return `${biography.trim()}\n\n(Fonte: Base de Conhecimento Digital)`;

  } catch (error) {
    log.error('Lovable AI biography failed', error instanceof Error ? error : new Error(String(error)), { artistName });
    return 'Biografia não disponível no momento.';
  }
}
