import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { createEdgeLogger } from "../_shared/unified-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  songsProcessed: number;
  errors: Array<{ songId: string; error: string }>;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const log = createEdgeLogger('process-music-data', requestId);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { songIds } = await req.json();
    
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'songIds array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info('Processing songs', { count: songIds.length });

    const errors: Array<{ songId: string; error: string }> = [];
    let songsProcessed = 0;

    // Função para normalizar texto
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    // Função para validar ano
    const validateYear = (year: string | null): string | null => {
      if (!year) return null;
      const yearNum = parseInt(year, 10);
      const currentYear = new Date().getFullYear();
      if (yearNum >= 1900 && yearNum <= currentYear) {
        return year;
      }
      return null;
    };

    // Process each song
    for (const songId of songIds) {
      try {
        // Fetch song with artist data
        const { data: song, error: fetchError } = await supabase
          .from('songs')
          .select(`
            id,
            title,
            normalized_title,
            artist_id,
            composer,
            release_year,
            raw_data,
            artists (
              name,
              normalized_name
            )
          `)
          .eq('id', songId)
          .single();

        if (fetchError || !song) {
          errors.push({ songId, error: 'Song not found' });
          continue;
        }

        // Normalize title if not already normalized
        let normalizedTitle = song.normalized_title;
        if (!normalizedTitle || normalizedTitle === song.title) {
          normalizedTitle = normalizeText(song.title);
        }

        // Validate and clean release year
        const validatedYear = validateYear(song.release_year);

        // Clean and validate composer
        let cleanComposer = song.composer;
        if (cleanComposer) {
          cleanComposer = cleanComposer.trim();
          if (cleanComposer.length < 2) {
            cleanComposer = null;
          }
        }

        // Update song with normalized and validated data
        const { error: updateError } = await supabase
          .from('songs')
          .update({
            normalized_title: normalizedTitle,
            release_year: validatedYear,
            composer: cleanComposer,
            status: 'processed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', songId);

        if (updateError) {
          errors.push({ songId, error: updateError.message });
          continue;
        }

        songsProcessed++;

      } catch (error) {
        log.error('Error processing song', error as Error, { songId });
        errors.push({ songId, error: error instanceof Error ? error.message : String(error) });
      }
    }

    log.info('Processing complete', { processed: songsProcessed, total: songIds.length });

    const result: ProcessingResult = {
      songsProcessed,
      errors,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.fatal('Fatal error in process-music-data', error as Error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
