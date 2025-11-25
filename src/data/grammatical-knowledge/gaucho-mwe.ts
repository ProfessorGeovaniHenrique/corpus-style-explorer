/**
 * 🧉 MULTI-WORD EXPRESSIONS (MWEs) GAÚCHAS
 * 
 * Templates de expressões compostas típicas da cultura gaúcha
 * para detecção automática antes da tokenização individual
 */

export interface MWETemplate {
  pattern: string;
  regex: RegExp;
  pos: string;
  examples: string[];
  description: string;
}

/**
 * Templates de MWEs específicas da cultura gaúcha
 */
export const gauchoMWETemplates: MWETemplate[] = [
  {
    pattern: 'mate [ADJECTIVE]',
    regex: /\bmate\s+(amargo|doce|quente|frio|puro|chimarrão|gelado|requentado)\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['mate amargo', 'mate chimarrão', 'mate requentado'],
    description: 'Tipos e qualificações do mate',
  },
  {
    pattern: 'cavalo [ADJECTIVE]',
    regex: /\bcavalo\s+(gateado|tordilho|zaino|alazão|pampa|preto|baio|picaço|gordo|magro)\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['cavalo gateado', 'cavalo tordilho', 'cavalo gordo'],
    description: 'Tipos e características de cavalos',
  },
  {
    pattern: 'tropa [ADJECTIVE]',
    regex: /\btropa\s+(velha|nova|gorda|magra|mansa|xucra|boa|ruim)\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['tropa velha', 'tropa gorda', 'tropa mansa'],
    description: 'Qualificações da tropa de gado',
  },
  {
    pattern: '[OBJECT] de [MATERIAL]',
    regex: /\b(bomba|cuia|bota|chiripá|tirador|guaiaca)\s+de\s+(prata|couro|osso|madeira|metal)\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['bomba de prata', 'bota de couro', 'cuia de porongo'],
    description: 'Objetos culturais com material',
  },
  {
    pattern: 'pago [NOUN]',
    regex: /\bpago\s+(lindo|véio|piá|barbudo)\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['pago lindo', 'pago véio'],
    description: 'Qualificações de gaúcho/homem',
  },
  {
    pattern: 'prenda [ADJECTIVE]',
    regex: /\bprenda\s+(linda|querida|faceira|prendada|gaúcha)\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['prenda linda', 'prenda gaúcha'],
    description: 'Qualificações da mulher gaúcha',
  },
  {
    pattern: 'churrasco de [MEAT]',
    regex: /\bchurrasco\s+de\s+(gado|cordeiro|porco|costela|picanha)\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['churrasco de gado', 'churrasco de costela'],
    description: 'Tipos de churrasco',
  },
  {
    pattern: '[ACTION] no campo',
    regex: /\b(lida|trabalho|faina|campereada|rodeio)\s+no\s+campo\b/gi,
    pos: 'NOUN_COMPOUND',
    examples: ['lida no campo', 'trabalho no campo'],
    description: 'Atividades rurais',
  },
  {
    pattern: 'de [ADJECTIVE] tradição',
    regex: /\bde\s+(boa|velha|pura|rica)\s+tradição\b/gi,
    pos: 'PREP_PHRASE',
    examples: ['de boa tradição', 'de velha tradição'],
    description: 'Expressões de herança cultural',
  },
];

/**
 * Lista consolidada de MWEs fixas (expressões idiomáticas)
 */
export const fixedGauchoMWEs: Record<string, { lema: string; pos: string }> = {
  'mate amargo': { lema: 'mate amargo', pos: 'NOUN' },
  'mate doce': { lema: 'mate doce', pos: 'NOUN' },
  'cavalo gateado': { lema: 'cavalo gateado', pos: 'NOUN' },
  'cavalo tordilho': { lema: 'cavalo tordilho', pos: 'NOUN' },
  'bomba de prata': { lema: 'bomba de prata', pos: 'NOUN' },
  'bota de couro': { lema: 'bota de couro', pos: 'NOUN' },
  'lida no campo': { lema: 'lida no campo', pos: 'NOUN' },
  'pago lindo': { lema: 'pago lindo', pos: 'NOUN' },
  'prenda linda': { lema: 'prenda linda', pos: 'NOUN' },
  'churrasco de gado': { lema: 'churrasco de gado', pos: 'NOUN' },
  'de boa tradição': { lema: 'de boa tradição', pos: 'PREP_PHRASE' },
  'no lombo': { lema: 'no lombo', pos: 'PREP_PHRASE' },
  'na querência': { lema: 'na querência', pos: 'PREP_PHRASE' },
  'pelos pagos': { lema: 'pelos pagos', pos: 'PREP_PHRASE' },
  'da campanha': { lema: 'da campanha', pos: 'PREP_PHRASE' },
  'pro galpão': { lema: 'pro galpão', pos: 'PREP_PHRASE' },
};

/**
 * Detecta MWEs no texto usando templates e lista fixa
 * @returns Array de MWEs encontradas com suas posições
 */
export function detectGauchoMWEs(texto: string): Array<{
  text: string;
  startIndex: number;
  endIndex: number;
  lema: string;
  pos: string;
}> {
  const found: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    lema: string;
    pos: string;
  }> = [];

  // 1. Buscar MWEs fixas (case insensitive)
  const lowerText = texto.toLowerCase();
  for (const [mwe, data] of Object.entries(fixedGauchoMWEs)) {
    let startIndex = 0;
    while ((startIndex = lowerText.indexOf(mwe, startIndex)) !== -1) {
      found.push({
        text: texto.substring(startIndex, startIndex + mwe.length),
        startIndex,
        endIndex: startIndex + mwe.length,
        lema: data.lema,
        pos: data.pos,
      });
      startIndex += mwe.length;
    }
  }

  // 2. Buscar usando templates regex
  for (const template of gauchoMWETemplates) {
    const matches = texto.matchAll(template.regex);
    for (const match of matches) {
      if (match.index !== undefined) {
        found.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          lema: match[0].toLowerCase(),
          pos: template.pos,
        });
      }
    }
  }

  // Ordenar por posição e remover sobreposições
  return found
    .sort((a, b) => a.startIndex - b.startIndex)
    .filter((mwe, index, arr) => {
      // Remover se sobrepõe com MWE anterior
      if (index === 0) return true;
      return mwe.startIndex >= arr[index - 1].endIndex;
    });
}

/**
 * Metadados do sistema de MWEs
 */
export const gauchoMWEMetadata = {
  totalTemplates: gauchoMWETemplates.length,
  totalFixedMWEs: Object.keys(fixedGauchoMWEs).length,
  categories: [
    'Bebidas e Alimentos (mate, churrasco)',
    'Animais e Montaria (cavalo, tropa)',
    'Objetos Culturais (bomba, bota, cuia)',
    'Locações (campo, querência, galpão)',
    'Expressões Idiomáticas',
  ],
  lastUpdated: '2025-01-15',
};
