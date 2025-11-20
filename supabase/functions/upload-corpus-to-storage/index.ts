import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { corpusType, projectBaseUrl } = await req.json();
    
    if (!corpusType || !projectBaseUrl) {
      throw new Error('corpusType e projectBaseUrl são obrigatórios');
    }

    console.log(`Iniciando upload do corpus ${corpusType} para o Storage...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (corpusType === 'gaucho') {
      // Upload das 3 partes do gaúcho
      console.log('Carregando 3 partes do corpus gaúcho...');
      
      const parts = [
        'gaucho-parte-01.txt',
        'gaucho-parte-02.txt',
        'gaucho-parte-03.txt'
      ];

      const uploads = [];
      let totalSize = 0;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`[${i + 1}/3] Processando ${part}...`);
        
        const response = await fetch(`${projectBaseUrl}/corpus/full-text/${part}`);
        if (!response.ok) {
          throw new Error(`Falha ao carregar ${part}: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const fileSize = blob.size;
        totalSize += fileSize;
        console.log(`${part}: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

        const { data, error } = await supabase.storage
          .from('corpus')
          .upload(`full-text/${part}`, blob, {
            contentType: 'text/plain',
            upsert: true
          });

        if (error) {
          throw new Error(`Erro no upload de ${part}: ${error.message}`);
        }

        // Verificar upload
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('corpus')
          .download(`full-text/${part}`);

        if (downloadError) {
          throw new Error(`Erro ao verificar ${part}: ${downloadError.message}`);
        }

        const verifySize = downloadData.size;
        if (Math.abs(verifySize - fileSize) > 100) {
          throw new Error(`Tamanho difere em ${part}: original ${fileSize}, storage ${verifySize}`);
        }

        uploads.push({ 
          file: part, 
          size: fileSize, 
          sizeMB: (fileSize / 1024 / 1024).toFixed(2),
          path: data.path,
          verified: true
        });
        
        console.log(`✅ ${part} upload e verificação OK`);
      }

      console.log(`\n✨ Upload completo! Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Upload de todas as 3 partes concluído',
          totalSize: totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          uploads: uploads
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (corpusType === 'nordestino') {
      // Upload das 3 partes do nordestino
      console.log('Carregando 3 partes do corpus nordestino...');
      
      const parts = [
        'nordestino-parte-01.txt',
        'nordestino-parte-02.txt',
        'nordestino-parte-03.txt'
      ];

      const uploads = [];

      for (const part of parts) {
        console.log(`Processando ${part}...`);
        
        const response = await fetch(`${projectBaseUrl}/corpus/full-text/${part}`);
        if (!response.ok) {
          throw new Error(`Falha ao carregar ${part}: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const fileSize = blob.size;
        console.log(`${part}: ${fileSize} bytes`);

        const { data, error } = await supabase.storage
          .from('corpus')
          .upload(`full-text/${part}`, blob, {
            contentType: 'text/plain',
            upsert: true
          });

        if (error) {
          throw new Error(`Erro no upload de ${part}: ${error.message}`);
        }

        uploads.push({ file: part, size: fileSize, path: data.path });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Upload de todas as partes concluído',
          uploads: uploads
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error(`Tipo de corpus inválido: ${corpusType}`);
    }

  } catch (error) {
    console.error('Erro no upload:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMsg 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
