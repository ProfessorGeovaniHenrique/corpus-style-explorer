import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnnotationRequest {
  corpus_type: 'gaucho' | 'nordestino' | 'marenco-verso';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[annotate-semantic] Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { corpus_type }: AnnotationRequest = await req.json();

    if (!corpus_type) {
      return new Response(
        JSON.stringify({ error: 'corpus_type é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[annotate-semantic] Iniciando anotação para corpus: ${corpus_type}, user: ${user.id}`);

    // Create annotation job
    const { data: job, error: jobError } = await supabase
      .from('annotation_jobs')
      .insert({
        user_id: user.id,
        corpus_type: corpus_type,
        status: 'pending',
        metadata: {
          started_at: new Date().toISOString(),
          corpus_type: corpus_type
        }
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('[annotate-semantic] Error creating job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar job de anotação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[annotate-semantic] Job criado: ${job.id}`);

    // Start async processing (background task)
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    EdgeRuntime.waitUntil(
      processCorpusAsync(job.id, corpus_type, supabaseUrl, supabaseKey)
    );

    // Return job_id immediately
    return new Response(
      JSON.stringify({
        job_id: job.id,
        status: 'pending',
        message: 'Anotação iniciada. Acompanhe o progresso pelo job_id.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[annotate-semantic] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process corpus asynchronously in background
 * This is a placeholder that will be enhanced in Sprint 2 with AI integration
 */
async function processCorpusAsync(
  jobId: string,
  corpusType: string,
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`[processCorpusAsync] Starting job ${jobId} for corpus ${corpusType}`);

    // Update job status to processing
    await supabase
      .from('annotation_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId);

    // TODO Sprint 2: Implement actual corpus processing with AI
    // For now, we'll simulate processing with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock: Set some basic stats
    const mockStats = {
      gaucho: { total_palavras: 15000, palavras_anotadas: 15000 },
      nordestino: { total_palavras: 12000, palavras_anotadas: 12000 },
      'marenco-verso': { total_palavras: 500, palavras_anotadas: 500 }
    };

    const stats = mockStats[corpusType as keyof typeof mockStats] || { total_palavras: 1000, palavras_anotadas: 1000 };

    // Update job as completed
    await supabase
      .from('annotation_jobs')
      .update({
        status: 'completed',
        total_palavras: stats.total_palavras,
        palavras_processadas: stats.palavras_anotadas,
        palavras_anotadas: stats.palavras_anotadas,
        progresso: 1.0,
        tempo_fim: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`[processCorpusAsync] Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`[processCorpusAsync] Error processing job ${jobId}:`, error);

    // Update job as failed
    await supabase
      .from('annotation_jobs')
      .update({
        status: 'failed',
        erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        tempo_fim: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}