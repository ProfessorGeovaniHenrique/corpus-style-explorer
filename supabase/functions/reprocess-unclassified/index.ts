import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import { createEdgeLogger } from "../_shared/unified-logger.ts";
import { classifyBatchWithGemini } from "../_shared/gemini-batch-classifier.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReprocessCriteria {
  includeNC: boolean;
  includeLowConfidence: boolean;
  confidenceThreshold?: number;
  includeGenericN1: boolean;
  artistId?: string;
}

interface ReprocessRequest {
  mode: 'analyze' | 'reprocess' | 'continue';
  jobId?: string;
  criteria?: ReprocessCriteria;
}

const CHUNK_SIZE = 100;
const BATCH_SIZE = 15;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const logger = createEdgeLogger('reprocess-unclassified', requestId);

  try {
    const { mode, jobId, criteria }: ReprocessRequest = await req.json();
    const supabase = createSupabaseClient();

    logger.info('Reprocess request received', { mode, jobId, criteria });

    // MODO ANÁLISE: Retorna estatísticas sem processar
    if (mode === 'analyze') {
      const stats = await analyzeCandidates(supabase, criteria!, logger);
      return new Response(JSON.stringify({ success: true, stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // MODO REPROCESSAMENTO: Inicia novo job
    if (mode === 'reprocess') {
      const newJobId = await createReprocessJob(supabase, criteria!, logger);
      
      // Processar primeiro chunk
      await processChunk(supabase, newJobId, logger);
      
      return new Response(JSON.stringify({ success: true, jobId: newJobId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // MODO CONTINUE: Continua job existente
    if (mode === 'continue' && jobId) {
      await processChunk(supabase, jobId, logger);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode or missing parameters' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Reprocess error', error as Error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeCandidates(supabase: any, criteria: ReprocessCriteria, logger: any) {
  const conditions = buildWhereConditions(criteria);
  
  const { data: candidates, error } = await supabase
    .from('semantic_disambiguation_cache')
    .select('palavra, tagset_codigo, confianca, fonte', { count: 'exact' })
    .or(conditions);

  if (error) throw error;

  const stats = {
    total: candidates?.length || 0,
    nc: candidates?.filter((c: any) => c.tagset_codigo === 'NC').length || 0,
    lowConfidence: candidates?.filter((c: any) => c.confianca < (criteria.confidenceThreshold || 0.80)).length || 0,
    genericN1: candidates?.filter((c: any) => c.tagset_codigo?.length === 2 && c.fonte === 'gemini_flash').length || 0,
  };

  logger.info('Analysis complete', stats);
  return stats;
}

async function createReprocessJob(supabase: any, criteria: ReprocessCriteria, logger: any) {
  const stats = await analyzeCandidates(supabase, criteria, logger);
  
  const { data, error } = await supabase
    .from('semantic_reprocess_jobs')
    .insert({
      criteria,
      total_candidates: stats.total,
      status: 'pendente',
      artist_id: criteria.artistId
    })
    .select()
    .single();

  if (error) throw error;
  
  logger.info('Reprocess job created', { jobId: data.id, totalCandidates: stats.total });
  return data.id;
}

async function processChunk(supabase: any, jobId: string, logger: any) {
  // Buscar job
  const { data: job, error: jobError } = await supabase
    .from('semantic_reprocess_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError) throw jobError;
  if (job.status === 'cancelado') return;

  // Atualizar status para processando
  if (job.status === 'pendente') {
    await supabase
      .from('semantic_reprocess_jobs')
      .update({ status: 'processando', started_at: new Date().toISOString() })
      .eq('id', jobId);
  }

  const criteria = job.criteria as ReprocessCriteria;
  const conditions = buildWhereConditions(criteria);

  // Buscar palavras candidatas (únicas por palavra, não por contexto)
  const { data: candidates, error: fetchError } = await supabase
    .from('semantic_disambiguation_cache')
    .select('palavra, lema, pos, tagset_codigo, confianca')
    .or(conditions)
    .order('palavra')
    .range(job.current_offset, job.current_offset + CHUNK_SIZE - 1);

  if (fetchError) throw fetchError;
  if (!candidates || candidates.length === 0) {
    // Job concluído
    await supabase
      .from('semantic_reprocess_jobs')
      .update({ 
        status: 'concluido', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', jobId);
    
    logger.info('Job completed', { jobId });
    return;
  }

  logger.info('Processing chunk', { jobId, offset: job.current_offset, count: candidates.length });

  // Remover duplicatas por palavra
  const uniqueWords = Array.from(
    new Map(candidates.map((c: any) => [c.palavra, c])).values()
  );

  // Deletar entradas antigas do cache para estas palavras
  const palavras = uniqueWords.map((c: any) => c.palavra);
  await supabase
    .from('semantic_disambiguation_cache')
    .delete()
    .in('palavra', palavras);

  logger.info('Old cache entries deleted', { count: palavras.length });

  // Reprocessar com Gemini em batches
  let improved = 0;
  let unchanged = 0;
  let failed = 0;

  for (let i = 0; i < uniqueWords.length; i += BATCH_SIZE) {
    const batch = uniqueWords.slice(i, i + BATCH_SIZE);
    
    try {
      const results = await classifyBatchWithGemini(
        batch.map((w: any) => ({
          palavra: w.palavra,
          lema: w.lema,
          pos: w.pos
        })),
        logger
      );

      // Inserir novos resultados
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const original = batch[j] as { palavra: string; lema?: string; pos?: string; tagset_codigo?: string };
        
        if (result.tagset_codigo && result.tagset_codigo !== original.tagset_codigo) {
          improved++;
        } else {
          unchanged++;
        }

        await supabase
          .from('semantic_disambiguation_cache')
          .insert({
            palavra: result.palavra,
            lema: result.lema,
            pos: result.pos,
            tagset_codigo: result.tagset_codigo || 'NC',
            confianca: result.confianca || 0.85,
            fonte: 'gemini_reprocess',
            contexto_hash: crypto.randomUUID() // Novo hash para forçar atualização
          });
      }
    } catch (error) {
      logger.error('Batch processing error', error as Error);
      failed += batch.length;
    }
  }

  // Atualizar progresso do job
  await supabase
    .from('semantic_reprocess_jobs')
    .update({
      processed: job.processed + uniqueWords.length,
      improved: job.improved + improved,
      unchanged: job.unchanged + unchanged,
      failed: job.failed + failed,
      current_offset: job.current_offset + CHUNK_SIZE,
      chunks_processed: job.chunks_processed + 1,
      last_chunk_at: new Date().toISOString()
    })
    .eq('id', jobId);

  logger.info('Chunk processed', { improved, unchanged, failed });

  // Auto-invocar próximo chunk
  if (candidates.length === CHUNK_SIZE) {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    fetch(`${SUPABASE_URL}/functions/v1/reprocess-unclassified`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ mode: 'continue', jobId })
    }).catch(err => logger.error('Auto-invoke failed', err));
  }
}

function buildWhereConditions(criteria: ReprocessCriteria): string {
  const conditions: string[] = [];

  if (criteria.includeNC) {
    conditions.push(`tagset_codigo.eq.NC`);
  }

  if (criteria.includeLowConfidence) {
    const threshold = criteria.confidenceThreshold || 0.80;
    conditions.push(`confianca.lt.${threshold}`);
  }

  if (criteria.includeGenericN1) {
    // N1 genérico: código com 2 caracteres E fonte gemini
    conditions.push(`and(tagset_codigo.like.__,fonte.eq.gemini_flash)`);
  }

  if (criteria.artistId) {
    conditions.push(`artist_id.eq.${criteria.artistId}`);
  }

  return conditions.join(',');
}
