import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ViewMode } from "@/components/advanced/HierarchyViewSelector";

export interface HierarchicalTagset {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  status: string;
  codigo_nivel_1: string | null;
  codigo_nivel_2: string | null;
  codigo_nivel_3: string | null;
  codigo_nivel_4: string | null;
  nivel_profundidade: number | null;
  hierarquia_completa: string | null;
  tagset_pai: string | null;
  tagsets_filhos: string[] | null;
  exemplos: string[] | null;
}

export function useHierarchicalTagsets(mode: ViewMode) {
  return useQuery({
    queryKey: ['hierarchical-tagsets', mode],
    queryFn: async () => {
      let query = supabase
        .from('semantic_tagset')
        .select('*')
        .eq('status', 'ativo');
      
      if (mode.mode === 'geral') {
        // Apenas nível 1
        query = query.eq('nivel_profundidade', 1);
      } else if (mode.mode === 'subnivel') {
        // Nível específico
        query = query.eq('nivel_profundidade', mode.nivel);
      } else if (mode.mode === 'hierarquico') {
        // Todos os níveis, ordenados por hierarquia
        query = query.order('hierarquia_completa', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as HierarchicalTagset[];
    }
  });
}

export function useTagsetsByLevel(nivel: number) {
  return useQuery({
    queryKey: ['tagsets-by-level', nivel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('semantic_tagset')
        .select('*')
        .eq('nivel_profundidade', nivel)
        .eq('status', 'ativo')
        .order('codigo', { ascending: true });
      
      if (error) throw error;
      return data as HierarchicalTagset[];
    }
  });
}

export function useTagsetChildren(codigoPai: string) {
  return useQuery({
    queryKey: ['tagset-children', codigoPai],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('semantic_tagset')
        .select('*')
        .eq('tagset_pai', codigoPai)
        .eq('status', 'ativo')
        .order('codigo', { ascending: true });
      
      if (error) throw error;
      return data as HierarchicalTagset[];
    }
  });
}
