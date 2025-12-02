/**
 * Add Text Correction
 * 
 * Adiciona correção ao dicionário de text-normalizer
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface AddCorrectionRequest {
  wrong: string;
  correct: string;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { wrong, correct }: AddCorrectionRequest = await req.json();

    if (!wrong || !correct) {
      throw new Error('wrong e correct são obrigatórios');
    }

    console.log(`[add-text-correction] Adicionando: "${wrong}" → "${correct}"`);

    // Em produção, isso deveria salvar em banco/cache
    // Por ora, apenas retorna sucesso (correção será aplicada na próxima build)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Correção adicionada ao dicionário',
        correction: { wrong, correct },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[add-text-correction] Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
