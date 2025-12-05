/**
 * Edge Function: refine-domain-batch
 * Job recursivo para refinamento semântico automático de palavras N1
 * Auto-invoca próximo chunk até completar ou ser cancelado
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CHUNK_SIZE = 50; // Words per invocation
const BATCH_SIZE = 15; // Words per AI call
const BATCH_DELAY_MS = 1500; // Delay between AI calls

interface RefinementJob {
  id: string;
  status: string;
  domain_filter: string | null;
  model: string;
  total_words: number;
  processed: number;
  refined: number;
  errors: number;
  current_offset: number;
  is_cancelling: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { jobId, action } = await req.json();

    // Handle job creation
    if (action === 'create') {
      const { domain_filter, model = 'gemini' } = await req.json();
      return await createJob(supabase, domain_filter, model);
    }

    // Handle pause/resume/cancel
    if (action === 'pause') {
      return await updateJobStatus(supabase, jobId, 'pausado');
    }
    if (action === 'resume') {
      return await resumeJob(supabase, jobId);
    }
    if (action === 'cancel') {
      return await updateJobStatus(supabase, jobId, 'cancelado');
    }

    // Process next chunk
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId required for processing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('semantic_refinement_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('[refine-domain-batch] Job not found:', jobId);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if should process
    if (job.status !== 'processando' || job.is_cancelling) {
      console.log(`[refine-domain-batch] Job ${jobId} stopped: status=${job.status}, cancelling=${job.is_cancelling}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Job not active', status: job.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process chunk
    const result = await processChunk(supabase, job as RefinementJob);

    // Check if completed
    if (result.completed || job.processed + result.processedCount >= job.total_words) {
      await supabase
        .from('semantic_refinement_jobs')
        .update({
          status: 'concluido',
          tempo_fim: new Date().toISOString(),
          processed: job.processed + result.processedCount,
          refined: job.refined + result.refinedCount,
          errors: job.errors + result.errorCount,
        })
        .eq('id', jobId);

      console.log(`[refine-domain-batch] Job ${jobId} completed!`);
      return new Response(
        JSON.stringify({ success: true, ...result, completed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update progress
    await supabase
      .from('semantic_refinement_jobs')
      .update({
        processed: job.processed + result.processedCount,
        refined: job.refined + result.refinedCount,
        errors: job.errors + result.errorCount,
        current_offset: job.current_offset + CHUNK_SIZE,
        last_chunk_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Auto-invoke next chunk (fire and forget)
    scheduleNextChunk(jobId).catch(err => console.error('[refine-domain-batch] Schedule error:', err));

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result,
        processingTime: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[refine-domain-batch] Error:', errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createJob(supabase: any, domain_filter: string | null, model: string) {
  // Count total words to process
  let query = supabase
    .from('semantic_disambiguation_cache')
    .select('id', { count: 'exact', head: true })
    .is('tagset_n2', null)
    .neq('tagset_codigo', 'NC');

  if (domain_filter === 'MG') {
    query = query.eq('tagset_codigo', 'MG');
  } else if (domain_filter === 'DS') {
    query = query.neq('tagset_codigo', 'MG');
  }
  // null = all

  const { count, error: countError } = await query;

  if (countError) {
    throw new Error(`Failed to count words: ${countError.message}`);
  }

  // Cancel any existing active jobs
  await supabase
    .from('semantic_refinement_jobs')
    .update({ status: 'cancelado', is_cancelling: true })
    .in('status', ['pendente', 'processando', 'pausado']);

  // Create new job
  const { data: newJob, error: insertError } = await supabase
    .from('semantic_refinement_jobs')
    .insert({
      domain_filter,
      model,
      total_words: count || 0,
      status: 'processando',
      tempo_inicio: new Date().toISOString(),
      last_chunk_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create job: ${insertError.message}`);
  }

  console.log(`[refine-domain-batch] Created job ${newJob.id} for ${count} words (filter: ${domain_filter}, model: ${model})`);

  // Start processing immediately (fire and forget)
  scheduleNextChunk(newJob.id).catch(err => console.error('[refine-domain-batch] Initial schedule error:', err));

  return new Response(
    JSON.stringify({ success: true, job: newJob }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateJobStatus(supabase: any, jobId: string, status: string) {
  const updateData: any = { status };
  if (status === 'cancelado') {
    updateData.is_cancelling = true;
    updateData.tempo_fim = new Date().toISOString();
  }

  const { error } = await supabase
    .from('semantic_refinement_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true, status }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function resumeJob(supabase: any, jobId: string) {
  const { error } = await supabase
    .from('semantic_refinement_jobs')
    .update({ 
      status: 'processando',
      last_chunk_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to resume job: ${error.message}`);
  }

  // Start processing (fire and forget)
  scheduleNextChunk(jobId).catch(err => console.error('[refine-domain-batch] Resume schedule error:', err));

  return new Response(
    JSON.stringify({ success: true, status: 'processando' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processChunk(supabase: any, job: RefinementJob) {
  console.log(`[refine-domain-batch] Processing chunk for job ${job.id}, offset ${job.current_offset}`);

  // Fetch words to process
  let query = supabase
    .from('semantic_disambiguation_cache')
    .select('id, palavra, lema, pos, tagset_codigo, contexto_hash')
    .is('tagset_n2', null)
    .neq('tagset_codigo', 'NC')
    .order('palavra')
    .range(job.current_offset, job.current_offset + CHUNK_SIZE - 1);

  if (job.domain_filter === 'MG') {
    query = query.eq('tagset_codigo', 'MG');
  } else if (job.domain_filter === 'DS') {
    query = query.neq('tagset_codigo', 'MG');
  }

  const { data: words, error: fetchError } = await query;

  if (fetchError) {
    console.error('[refine-domain-batch] Error fetching words:', fetchError);
    return { processedCount: 0, refinedCount: 0, errorCount: 1, completed: false };
  }

  if (!words || words.length === 0) {
    console.log('[refine-domain-batch] No more words to process');
    return { processedCount: 0, refinedCount: 0, errorCount: 0, completed: true };
  }

  console.log(`[refine-domain-batch] Fetched ${words.length} words`);

  // Process in batches
  let processedCount = 0;
  let refinedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    
    try {
      const result = await processBatchWithAI(supabase, batch, job.model);
      processedCount += batch.length;
      refinedCount += result.refined;
      errorCount += result.errors;
    } catch (error) {
      console.error('[refine-domain-batch] Batch error:', error);
      errorCount += batch.length;
    }

    // Delay between batches
    if (i + BATCH_SIZE < words.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return { processedCount, refinedCount, errorCount, completed: false };
}

async function processBatchWithAI(supabase: any, words: any[], model: string) {
  // Get unique domains
  const domains = [...new Set(words.map(w => w.tagset_codigo?.split('.')[0]).filter(Boolean))];
  
  // Fetch hierarchy for these domains
  const { data: tagsets } = await supabase
    .from('semantic_tagset')
    .select('codigo, nome, nivel_profundidade')
    .order('codigo');

  const validCodes = new Set((tagsets || []).map((t: any) => t.codigo));
  
  // Build hierarchy text
  const hierarchyLines: string[] = [];
  for (const domain of domains) {
    const domainTagsets = (tagsets || []).filter((t: any) => 
      t.codigo === domain || t.codigo.startsWith(`${domain}.`)
    );
    domainTagsets.forEach((t: any) => {
      const depth = t.codigo.split('.').length - 1;
      const indent = '  '.repeat(depth);
      hierarchyLines.push(`${indent}${t.codigo} - ${t.nome}`);
    });
  }

  const hierarchyText = hierarchyLines.join('\n');

  // Build prompt
  const wordList = words.map(w => 
    `- "${w.palavra}" (POS: ${w.pos || '?'}, atual: ${w.tagset_codigo})`
  ).join('\n');

  const systemPrompt = `Você é um especialista em classificação semântica do português brasileiro.
Classifique as palavras no subnível mais específico possível (N4 > N3 > N2 > N1).

HIERARQUIA:
${hierarchyText}

REGRAS:
1. Prefira sempre o nível mais específico (N4 se disponível)
2. Retorne APENAS códigos que existem na hierarquia
3. Confiança entre 0.70 e 1.00

Responda APENAS com JSON válido:
[{"palavra": "x", "tagset_codigo": "XX.YY.ZZ", "confianca": 0.85}]`;

  const userPrompt = `Classifique:\n${wordList}`;

  // Call AI
  const modelId = model === 'gpt5' ? 'openai/gpt-5-mini' : 'google/gemini-2.5-flash';
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON
  let results: any[];
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    console.error('[refine-domain-batch] JSON parse error:', content.substring(0, 200));
    return { refined: 0, errors: words.length };
  }

  // Update database
  let refined = 0;
  let errors = 0;

  for (const result of results) {
    const word = words.find(w => w.palavra.toLowerCase() === result.palavra?.toLowerCase());
    if (!word) continue;

    // Validate code exists
    let code = result.tagset_codigo;
    if (!validCodes.has(code)) {
      // Fallback to original
      code = word.tagset_codigo;
    }

    // Only update if refined (code has a dot = N2+)
    if (code && code.includes('.')) {
      const parts = code.split('.');
      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({
          tagset_codigo: code,
          tagset_n1: parts[0],
          tagset_n2: parts.length >= 2 ? parts.slice(0, 2).join('.') : null,
          tagset_n3: parts.length >= 3 ? parts.slice(0, 3).join('.') : null,
          tagset_n4: parts.length >= 4 ? code : null,
          confianca: result.confianca || 0.85,
          fonte: model === 'gpt5' ? 'gpt5_mg_refinement' : 'gemini_flash_mg_refinement',
        })
        .eq('id', word.id);

      if (!error) {
        refined++;
      } else {
        errors++;
      }
    }
  }

  return { refined, errors };
}

async function scheduleNextChunk(jobId: string) {
  // Small delay before next chunk
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/refine-domain-batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });

    if (!response.ok) {
      console.error('[refine-domain-batch] Auto-invoke failed:', response.status);
    }
  } catch (error) {
    console.error('[refine-domain-batch] Auto-invoke error:', error);
  }
}
