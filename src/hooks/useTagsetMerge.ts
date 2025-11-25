/**
 * Hook para gerenciar mesclagem de tagsets
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tagset } from "./useTagsets";

interface MergeTagsetsParams {
  survivorId: string;
  absorbedId: string;
  mergedData: Partial<Tagset>;
}

interface SplitTagsetParams {
  originalId: string;
  newTagsets: Array<{
    codigo: string;
    nome: string;
    descricao?: string;
    exemplos?: string[];
    nivel_profundidade: number;
    categoria_pai?: string | null;
  }>;
  rejectionReason: string;
}

interface IncorporateIntoPendingParams {
  activeId: string;
  pendingId: string;
  newExamples: string[];
  enhancedDescription: string;
}

interface RejectAsDuplicateParams {
  pendingId: string;
  reason: string;
}

export const useTagsetMerge = () => {
  const queryClient = useQueryClient();

  const mergeTagsets = useMutation({
    mutationFn: async ({ survivorId, absorbedId, mergedData }: MergeTagsetsParams) => {
      // 1. Atualizar survivor com dados mesclados
      const { error: updateError } = await supabase
        .from('semantic_tagset')
        .update(mergedData)
        .eq('id', survivorId);

      if (updateError) throw updateError;

      // 2. Obter código do absorbed
      const absorbedDataResult = await supabase
        .from('semantic_tagset')
        .select('codigo')
        .eq('id', absorbedId)
        .single();

      // 3. Migrar referências (se existirem)
      if (absorbedDataResult.data?.codigo) {
        const { error: migrateError } = await supabase
          .from('annotated_corpus')
          .update({ tagset_codigo: mergedData.codigo })
          .eq('tagset_codigo', absorbedDataResult.data.codigo);

        if (migrateError) {
          console.warn('Erro ao migrar anotações:', migrateError);
        }
      }

      // 4. Rejeitar absorbed
      const { error: rejectError } = await supabase
        .from('semantic_tagset')
        .update({ 
          status: 'rejeitado',
          rejection_reason: `Mesclado em '${mergedData.nome}' (${mergedData.codigo})`
        })
        .eq('id', absorbedId);

      if (rejectError) throw rejectError;

      // 5. Recalcular hierarquia
      await supabase.rpc('calculate_tagset_hierarchy');

      return { survivorId, absorbedId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic_tagset'] });
      toast.success('Tagsets mesclados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao mesclar tagsets:', error);
      toast.error('Erro ao mesclar tagsets');
    },
  });

  const splitTagset = useMutation({
    mutationFn: async ({ originalId, newTagsets, rejectionReason }: SplitTagsetParams) => {
      // 1. Obter user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // 2. Criar novos tagsets
      const { error: insertError } = await supabase
        .from('semantic_tagset')
        .insert(
          newTagsets.map(t => ({
            ...t,
            status: 'proposto',
            criado_por: userId
          }))
        );

      if (insertError) throw insertError;

      // 3. Rejeitar tagset original
      const { error: rejectError } = await supabase
        .from('semantic_tagset')
        .update({ 
          status: 'rejeitado',
          rejection_reason: rejectionReason
        })
        .eq('id', originalId);

      if (rejectError) throw rejectError;

      // 3. Recalcular hierarquia
      await supabase.rpc('calculate_tagset_hierarchy');

      return { originalId, newCount: newTagsets.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['semantic_tagset'] });
      toast.success(`Tagset dividido em ${data.newCount} novos domínios!`);
    },
    onError: (error) => {
      console.error('Erro ao dividir tagset:', error);
      toast.error('Erro ao dividir tagset');
    },
  });

  const incorporateIntoPending = useMutation({
    mutationFn: async ({ activeId, pendingId, newExamples, enhancedDescription }: IncorporateIntoPendingParams) => {
      // 1. Obter tagset ativo atual
      const { data: activeData, error: fetchError } = await supabase
        .from('semantic_tagset')
        .select('exemplos, descricao')
        .eq('id', activeId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Combinar exemplos (sem duplicatas)
      const currentExamples = activeData.exemplos || [];
      const uniqueNewExamples = newExamples.filter(ex => !currentExamples.includes(ex));
      const combinedExamples = [...currentExamples, ...uniqueNewExamples];

      // 3. Atualizar tagset ativo
      const { error: updateError } = await supabase
        .from('semantic_tagset')
        .update({
          exemplos: combinedExamples,
          descricao: enhancedDescription
        })
        .eq('id', activeId);

      if (updateError) throw updateError;

      // 4. Rejeitar pendente
      const { error: rejectError } = await supabase
        .from('semantic_tagset')
        .update({ 
          status: 'rejeitado',
          rejection_reason: `Incorporado em domínio validado existente`
        })
        .eq('id', pendingId);

      if (rejectError) throw rejectError;

      return { activeId, pendingId, addedExamples: uniqueNewExamples.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['semantic_tagset'] });
      toast.success(`${data.addedExamples} novos exemplos incorporados ao domínio validado!`);
    },
    onError: (error) => {
      console.error('Erro ao incorporar:', error);
      toast.error('Erro ao incorporar exemplos');
    },
  });

  const rejectAsDuplicate = useMutation({
    mutationFn: async ({ pendingId, reason }: RejectAsDuplicateParams) => {
      const { error } = await supabase
        .from('semantic_tagset')
        .update({ 
          status: 'rejeitado',
          rejection_reason: reason
        })
        .eq('id', pendingId);

      if (error) throw error;

      return { pendingId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic_tagset'] });
      toast.success('Domínio pendente rejeitado como duplicado');
    },
    onError: (error) => {
      console.error('Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar domínio');
    },
  });

  return {
    mergeTagsets: mergeTagsets.mutateAsync,
    splitTagset: splitTagset.mutateAsync,
    incorporateIntoPending: incorporateIntoPending.mutateAsync,
    rejectAsDuplicate: rejectAsDuplicate.mutateAsync,
    isMerging: mergeTagsets.isPending,
    isSplitting: splitTagset.isPending,
    isIncorporating: incorporateIntoPending.isPending,
    isRejecting: rejectAsDuplicate.isPending,
  };
};
