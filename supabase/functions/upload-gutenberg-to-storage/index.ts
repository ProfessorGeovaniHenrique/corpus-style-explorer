import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📤 Iniciando upload do dicionário Gutenberg para Storage...');

    // Buscar o arquivo da pasta public via fetch
    const fileUrl = `${new URL(req.url).origin}/dictionaries/gutenberg-completo.txt`;
    console.log(`📥 Buscando arquivo de: ${fileUrl}`);
    
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Arquivo não encontrado: ${fileResponse.status}`);
    }

    const fileContent = await fileResponse.text();
    const fileSize = new Blob([fileContent]).size;
    console.log(`✅ Arquivo carregado com sucesso (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Upload para o Supabase Storage
    const storagePath = 'dictionaries/gutenberg-completo.txt';
    console.log(`📤 Fazendo upload para: corpus/${storagePath}`);

    const { data, error } = await supabase.storage
      .from('corpus')
      .upload(storagePath, fileContent, {
        contentType: 'text/plain; charset=utf-8',
        upsert: true, // Sobrescrever se já existir
      });

    if (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }

    console.log('✅ Upload concluído com sucesso!');

    // Verificar URL pública
    const { data: publicUrlData } = supabase.storage
      .from('corpus')
      .getPublicUrl(storagePath);

    console.log(`🔗 URL pública: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Arquivo enviado para o Storage com sucesso',
        path: storagePath,
        publicUrl: publicUrlData.publicUrl,
        size: fileSize,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
