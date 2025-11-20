import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@/lib/notifications';
import type { Database } from '@/integrations/supabase/types';

export type ValidationStatus = 'pending' | 'approved' | 'corrected' | 'rejected';

export interface DictionaryEntry {
  id: string;
  verbete: string;
  verbete_normalizado: string;
  classe_gramatical?: string | null;
  definicoes?: any;
  validation_status: ValidationStatus;
  validation_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  raw_data?: any;
}

interface UseDictionaryValidationOptions {
  dictionaryType: 'dialectal' | 'gutenberg';
  volumeFilter?: string;
  limit?: number;
}

type DialectalRow = Database['public']['Tables']['dialectal_lexicon']['Row'];
type GutenbergRow = Database['public']['Tables']['gutenberg_lexicon']['Row'];

export function useDictionaryValidation(options: UseDictionaryValidationOptions) {
  const { dictionaryType, volumeFilter, limit = 100 } = options;
  const queryClient = useQueryClient();
  const tableName = dictionaryType === 'dialectal' ? 'dialectal_lexicon' : 'gutenberg_lexicon';

  // Fetch entries
  const queryResult = useQuery<DictionaryEntry[], Error>({
    queryKey: ['dict-validation', dictionaryType, volumeFilter],
    queryFn: async () => {
      if (dictionaryType === 'dialectal') {
        let query = supabase.from('dialectal_lexicon').select('*');
        
        if (volumeFilter) {
          query = query.eq('volume_fonte', volumeFilter);
        }
        
        const { data, error } = await query
          .order('validation_status', { ascending: true })
          .order('verbete', { ascending: true })
          .limit(limit);

        if (error) throw error;

        return (data as DialectalRow[]).map((item): DictionaryEntry => ({
          id: item.id,
          verbete: item.verbete,
          verbete_normalizado: item.verbete_normalizado,
          classe_gramatical: item.classe_gramatical,
          definicoes: item.definicoes,
          validation_status: (item.validation_status || 'pending') as ValidationStatus,
          validation_notes: item.validation_notes,
          reviewed_at: item.reviewed_at,
          reviewed_by: item.reviewed_by,
          raw_data: item,
        }));
      } else {
        const { data, error } = await supabase
          .from('gutenberg_lexicon')
          .select('*')
          .order('validation_status', { ascending: true })
          .order('verbete', { ascending: true })
          .limit(limit);

        if (error) throw error;

        return (data as GutenbergRow[]).map((item): DictionaryEntry => ({
          id: item.id,
          verbete: item.verbete,
          verbete_normalizado: item.verbete_normalizado,
          classe_gramatical: item.classe_gramatical,
          definicoes: item.definicoes,
          validation_status: (item.validation_status || 'pending') as ValidationStatus,
          validation_notes: item.validation_notes,
          reviewed_at: item.reviewed_at,
          reviewed_by: item.reviewed_by,
          raw_data: item,
        }));
      }
    },
  });

  // Approve
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const user = await supabase.auth.getUser();
      const { error } = await supabase
        .from(tableName)
        .update({
          validation_status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.data.user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dict-validation'] });
    },
  });

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async (payload: { id: string; notes?: string }) => {
      const user = await supabase.auth.getUser();
      const { error } = await supabase
        .from(tableName)
        .update({
          validation_status: 'rejected',
          validation_notes: payload.notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.data.user?.id,
        })
        .eq('id', payload.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dict-validation'] });
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<DictionaryEntry> }) => {
      const user = await supabase.auth.getUser();
      const updates: Record<string, any> = {
        validation_status: 'corrected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.data.user?.id,
      };

      if (payload.data.verbete) updates.verbete = payload.data.verbete;
      if (payload.data.classe_gramatical !== undefined) updates.classe_gramatical = payload.data.classe_gramatical;
      if (payload.data.definicoes) updates.definicoes = payload.data.definicoes;
      if (payload.data.validation_notes) updates.validation_notes = payload.data.validation_notes;

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', payload.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dict-validation'] });
    },
  });

  return {
    entries: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error?.message || null,
    refetch: queryResult.refetch,
    async approveEntry(id: string) {
      try {
        await approveMutation.mutateAsync(id);
      } catch (err) {
        notifications.error('Erro ao aprovar verbete');
        throw err;
      }
    },
    async rejectEntry(id: string, notes?: string) {
      try {
        await rejectMutation.mutateAsync({ id, notes });
      } catch (err) {
        notifications.error('Erro ao rejeitar verbete');
        throw err;
      }
    },
    async updateEntry(id: string, data: Partial<DictionaryEntry>) {
      try {
        await updateMutation.mutateAsync({ id, data });
      } catch (err) {
        notifications.error('Erro ao atualizar verbete');
        throw err;
      }
    },
  };
}
