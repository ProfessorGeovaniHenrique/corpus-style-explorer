/**
 * Regras Morfológicas para Classificação Semântica Zero-Cost
 * 
 * Classifica palavras baseado em padrões morfológicos (sufixos/prefixos)
 * sem necessidade de API calls, mantendo alta precisão.
 */

interface MorphologicalRule {
  pattern: RegExp;
  tagset_n1: string;
  tagset_n2?: string;
  confianca: number;
  description: string;
  requires_pos?: string; // Se especificado, só aplica se POS bater
}

// Regras de sufixos (ordenadas por especificidade)
const SUFFIX_RULES: MorphologicalRule[] = [
  // Substantivos derivacionais - Atividades e Práticas
  { pattern: /ção$/i, tagset_n1: 'AP', tagset_n2: 'AP.01', confianca: 0.88, description: 'Ação/processo (-ção)', requires_pos: 'NOUN' },
  { pattern: /mento$/i, tagset_n1: 'AP', tagset_n2: 'AP.01', confianca: 0.85, description: 'Ação/resultado (-mento)', requires_pos: 'NOUN' },
  { pattern: /agem$/i, tagset_n1: 'AP', confianca: 0.82, description: 'Ação/coleção (-agem)', requires_pos: 'NOUN' },
  
  // Substantivos - Ser Humano (agentes)
  { pattern: /dor$/i, tagset_n1: 'SH', tagset_n2: 'SH.02', confianca: 0.90, description: 'Agente profissional (-dor)', requires_pos: 'NOUN' },
  { pattern: /eiro$/i, tagset_n1: 'SH', tagset_n2: 'SH.02', confianca: 0.85, description: 'Profissional/ocupação (-eiro)', requires_pos: 'NOUN' },
  { pattern: /ista$/i, tagset_n1: 'SH', tagset_n2: 'SH.02', confianca: 0.87, description: 'Profissional/adepto (-ista)', requires_pos: 'NOUN' },
  { pattern: /ante$/i, tagset_n1: 'SH', confianca: 0.80, description: 'Agente (-ante)', requires_pos: 'NOUN' },
  
  // Adjetivos - Qualidades
  { pattern: /oso$/i, tagset_n1: 'SE', confianca: 0.83, description: 'Qualidade abundante (-oso)', requires_pos: 'ADJ' },
  { pattern: /ável$/i, tagset_n1: 'AB', confianca: 0.80, description: 'Capacidade/possibilidade (-ável)', requires_pos: 'ADJ' },
  { pattern: /ível$/i, tagset_n1: 'AB', confianca: 0.80, description: 'Capacidade/possibilidade (-ível)', requires_pos: 'ADJ' },
  { pattern: /ico$/i, tagset_n1: 'CC', confianca: 0.78, description: 'Relativo a ciência/conhecimento (-ico)', requires_pos: 'ADJ' },
  { pattern: /al$/i, tagset_n1: 'AB', confianca: 0.75, description: 'Relativo a (-al)', requires_pos: 'ADJ' },
  
  // Substantivos abstratos
  { pattern: /idade$/i, tagset_n1: 'AB', confianca: 0.85, description: 'Qualidade abstrata (-idade)', requires_pos: 'NOUN' },
  { pattern: /eza$/i, tagset_n1: 'AB', confianca: 0.83, description: 'Qualidade abstrata (-eza)', requires_pos: 'NOUN' },
  { pattern: /ismo$/i, tagset_n1: 'CC', tagset_n2: 'CC.06', confianca: 0.88, description: 'Doutrina/movimento (-ismo)', requires_pos: 'NOUN' },
  { pattern: /ura$/i, tagset_n1: 'AB', confianca: 0.78, description: 'Resultado/qualidade (-ura)', requires_pos: 'NOUN' },
  
  // Advérbios
  { pattern: /mente$/i, tagset_n1: 'MG', confianca: 0.95, description: 'Advérbio de modo (-mente)', requires_pos: 'ADV' },
  
  // Diminutivos/Aumentativos (herdam domínio da palavra base)
  { pattern: /inho$/i, tagset_n1: 'INHERIT', confianca: 0.70, description: 'Diminutivo (-inho)' },
  { pattern: /inha$/i, tagset_n1: 'INHERIT', confianca: 0.70, description: 'Diminutivo (-inha)' },
  { pattern: /zinho$/i, tagset_n1: 'INHERIT', confianca: 0.75, description: 'Diminutivo (-zinho)' },
  { pattern: /zinha$/i, tagset_n1: 'INHERIT', confianca: 0.75, description: 'Diminutivo (-zinha)' },
  { pattern: /ão$/i, tagset_n1: 'INHERIT', confianca: 0.65, description: 'Aumentativo (-ão)' },
  { pattern: /ona$/i, tagset_n1: 'INHERIT', confianca: 0.65, description: 'Aumentativo (-ona)' },
];

// Regras de prefixos
const PREFIX_RULES: MorphologicalRule[] = [
  { pattern: /^des/i, tagset_n1: 'MODIFY', confianca: 0.75, description: 'Negação/reversão (des-)' },
  { pattern: /^in/i, tagset_n1: 'MODIFY', confianca: 0.72, description: 'Negação (in-)' },
  { pattern: /^re/i, tagset_n1: 'MODIFY', confianca: 0.70, description: 'Repetição (re-)' },
  { pattern: /^pre/i, tagset_n1: 'MODIFY', confianca: 0.68, description: 'Anterioridade (pré-)' },
  { pattern: /^anti/i, tagset_n1: 'MODIFY', confianca: 0.75, description: 'Oposição (anti-)' },
  { pattern: /^contra/i, tagset_n1: 'MODIFY', confianca: 0.75, description: 'Oposição (contra-)' },
];

interface MorphologicalClassification {
  tagset_n1: string;
  tagset_n2?: string;
  confianca: number;
  fonte: 'morfologico' | 'heranca';
  rule_description: string;
  base_word?: string; // Para casos de herança
}

/**
 * Aplica regras morfológicas para classificar palavra
 * @param palavra - palavra normalizada
 * @param pos - POS tag (opcional, melhora precisão)
 * @param getLexiconBase - função para buscar palavra base (para herança)
 */
export async function applyMorphologicalRules(
  palavra: string,
  pos?: string,
  getLexiconBase?: (baseWord: string) => Promise<{ tagset_n1: string; tagset_n2?: string } | null>
): Promise<MorphologicalClassification | null> {
  
  // 1. Tentar sufixos
  for (const rule of SUFFIX_RULES) {
    if (rule.pattern.test(palavra)) {
      // Verificar POS se especificado
      if (rule.requires_pos && pos && pos !== rule.requires_pos) {
        continue;
      }
      
      // Caso especial: herança (diminutivos/aumentativos)
      if (rule.tagset_n1 === 'INHERIT') {
        const baseWord = palavra.replace(rule.pattern, '');
        if (getLexiconBase && baseWord.length > 2) {
          const baseClassification = await getLexiconBase(baseWord);
          if (baseClassification) {
            return {
              tagset_n1: baseClassification.tagset_n1,
              tagset_n2: baseClassification.tagset_n2,
              confianca: rule.confianca,
              fonte: 'heranca',
              rule_description: `${rule.description} de "${baseWord}"`,
              base_word: baseWord
            };
          }
        }
        continue; // Não conseguiu herdar, tenta próxima regra
      }
      
      // Classificação direta
      return {
        tagset_n1: rule.tagset_n1,
        tagset_n2: rule.tagset_n2,
        confianca: rule.confianca,
        fonte: 'morfologico',
        rule_description: rule.description
      };
    }
  }
  
  // 2. Tentar prefixos (modifica domínio da palavra base)
  for (const rule of PREFIX_RULES) {
    if (rule.pattern.test(palavra)) {
      const baseWord = palavra.replace(rule.pattern, '');
      if (getLexiconBase && baseWord.length > 3) {
        const baseClassification = await getLexiconBase(baseWord);
        if (baseClassification) {
          // Mantém domínio base mas ajusta confiança
          return {
            tagset_n1: baseClassification.tagset_n1,
            tagset_n2: baseClassification.tagset_n2,
            confianca: rule.confianca,
            fonte: 'morfologico',
            rule_description: `${rule.description} + domínio de "${baseWord}"`,
            base_word: baseWord
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Verifica se palavra é candidata a classificação morfológica
 * (útil para pré-filtrar antes de chamar função completa)
 */
export function hasMorphologicalPattern(palavra: string): boolean {
  return SUFFIX_RULES.some(rule => rule.pattern.test(palavra)) ||
         PREFIX_RULES.some(rule => rule.pattern.test(palavra));
}

/**
 * Retorna estatísticas sobre as regras morfológicas
 */
export function getMorphologicalRulesStats() {
  return {
    total_suffix_rules: SUFFIX_RULES.length,
    total_prefix_rules: PREFIX_RULES.length,
    total_rules: SUFFIX_RULES.length + PREFIX_RULES.length,
    rules_with_pos: SUFFIX_RULES.filter(r => r.requires_pos).length,
    inheritance_rules: SUFFIX_RULES.filter(r => r.tagset_n1 === 'INHERIT').length
  };
}
