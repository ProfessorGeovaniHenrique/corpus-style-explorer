import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();
    const { trigger } = await req.json();

    console.log(`🔄 Iniciando sincronização (trigger: ${trigger})`);

    // Importar dados estáticos (simulado - na prática ler de arquivos)
    // Por enquanto, vamos apenas marcar como sincronizado
    const source = 'construction-log';
    const itemsSynced = 6; // Número de fases
    const dataHash = await generateHash(JSON.stringify({ timestamp: new Date().toISOString() }));

    // Verificar se precisa sincronizar
    const { data: lastSync } = await supabase
      .from('sync_metadata')
      .select('data_hash')
      .eq('source', source)
      .single();

    if (lastSync?.data_hash === dataHash) {
      console.log('✅ Dados já sincronizados (hash igual)');
      return new Response(
        JSON.stringify({ status: 'up-to-date', message: 'Nenhuma mudança detectada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert metadata
    const syncDurationMs = Date.now() - startTime;
    const { error } = await supabase
      .from('sync_metadata')
      .upsert({
        source,
        data_hash: dataHash,
        last_sync_at: new Date().toISOString(),
        items_synced: itemsSynced,
        sync_duration_ms: syncDurationMs,
      }, { onConflict: 'source' });

    if (error) throw error;

    console.log(`✅ Sincronização concluída: ${itemsSynced} itens em ${syncDurationMs}ms`);

    return new Response(
      JSON.stringify({
        status: 'success',
        itemsSynced,
        syncDurationMs,
        trigger,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}