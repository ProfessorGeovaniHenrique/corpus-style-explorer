import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnnotationDebugLog {
  id: string;
  request_id: string;
  created_at: string;
  demo_mode: boolean;
  auth_status: string;
  user_id: string | null;
  corpus_type: string;
  job_id: string | null;
  request_payload: any;
  request_headers: any;
  response_status: number;
  response_data: any;
  error_details: any;
  processing_time_ms: number | null;
  words_processed: number | null;
  metadata: any;
}

interface UseAnnotationDebugLogsOptions {
  limit?: number;
  demoOnly?: boolean;
  authStatusFilter?: string;
  corpusTypeFilter?: string;
}

export function useAnnotationDebugLogs(options: UseAnnotationDebugLogsOptions = {}) {
  const { 
    limit = 50, 
    demoOnly, 
    authStatusFilter, 
    corpusTypeFilter 
  } = options;

  return useQuery({
    queryKey: ['annotation-debug-logs', limit, demoOnly, authStatusFilter, corpusTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('annotation_debug_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (demoOnly !== undefined) {
        query = query.eq('demo_mode', demoOnly);
      }

      if (authStatusFilter) {
        query = query.eq('auth_status', authStatusFilter);
      }

      if (corpusTypeFilter) {
        query = query.eq('corpus_type', corpusTypeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useAnnotationDebugLogs] Erro ao buscar logs:', error);
        throw error;
      }

      return data as AnnotationDebugLog[];
    },
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });
}

// Hook para estatísticas agregadas
export function useAnnotationDebugStats() {
  return useQuery({
    queryKey: ['annotation-debug-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('annotation_debug_logs')
        .select('auth_status, response_status, demo_mode, corpus_type');

      if (error) throw error;

      const stats = {
        total: data.length,
        byAuthStatus: {} as Record<string, number>,
        byResponseStatus: {} as Record<number, number>,
        demoRequests: data.filter(l => l.demo_mode).length,
        authenticatedRequests: data.filter(l => !l.demo_mode).length,
        successRate: 0,
        errorRate: 0,
        byCorpusType: {} as Record<string, number>,
      };

      data.forEach(log => {
        // Contar por auth status
        stats.byAuthStatus[log.auth_status] = (stats.byAuthStatus[log.auth_status] || 0) + 1;
        
        // Contar por response status
        stats.byResponseStatus[log.response_status] = (stats.byResponseStatus[log.response_status] || 0) + 1;
        
        // Contar por corpus type
        stats.byCorpusType[log.corpus_type] = (stats.byCorpusType[log.corpus_type] || 0) + 1;
      });

      // Calcular taxas de sucesso/erro
      const successCount = data.filter(l => l.response_status >= 200 && l.response_status < 300).length;
      const errorCount = data.filter(l => l.response_status >= 400).length;
      
      stats.successRate = data.length > 0 ? (successCount / data.length) * 100 : 0;
      stats.errorRate = data.length > 0 ? (errorCount / data.length) * 100 : 0;

      return stats;
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });
}
