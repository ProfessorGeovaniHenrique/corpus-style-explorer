/**
 * Utilitários de Logging Padronizado
 * FASE 3 - BLOCO 2: Observabilidade
 */

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatThroughput(items: number, ms: number): string {
  const seconds = ms / 1000;
  const throughput = items / seconds;
  
  if (throughput > 100) {
    return `${Math.round(throughput)} items/s`;
  } else {
    return `${throughput.toFixed(1)} items/s`;
  }
}

export interface JobStartLogParams {
  fonte: string;
  jobId: string;
  totalEntries: number;
  batchSize: number;
  timeoutMs: number;
  maxRetries: number;
}

export function logJobStart(params: JobStartLogParams): void {
  const { fonte, jobId, totalEntries, batchSize, timeoutMs, maxRetries } = params;
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  📚 [${fonte}] Job ${jobId.substring(0, 8)} iniciado                      
║  📊 Total de entradas: ${totalEntries.toLocaleString()}
║  📦 Batch size: ${batchSize}
║  ⏱️  Timeout: ${timeoutMs}ms
║  🔄 Retry: ${maxRetries}x com backoff exponencial
╚═══════════════════════════════════════════════════════════╝
`);
}

export interface JobProgressLogParams {
  jobId: string;
  processed: number;
  totalEntries: number;
  inserted: number;
  errors: number;
  startTime: number;
}

export function logJobProgress(params: JobProgressLogParams): void {
  const { jobId, processed, totalEntries, inserted, errors, startTime } = params;
  
  const progress = ((processed / totalEntries) * 100).toFixed(1);
  const elapsed = Date.now() - startTime;
  const estimatedTotal = (elapsed / processed) * totalEntries;
  const estimatedRemaining = estimatedTotal - elapsed;
  
  console.log(`
⏳ [${jobId.substring(0, 8)}] Progresso: ${progress}% (${processed.toLocaleString()}/${totalEntries.toLocaleString()})
   ├─ ✅ Inseridos: ${inserted.toLocaleString()}
   ├─ ❌ Erros: ${errors}
   ├─ ⏱️  Tempo decorrido: ${formatDuration(elapsed)}
   └─ 🔮 Tempo estimado restante: ${formatDuration(estimatedRemaining)}
`);
}

export interface JobCompleteLogParams {
  fonte: string;
  jobId: string;
  processed: number;
  totalEntries: number;
  inserted: number;
  errors: number;
  totalTime: number;
}

export function logJobComplete(params: JobCompleteLogParams): void {
  const { fonte, jobId, processed, totalEntries, inserted, errors, totalTime } = params;
  
  const successRate = ((inserted / processed) * 100).toFixed(1);
  const throughput = formatThroughput(processed, totalTime);
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  ✅ [${fonte}] Job ${jobId.substring(0, 8)} CONCLUÍDO                    
║  📊 Processados: ${processed.toLocaleString()}/${totalEntries.toLocaleString()} (${successRate}%)
║  ✔️  Inseridos: ${inserted.toLocaleString()}
║  ❌ Erros: ${errors}
║  ⏱️  Tempo total: ${formatDuration(totalTime)}
║  🚀 Throughput: ${throughput}
╚═══════════════════════════════════════════════════════════╝
`);
}

export interface JobErrorLogParams {
  fonte: string;
  jobId: string;
  error: Error;
}

export function logJobError(params: JobErrorLogParams): void {
  const { fonte, jobId, error } = params;
  
  console.error(`
╔═══════════════════════════════════════════════════════════╗
║  💥 [${fonte}] Job ${jobId.substring(0, 8)} ERRO FATAL                   
║  ❌ ${error.message}
╚═══════════════════════════════════════════════════════════╝
`);
  console.error('Stack trace:', error.stack);
}
