import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createEdgeLogger } from '../_shared/unified-logger.ts';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface HealthCheckResult {
  check_type: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details: any;
  metrics: any;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const requestId = crypto.randomUUID();
  const log = createEdgeLogger('health-check-lexicon', requestId);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { forceRefresh } = await req.json().catch(() => ({ forceRefresh: false }));

    log.info('Running health check', { forceRefresh });

    // Check cache (< 5 minutes old)
    if (!forceRefresh) {
      const { data: cachedResults } = await supabase
        .from('lexicon_health_status')
        .select('*')
        .gt('expires_at', new Date().toISOString());

      if (cachedResults && cachedResults.length > 0) {
        log.info('Returning cached health check results', { resultsCount: cachedResults.length });
        return new Response(JSON.stringify({ results: cachedResults, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const results: HealthCheckResult[] = [];
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // ✅ 1. Check Gaúcho Unificado
    const { data: gauchoData, count: gauchoCount } = await supabase
      .from('dialectal_lexicon')
      .select('validado_humanamente, confianca_extracao', { count: 'exact' })
      .in('tipo_dicionario', ['gaucho_unificado', 'gaucho_unificado_v2', 'dialectal_I', 'dialectal_II']);

    const avgGauchoConfidence = gauchoData && gauchoData.length > 0 
      ? gauchoData.reduce((acc, d) => acc + (d.confianca_extracao || 0), 0) / gauchoData.length
      : 0;

    if ((gauchoCount || 0) === 0) {
      results.push({
        check_type: 'gaucho_unificado',
        status: 'critical',
        message: 'Gaúcho Unificado não importado',
        details: { count: 0 },
        metrics: { total: 0, avgConfidence: 0 }
      });
    } else if (avgGauchoConfidence < 0.70) {
      results.push({
        check_type: 'gaucho_unificado',
        status: 'warning',
        message: `Confiança média baixa no Gaúcho (${(avgGauchoConfidence * 100).toFixed(1)}%)`,
        details: { avgConfidence: avgGauchoConfidence },
        metrics: { total: gauchoCount, avgConfidence: avgGauchoConfidence }
      });
    } else {
      results.push({
        check_type: 'gaucho_unificado',
        status: 'healthy',
        message: `Gaúcho Unificado saudável (${gauchoCount} entradas)`,
        details: {},
        metrics: { total: gauchoCount, avgConfidence: avgGauchoConfidence }
      });
    }

    // ✅ 2. Check Navarro 2014 (NOVO)
    const { data: navarroData, count: navarroCount } = await supabase
      .from('dialectal_lexicon')
      .select('validado_humanamente, confianca_extracao', { count: 'exact' })
      .eq('tipo_dicionario', 'navarro_2014');

    const avgNavarroConfidence = navarroData && navarroData.length > 0 
      ? navarroData.reduce((acc, d) => acc + (d.confianca_extracao || 0), 0) / navarroData.length
      : 0;

    if ((navarroCount || 0) === 0) {
      results.push({
        check_type: 'navarro_2014',
        status: 'warning',
        message: 'Navarro 2014 não importado',
        details: { count: 0 },
        metrics: { total: 0, expected: 15000 }
      });
    } else if ((navarroCount || 0) < 10000) {
      results.push({
        check_type: 'navarro_2014',
        status: 'warning',
        message: `Navarro incompleto (${navarroCount}/15000)`,
        details: { count: navarroCount, missing: 15000 - (navarroCount || 0) },
        metrics: { total: navarroCount, completion: ((navarroCount || 0) / 15000) * 100 }
      });
    } else {
      results.push({
        check_type: 'navarro_2014',
        status: 'healthy',
        message: `Navarro 2014 completo (${navarroCount} entradas)`,
        details: {},
        metrics: { total: navarroCount, avgConfidence: avgNavarroConfidence }
      });
    }

    // ✅ 3. Check Gutenberg (atualizado)
    const { count: gutenbergCount } = await supabase
      .from('gutenberg_lexicon')
      .select('*', { count: 'exact', head: true });

    if ((gutenbergCount || 0) < 10000) {
      results.push({
        check_type: 'gutenberg',
        status: 'critical',
        message: 'Gutenberg não importado',
        details: { current_count: gutenbergCount, expected: 700000 },
        metrics: { total: gutenbergCount, completion: ((gutenbergCount || 0) / 700000) * 100 }
      });
    } else if ((gutenbergCount || 0) < 500000) {
      results.push({
        check_type: 'gutenberg',
        status: 'warning',
        message: `Gutenberg incompleto (${gutenbergCount}/700k)`,
        details: { current_count: gutenbergCount, missing: 700000 - (gutenbergCount || 0) },
        metrics: { total: gutenbergCount, completion: ((gutenbergCount || 0) / 700000) * 100 }
      });
    } else {
      results.push({
        check_type: 'gutenberg',
        status: 'healthy',
        message: `Gutenberg completo (${gutenbergCount} entradas)`,
        details: {},
        metrics: { total: gutenbergCount }
      });
    }

    // ✅ 4. Check Rocha Pombo (atualizado)
    const { count: rochaPomboCount } = await supabase
      .from('lexical_synonyms')
      .select('*', { count: 'exact', head: true })
      .eq('fonte', 'rocha_pombo');

    const rochaPomboStatus = rochaPomboCount && rochaPomboCount > 15000 ? 'healthy' : 
                              rochaPomboCount && rochaPomboCount > 5000 ? 'warning' : 'critical';
    
    results.push({
      check_type: 'rocha_pombo',
      status: rochaPomboStatus,
      message: rochaPomboStatus === 'healthy' 
        ? `Rocha Pombo completo (${rochaPomboCount} sinônimos)`
        : `Rocha Pombo incompleto (${rochaPomboCount}/20000)`,
      details: { count: rochaPomboCount, expected: 20000 },
      metrics: { total: rochaPomboCount || 0, completion: ((rochaPomboCount || 0) / 20000) * 100 }
    });

    // ✅ 5. Check Data Integrity (NOVO)
    const { count: orphanedCount } = await supabase
      .from('dialectal_lexicon')
      .select('*', { count: 'exact', head: true })
      .is('tipo_dicionario', null);

    const { count: inconsistentValidationCount } = await supabase
      .from('dialectal_lexicon')
      .select('*', { count: 'exact', head: true })
      .eq('validado_humanamente', true)
      .neq('validation_status', 'approved');

    const integrityIssues = (orphanedCount || 0) + (inconsistentValidationCount || 0);

    if (integrityIssues > 0) {
      results.push({
        check_type: 'data_integrity',
        status: integrityIssues > 100 ? 'warning' : 'healthy',
        message: `${integrityIssues} registros com problemas de integridade`,
        details: { orphaned: orphanedCount, inconsistent_validation: inconsistentValidationCount },
        metrics: { total_issues: integrityIssues }
      });
    } else {
      results.push({
        check_type: 'data_integrity',
        status: 'healthy',
        message: 'Integridade de dados OK',
        details: {},
        metrics: { total_issues: 0 }
      });
    }

    // ✅ 6. Check Stalled Jobs (atualizado com threshold 30 min)
    const { data: stalledJobs } = await supabase
      .from('dictionary_import_jobs')
      .select('*')
      .in('status', ['processando', 'iniciado'])
      .lt('atualizado_em', new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if (stalledJobs && stalledJobs.length > 0) {
      results.push({
        check_type: 'system_jobs',
        status: 'critical',
        message: `${stalledJobs.length} job(s) travado(s) há mais de 30 minutos`,
        details: { stalled_jobs: stalledJobs.map(j => ({ id: j.id, tipo: j.tipo_dicionario, updated: j.atualizado_em })) },
        metrics: { stalled_count: stalledJobs.length }
      });
    } else {
      results.push({
        check_type: 'system_jobs',
        status: 'healthy',
        message: 'Nenhum job travado',
        details: {},
        metrics: { stalled_count: 0 }
      });
    }

    // ✅ 7. Check Recent Imports (NOVO - últimas 24h)
    const { data: recentJobs, count: recentJobCount } = await supabase
      .from('dictionary_import_jobs')
      .select('*', { count: 'exact' })
      .gte('criado_em', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const recentSuccessful = recentJobs?.filter(j => j.status === 'concluido').length || 0;
    const recentFailed = recentJobs?.filter(j => j.status === 'erro').length || 0;

    results.push({
      check_type: 'recent_imports',
      status: recentFailed > recentSuccessful ? 'warning' : 'healthy',
      message: `${recentJobCount || 0} importações nas últimas 24h (${recentSuccessful} OK, ${recentFailed} falhas)`,
      details: { total: recentJobCount, successful: recentSuccessful, failed: recentFailed },
      metrics: { total: recentJobCount, success_rate: recentJobCount ? (recentSuccessful / recentJobCount) * 100 : 0 }
    });

    // ✅ 8. Overall system status
    const criticalCount = results.filter(r => r.status === 'critical').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const healthyCount = results.filter(r => r.status === 'healthy').length;

    results.push({
      check_type: 'system_overall',
      status: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy',
      message: criticalCount > 0 
        ? `Sistema com problemas: ${criticalCount} críticos, ${warningCount} avisos` 
        : warningCount > 0 
        ? `Sistema funcional com ${warningCount} aviso(s)` 
        : `Sistema 100% saudável (${healthyCount} checks OK)`,
      details: { critical: criticalCount, warnings: warningCount, healthy: healthyCount },
      metrics: { critical: criticalCount, warnings: warningCount, healthy: healthyCount }
    });

    // Save to cache
    for (const result of results) {
      await supabase
        .from('lexicon_health_status')
        .upsert({
          check_type: result.check_type,
          status: result.status,
          message: result.message,
          details: result.details,
          metrics: result.metrics,
          checked_at: now,
          expires_at: expiresAt,
          checked_by: 'system'
        }, { onConflict: 'check_type' });
    }

    log.info('Health check completed and cached', { resultsCount: results.length });

    return new Response(JSON.stringify({ results, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log.error('Error in health check', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});