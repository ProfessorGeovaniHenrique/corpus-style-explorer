import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistId, artistName } = await req.json();

    if (!artistId || !artistName) {
      return new Response(
        JSON.stringify({ error: 'artistId e artistName são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const cacheKey = `artist_bio:${artistName.toLowerCase()}`;
    const { data: cachedBio } = await supabase
      .from('gemini_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    let biography: string;
    let source: string;

    if (cachedBio) {
      console.log(`Cache hit for artist: ${artistName}`);
      biography = cachedBio.composer || '';
      source = 'cache';
      
      // Update cache hit stats
      await supabase
        .from('gemini_cache')
        .update({
          hits_count: (cachedBio.hits_count || 0) + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq('id', cachedBio.id);
    } else {
      console.log(`Cache miss for artist: ${artistName}. Calling Gemini API...`);
      
      const prompt = `Escreva uma biografia resumida, envolvente e informativa (máximo de 3 parágrafos) para o artista musical "${artistName}".
Foque no estilo musical, principais sucessos e importância histórica, especialmente no contexto da música gaúcha se aplicável.
Responda em Português do Brasil.
Retorne APENAS o texto da biografia, sem aspas ou formatação JSON.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', errorText);
        throw new Error('Falha ao gerar biografia via Gemini');
      }

      const geminiData = await geminiResponse.json();
      biography = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      source = 'gemini';

      // Log API usage
      await supabase.from('gemini_api_usage').insert({
        function_name: 'generate-artist-bio',
        request_type: 'biography_generation',
        model_used: 'gemini-2.5-flash',
        success: true,
        tokens_input: geminiData.usageMetadata?.promptTokenCount || 0,
        tokens_output: geminiData.usageMetadata?.candidatesTokenCount || 0,
        metadata: { artist_name: artistName }
      });

      // Cache the result
      await supabase.from('gemini_cache').insert({
        cache_key: cacheKey,
        artist: artistName,
        title: artistName,
        composer: biography,
        confidence: 'high',
        tokens_used: (geminiData.usageMetadata?.promptTokenCount || 0) + 
                     (geminiData.usageMetadata?.candidatesTokenCount || 0),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
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

    if (updateError) {
      console.error('Error updating artist:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        biography,
        source
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-artist-bio:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
