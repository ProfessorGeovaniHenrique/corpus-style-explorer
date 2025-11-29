import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import { createEdgeLogger } from "../_shared/unified-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createEdgeLogger('clear-song-metadata', crypto.randomUUID());
  
  try {
    const { songIds } = await req.json();
    
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      log.warn('Invalid request: songIds missing or empty');
      return new Response(
        JSON.stringify({ error: 'songIds array is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Clearing metadata for ${songIds.length} songs`);

    const supabase = createSupabaseClient();

    // Process in chunks of 100 to avoid Supabase .in() array limit
    const CHUNK_SIZE = 100;
    let totalCleared = 0;
    let errors = 0;

    for (let i = 0; i < songIds.length; i += CHUNK_SIZE) {
      const chunk = songIds.slice(i, i + CHUNK_SIZE);
      
      log.info(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(songIds.length / CHUNK_SIZE)}`, {
        chunkSize: chunk.length
      });

      // Clear metadata fields in songs table
      const { error: updateError } = await supabase
        .from('songs')
        .update({
          composer: null,
          release_year: null,
          album: null,
          confidence_score: 0,
          enrichment_source: null,
          status: 'pending'
        })
        .in('id', chunk);

      if (updateError) {
        log.error(`Failed to clear chunk ${i / CHUNK_SIZE + 1}`, updateError);
        errors++;
        continue; // Continue with next chunk
      }

      totalCleared += chunk.length;

      // Clear corresponding cache entries (non-critical)
      await supabase
        .from('gemini_cache')
        .delete()
        .in('title', chunk.map(id => `enrichment_${id}`));
    }

    if (errors > 0) {
      log.warn(`Completed with ${errors} chunk errors. Cleared ${totalCleared}/${songIds.length} songs`);
    } else {
      log.info(`Successfully cleared metadata for ${totalCleared} songs`);
    }

    return new Response(
      JSON.stringify({ 
        success: totalCleared > 0, 
        clearedCount: totalCleared,
        failedChunks: errors,
        totalRequested: songIds.length,
        message: errors > 0 
          ? `Metadados limpos para ${totalCleared}/${songIds.length} música(s) (${errors} chunks falharam)`
          : `Metadados limpos para ${totalCleared} música(s)`
      }), 
      { status: totalCleared > 0 ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('Unexpected error in clear-song-metadata', error as Error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
