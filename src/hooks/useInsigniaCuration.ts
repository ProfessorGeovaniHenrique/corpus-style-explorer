import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InsigniaCurationEntry {
  id: string;
  palavra: string;
  insignias_culturais: string[] | null;
  tagset_codigo: string;
  confianca: number | null;
  fonte: string | null;
  song_id: string | null;
  artist_id: string | null;
  corpus_name?: string;
}

export interface InsigniaCurationFilters {
  insignia?: string | null;
  withoutInsignia?: boolean;
  potentiallyIncorrect?: boolean;
  corpus?: string | null;
  search?: string;
  validated?: boolean | null;
}

export function useInsigniaCuration(filters: InsigniaCurationFilters, page: number = 0, pageSize: number = 50) {
  return useQuery({
    queryKey: ['insignia-curation', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('semantic_disambiguation_cache')
        .select('id, palavra, insignias_culturais, tagset_codigo, confianca, fonte, song_id, artist_id', { count: 'exact' });

      // Apply filters
      if (filters.withoutInsignia) {
        query = query.or('insignias_culturais.is.null,insignias_culturais.eq.{}');
      } else if (filters.insignia) {
        query = query.contains('insignias_culturais', [filters.insignia]);
      }

      if (filters.search) {
        query = query.ilike('palavra', `%${filters.search}%`);
      }

      if (filters.validated === true) {
        query = query.eq('fonte', 'manual');
      } else if (filters.validated === false) {
        query = query.neq('fonte', 'manual');
      }

      // Pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order('palavra', { ascending: true })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        entries: data as InsigniaCurationEntry[],
        totalCount: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}

export function useUpdateInsignias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, insignias }: { id: string; insignias: string[] }) => {
      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({
          insignias_culturais: insignias,
          fonte: 'manual',
          confianca: 1.0,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      toast.success('Insígnias atualizadas');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useValidateInsignia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({
          fonte: 'manual',
          confianca: 1.0,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      toast.success('Validado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao validar: ${error.message}`);
    },
  });
}

export function useBatchValidateInsignias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({
          fonte: 'manual',
          confianca: 1.0,
        })
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      toast.success(`${count} entradas validadas`);
    },
    onError: (error) => {
      toast.error(`Erro no batch: ${error.message}`);
    },
  });
}

export function useBatchUpdateInsignias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, insignias }: { ids: string[]; insignias: string[] }) => {
      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({
          insignias_culturais: insignias,
          fonte: 'manual',
          confianca: 1.0,
        })
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      toast.success(`${count} entradas atualizadas`);
    },
    onError: (error) => {
      toast.error(`Erro no batch: ${error.message}`);
    },
  });
}

export function useBatchRemoveInsignias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('semantic_disambiguation_cache')
        .update({
          insignias_culturais: [],
          fonte: 'manual',
        })
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['insignia-curation'] });
      queryClient.invalidateQueries({ queryKey: ['insignia-stats'] });
      toast.success(`Insígnias removidas de ${count} entradas`);
    },
    onError: (error) => {
      toast.error(`Erro no batch: ${error.message}`);
    },
  });
}
