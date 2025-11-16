import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tagset {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria_pai: string | null;
  status: string;
  exemplos: string[] | null;
  validacoes_humanas: number;
  criado_por: string | null;
  criado_em: string;
  aprovado_por: string | null;
  aprovado_em: string | null;
}

export function useTagsets() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['semantic-tagsets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('semantic_tagset')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Tagset[];
    },
    // ✅ CORREÇÃO #11: Cache estratégico para dados estáticos
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const proposeTagset = async (tagset: Omit<Tagset, 'id' | 'criado_em' | 'aprovado_por' | 'aprovado_em' | 'validacoes_humanas'>) => {
    try {
      const { error: insertError } = await supabase
        .from('semantic_tagset')
        .insert({
          codigo: tagset.codigo,
          nome: tagset.nome,
          descricao: tagset.descricao,
          categoria_pai: tagset.categoria_pai,
          status: tagset.status,
          exemplos: tagset.exemplos,
          criado_por: tagset.criado_por
        });

      if (insertError) throw insertError;

      toast.success('Tagset proposto com sucesso', {
        description: `O tagset "${tagset.nome}" foi adicionado para revisão.`
      });

      // Invalidar cache após mutação
      await queryClient.invalidateQueries({ queryKey: ['semantic-tagsets'] });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao propor tagset';
      toast.error('Erro ao propor tagset', {
        description: errorMessage
      });
      throw err;
    }
  };

  const stats = {
    totalTagsets: queryResult.data?.length || 0,
    activeTagsets: queryResult.data?.filter(t => t.status === 'ativo').length || 0,
    approvedTagsets: queryResult.data?.filter(t => t.aprovado_por !== null).length || 0
  };

  return {
    tagsets: queryResult.data || [],
    stats,
    isLoading: queryResult.isLoading,
    error: queryResult.error?.message || null,
    refetch: queryResult.refetch,
    proposeTagset
  };
}
