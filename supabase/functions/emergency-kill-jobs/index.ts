import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMERGENCY_TOKEN = "verso-austral-emergency-2024";
const KILL_FLAG_TTL_SECONDS = 30 * 60; // 30 minutos

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚨 [EMERGENCY-KILL] Recebida solicitação de emergência");

  try {
    // Verificar token de emergência
    const token = req.headers.get("X-Emergency-Token") || 
                  new URL(req.url).searchParams.get("token");
    
    if (token !== EMERGENCY_TOKEN) {
      console.log("❌ Token inválido");
      return new Response(
        JSON.stringify({ error: "Token de emergência inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      redis: { success: false, message: "" },
      jobs: {
        semantic: { success: false, count: 0, error: "" },
        corpus: { success: false, count: 0, error: "" },
        enrichment: { success: false, count: 0, error: "" },
      },
    };

    // 1. Ativar kill flag no Redis
    const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

    if (redisUrl && redisToken) {
      try {
        console.log("📡 Ativando kill flag no Redis...");
        
        // Kill flag
        const killResponse = await fetch(redisUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(["SETEX", "emergency:kill_flag", KILL_FLAG_TTL_SECONDS.toString(), "true"]),
        });

        // Backpressure cooldown
        const cooldownUntil = Date.now() + KILL_FLAG_TTL_SECONDS * 1000;
        await fetch(redisUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(["SETEX", "backpressure:cooldown_until", KILL_FLAG_TTL_SECONDS.toString(), cooldownUntil.toString()]),
        });

        // Trigger reason
        await fetch(redisUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(["SETEX", "backpressure:trigger_reason", KILL_FLAG_TTL_SECONDS.toString(), "emergency_kill_switch"]),
        });

        results.redis = { success: true, message: "Kill flag e backpressure ativados por 30 minutos" };
        console.log("✅ Redis: kill flag ativado");
      } catch (err) {
        results.redis = { success: false, message: err.message };
        console.log("⚠️ Redis falhou:", err.message);
      }
    } else {
      results.redis = { success: false, message: "Redis não configurado" };
    }

    // 2. Tentar cancelar jobs no Supabase (pode falhar se DB sobrecarregado)
    try {
      console.log("🗄️ Tentando cancelar jobs no banco de dados...");
      
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const timeout = 5000; // 5s timeout por operação

      // Semantic annotation jobs
      try {
        const semanticResult = await Promise.race([
          supabase.from("semantic_annotation_jobs")
            .update({ 
              status: "cancelado", 
              erro_mensagem: "🚨 Cancelamento de emergência via Kill Switch" 
            })
            .eq("status", "processando")
            .select('id'),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout))
        ]) as any;
        
        results.jobs.semantic = { 
          success: true, 
          count: semanticResult?.data?.length || 0,
          error: ""
        };
        console.log(`✅ Semantic jobs: ${results.jobs.semantic.count} cancelados`);
      } catch (err) {
        results.jobs.semantic = { success: false, count: 0, error: err.message };
        console.log("⚠️ Semantic jobs timeout:", err.message);
      }

      // Corpus annotation jobs
      try {
        const corpusResult = await Promise.race([
          supabase.from("corpus_annotation_jobs")
            .update({ 
              status: "cancelado",
              is_cancelling: true
            })
            .eq("status", "processando")
            .select('id'),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout))
        ]) as any;
        
        results.jobs.corpus = { 
          success: true, 
          count: corpusResult?.data?.length || 0,
          error: ""
        };
        console.log(`✅ Corpus jobs: ${results.jobs.corpus.count} cancelados`);
      } catch (err) {
        results.jobs.corpus = { success: false, count: 0, error: err.message };
        console.log("⚠️ Corpus jobs timeout:", err.message);
      }

      // Enrichment jobs
      try {
        const enrichmentResult = await Promise.race([
          supabase.from("enrichment_jobs")
            .update({ 
              status: "cancelado", 
              error_message: "🚨 Cancelamento de emergência via Kill Switch",
              is_cancelling: true
            })
            .eq("status", "processando")
            .select('id'),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout))
        ]) as any;
        
        results.jobs.enrichment = { 
          success: true, 
          count: enrichmentResult?.data?.length || 0,
          error: ""
        };
        console.log(`✅ Enrichment jobs: ${results.jobs.enrichment.count} cancelados`);
      } catch (err) {
        results.jobs.enrichment = { success: false, count: 0, error: err.message };
        console.log("⚠️ Enrichment jobs timeout:", err.message);
      }

    } catch (err) {
      console.log("⚠️ Database operations failed:", err.message);
    }

    const totalCancelled = results.jobs.semantic.count + results.jobs.corpus.count + results.jobs.enrichment.count;
    
    console.log(`\n🏁 [EMERGENCY-KILL] Resultado final:`);
    console.log(`   Redis: ${results.redis.success ? '✅' : '❌'}`);
    console.log(`   Jobs cancelados: ${totalCancelled}`);

    return new Response(
      JSON.stringify({
        success: results.redis.success || totalCancelled > 0,
        message: results.redis.success 
          ? `🛑 Kill flag ativado por 30 minutos. ${totalCancelled} jobs cancelados.`
          : `⚠️ Redis indisponível. ${totalCancelled} jobs cancelados via banco.`,
        results,
        cooldownMinutes: 30,
        activatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [EMERGENCY-KILL] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
