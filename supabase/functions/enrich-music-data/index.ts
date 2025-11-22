import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { handleSingleMode, handleDatabaseMode, handleLegacyMode } from "./modes.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[enrich-music-data] 🚀 REQUEST RECEIVED - Method: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    console.log(`[enrich-music-data] ✅ CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[enrich-music-data] 🔧 Initializing Supabase client...`);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log(`[enrich-music-data] ✅ Supabase client initialized`);

    console.log(`[enrich-music-data] 📦 Parsing request body...`);
    const body = await req.json();
    
    // Determine operation mode
    const mode = body.mode || 'single'; // 'single', 'database', 'legacy'
    console.log(`[enrich-music-data] Mode: ${mode}`);
    
    if (mode === 'database') {
      // Database mode: enrich pending songs for an artist
      return await handleDatabaseMode(body, supabase);
    } else if (mode === 'legacy') {
      // Legacy mode: batch enrichment from array of titles
      return await handleLegacyMode(body);
    } else {
      // Single mode: enrich one song by ID
      return await handleSingleMode(body, supabase);
    }

  } catch (error) {
    console.error('[enrich-music-data] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
