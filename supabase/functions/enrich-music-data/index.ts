import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentResult {
  songId: string;
  success: boolean;
  enrichedData?: {
    composer?: string;
    releaseYear?: string;
    album?: string;
    genre?: string;
    youtubeVideoId?: string;
  };
  confidenceScore: number;
  sources: string[];
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { songId } = await req.json();
    
    if (!songId) {
      return new Response(
        JSON.stringify({ error: 'songId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[enrich-music-data] Enriching song ${songId}`);

    // Fetch song data
    const { data: song, error: fetchError } = await supabase
      .from('songs')
      .select(`
        id,
        title,
        normalized_title,
        composer,
        release_year,
        artists (
          name
        )
      `)
      .eq('id', songId)
      .single();

    if (fetchError || !song) {
      return new Response(
        JSON.stringify({ error: 'Song not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artistName = (song.artists as any)?.name || 'Unknown Artist';
    const searchQuery = `${song.title} ${artistName}`;
    
    console.log(`[enrich-music-data] Searching for: ${searchQuery}`);

    const enrichedData: EnrichmentResult['enrichedData'] = {};
    const sources: string[] = [];
    let confidenceScore = 0;

    // 1. YouTube API - Search for video and cache
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (youtubeApiKey) {
      try {
        // Check cache first
        const { data: cached } = await supabase
          .from('youtube_cache')
          .select('video_id, metadata')
          .eq('artist', artistName)
          .eq('title', song.title)
          .maybeSingle();

        if (cached) {
          console.log(`[enrich-music-data] YouTube cache hit for ${searchQuery}`);
          enrichedData.youtubeVideoId = cached.video_id;
          sources.push('youtube_cache');
          confidenceScore += 20;
        } else {
          // Search YouTube
          console.log(`[enrich-music-data] Searching YouTube for ${searchQuery}`);
          const youtubeResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${youtubeApiKey}`
          );

          if (youtubeResponse.ok) {
            const youtubeData = await youtubeResponse.json();
            if (youtubeData.items && youtubeData.items.length > 0) {
              const videoId = youtubeData.items[0].id.videoId;
              enrichedData.youtubeVideoId = videoId;
              sources.push('youtube');
              confidenceScore += 30;

              // Cache the result
              await supabase.from('youtube_cache').insert({
                artist: artistName,
                title: song.title,
                video_id: videoId,
                metadata: youtubeData.items[0],
              });
            }
          }
        }
      } catch (error) {
        console.error('[enrich-music-data] YouTube API error:', error);
      }
    }

    // 2. Gemini API - Extract metadata
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (geminiApiKey && !song.composer) {
      try {
        console.log(`[enrich-music-data] Querying Gemini for metadata`);
        const prompt = `Provide metadata for the song "${song.title}" by ${artistName}. 
        Return ONLY a JSON object with these fields (use null if unknown):
        {
          "composer": "composer name",
          "releaseYear": "YYYY",
          "album": "album name",
          "genre": "genre"
        }`;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 256,
              },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Extract JSON from response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const metadata = JSON.parse(jsonMatch[0]);
            if (metadata.composer) {
              enrichedData.composer = metadata.composer;
              confidenceScore += 25;
            }
            if (metadata.releaseYear) {
              enrichedData.releaseYear = metadata.releaseYear;
              confidenceScore += 15;
            }
            if (metadata.album) enrichedData.album = metadata.album;
            if (metadata.genre) enrichedData.genre = metadata.genre;
            sources.push('gemini');
          }
        }
      } catch (error) {
        console.error('[enrich-music-data] Gemini API error:', error);
      }
    }

    // 3. Perplexity API - Validate and complement
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (perplexityApiKey && confidenceScore < 70) {
      try {
        console.log(`[enrich-music-data] Querying Perplexity for validation`);
        const perplexityResponse = await fetch(
          'https://api.perplexity.ai/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${perplexityApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
              messages: [
                {
                  role: 'user',
                  content: `Who composed "${song.title}" by ${artistName}? What year was it released? Answer concisely.`,
                },
              ],
              max_tokens: 150,
            }),
          }
        );

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const answer = perplexityData.choices?.[0]?.message?.content || '';
          
          // Simple parsing for composer and year
          if (!enrichedData.composer && answer.toLowerCase().includes('composed by')) {
            const composerMatch = answer.match(/composed by ([A-Za-zÀ-ú\s]+)/i);
            if (composerMatch) {
              enrichedData.composer = composerMatch[1].trim();
              confidenceScore += 10;
            }
          }
          
          if (!enrichedData.releaseYear) {
            const yearMatch = answer.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
              enrichedData.releaseYear = yearMatch[0];
              confidenceScore += 10;
            }
          }
          
          sources.push('perplexity');
        }
      } catch (error) {
        console.error('[enrich-music-data] Perplexity API error:', error);
      }
    }

    // Cap confidence score at 100
    confidenceScore = Math.min(confidenceScore, 100);

    // Update song in database
    const updateData: any = {
      status: 'enriched',
      confidence_score: confidenceScore,
      enrichment_source: sources.join(','),
      updated_at: new Date().toISOString(),
    };

    if (enrichedData.composer) updateData.composer = enrichedData.composer;
    if (enrichedData.releaseYear) updateData.release_year = enrichedData.releaseYear;
    if (enrichedData.album || enrichedData.genre) {
      updateData.raw_data = {
        ...(song as any).raw_data,
        album: enrichedData.album,
        genre: enrichedData.genre,
      };
    }

    const { error: updateError } = await supabase
      .from('songs')
      .update(updateData)
      .eq('id', songId);

    if (updateError) {
      throw updateError;
    }

    console.log(`[enrich-music-data] Successfully enriched song ${songId} with confidence ${confidenceScore}%`);

    const result: EnrichmentResult = {
      songId,
      success: true,
      enrichedData,
      confidenceScore,
      sources,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[enrich-music-data] Error:', error);
    
    const result: EnrichmentResult = {
      songId: (await req.json()).songId,
      success: false,
      confidenceScore: 0,
      sources: [],
      error: error instanceof Error ? error.message : String(error),
    };

    return new Response(
      JSON.stringify(result),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
