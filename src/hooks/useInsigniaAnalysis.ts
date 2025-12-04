import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InsigniaAnalysisResult {
  palavra: string;
  insignias_sugeridas: string[];
  confianca: number;
  justificativa: string;
  conflito_detectado: boolean;
}

export function useAnalyzeSingleInsignia() {
  return useMutation({
    mutationFn: async ({ palavra, corpus }: { palavra: string; corpus?: string }): Promise<InsigniaAnalysisResult> => {
      const response = await supabase.functions.invoke('analyze-insignias', {
        body: { mode: 'single', palavra, corpus_atual: corpus },
      });

      if (response.error) throw response.error;
      return response.data.result;
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
    },
  });
}

export function useAnalyzeBatchInsignias() {
  return useMutation({
    mutationFn: async ({ palavras, corpus }: { palavras: string[]; corpus?: string }): Promise<InsigniaAnalysisResult[]> => {
      const response = await supabase.functions.invoke('analyze-insignias', {
        body: { mode: 'batch', palavras, corpus_atual: corpus },
      });

      if (response.error) throw response.error;
      return response.data.results;
    },
    onError: (error) => {
      toast.error(`Erro na análise em lote: ${error.message}`);
    },
  });
}

export function useApplyAnalysisSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, insignias }: { id: string; insignias: string[] }) => {
      const response = await supabase.functions.invoke('analyze-insignias', {
        body: { mode: 'apply_suggestion', id, insignias },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      toast.success('Sugestão aplicada');
    },
    onError: (error) => {
      toast.error(`Erro ao aplicar: ${error.message}`);
    },
  });
}

export function useDetectConflicts() {
  return useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('analyze-insignias', {
        body: { mode: 'detect_conflicts' },
      });

      if (response.error) throw response.error;
      return response.data;
    },
  });
}
