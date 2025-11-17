/**
 * Semantic Similarity Utilities
 * Implementa algoritmos para calcular similaridade semântica entre tagsets
 */

import { Tagset } from "@/hooks/useTagsets";

// Re-export Tagset para compatibilidade
export type { Tagset } from "@/hooks/useTagsets";

/**
 * Remove stopwords e normaliza texto
 */
const normalizeText = (text: string): string[] => {
  const stopwords = new Set([
    'a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'os', 'as',
    'para', 'com', 'por', 'que', 'não', 'se', 'na', 'no', 'ao', 'dos', 'das'
  ]);
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .split(/\W+/)
    .filter(word => word.length > 2 && !stopwords.has(word));
};

/**
 * Calcula similaridade de Jaccard entre dois conjuntos de palavras
 */
const jaccardSimilarity = (setA: Set<string>, setB: Set<string>): number => {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
};

/**
 * Extrai bag-of-words de um tagset (exemplos + descrição)
 */
const extractBagOfWords = (tagset: Tagset): Set<string> => {
  const words = new Set<string>();
  
  // Adiciona palavras da descrição
  if (tagset.descricao) {
    normalizeText(tagset.descricao).forEach(w => words.add(w));
  }
  
  // Adiciona palavras dos exemplos
  if (tagset.exemplos && tagset.exemplos.length > 0) {
    tagset.exemplos.forEach(exemplo => {
      normalizeText(exemplo).forEach(w => words.add(w));
    });
  }
  
  return words;
};

/**
 * Calcula score de similaridade semântica entre dois tagsets
 */
export const calculateSemanticSimilarity = (
  tagsetA: Tagset,
  tagsetB: Tagset
): number => {
  const wordsA = extractBagOfWords(tagsetA);
  const wordsB = extractBagOfWords(tagsetB);
  
  // Se algum tagset não tem palavras, similaridade é 0
  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }
  
  return jaccardSimilarity(wordsA, wordsB);
};

/**
 * Sugestão de posicionamento hierárquico
 */
export interface HierarchySuggestion {
  tagsetPai: Tagset;
  similarity: number;
  reason: string;
  nivel_sugerido: number;
}

/**
 * Gera sugestões de posicionamento hierárquico para um tagset pendente
 */
export const generateHierarchySuggestions = (
  tagsetPendente: Tagset,
  tagsetsAtivos: Tagset[],
  maxSuggestions: number = 5
): HierarchySuggestion[] => {
  // Calcula similaridade com todos os tagsets ativos
  const suggestions = tagsetsAtivos
    .map(tagsetAtivo => ({
      tagsetPai: tagsetAtivo,
      similarity: calculateSemanticSimilarity(tagsetPendente, tagsetAtivo),
      nivel_sugerido: (tagsetAtivo.nivel_profundidade || 1) + 1,
      reason: ''
    }))
    .filter(s => s.similarity > 0.1) // Threshold mínimo
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxSuggestions);
  
  // Gera razão para cada sugestão
  suggestions.forEach(sugg => {
    const percentage = Math.round(sugg.similarity * 100);
    const exemplosComuns = findCommonExamples(tagsetPendente, sugg.tagsetPai);
    
    if (exemplosComuns.length > 0) {
      sugg.reason = `${percentage}% de similaridade. Exemplos em comum: ${exemplosComuns.slice(0, 3).join(', ')}`;
    } else {
      sugg.reason = `${percentage}% de similaridade semântica com base na descrição`;
    }
  });
  
  return suggestions;
};

/**
 * Encontra exemplos em comum entre dois tagsets
 */
const findCommonExamples = (tagsetA: Tagset, tagsetB: Tagset): string[] => {
  if (!tagsetA.exemplos || !tagsetB.exemplos) return [];
  
  const exemplosA = new Set(tagsetA.exemplos.map(e => e.toLowerCase()));
  const exemplosB = new Set(tagsetB.exemplos.map(e => e.toLowerCase()));
  
  return [...exemplosA].filter(e => exemplosB.has(e));
};
