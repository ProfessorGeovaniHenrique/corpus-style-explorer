/**
 * Mind Style Analysis Service
 * Based on Leech & Short (2007) - Chapter 6
 * Analyzes Hallidayan transitivity, agency patterns, and cognitive perspective
 */

export interface TransitivityProcess {
  type: 'material' | 'mental' | 'relational' | 'verbal' | 'behavioral' | 'existential';
  verb: string;
  count: number;
  examples: string[];
}

export interface AgencyPattern {
  pattern: string;
  description: string;
  frequency: number;
  examples: string[];
}

export interface MindStyleProfile {
  corpusType: string;
  transitivityDistribution: Record<string, number>;
  transitivityPercentages: Record<string, number>;
  topProcesses: TransitivityProcess[];
  agencyPatterns: AgencyPattern[];
  modalityIndicators: {
    certainty: number;
    uncertainty: number;
    obligation: number;
    examples: { type: string; text: string }[];
  };
  perceptionVsAction: {
    perceptionVerbs: number;
    actionVerbs: number;
    ratio: number;
  };
  deixis: {
    temporal: number;
    spatial: number;
    personal: number;
  };
  cognitiveStyle: 'action-oriented' | 'perception-oriented' | 'balanced';
}

const PROCESS_TYPES = {
  material: [
    'fazer', 'ir', 'vir', 'partir', 'chegar', 'correr', 'andar', 'dar', 'tomar',
    'pegar', 'levar', 'trazer', 'construir', 'destruir', 'mover', 'mudar'
  ],
  mental: [
    'pensar', 'saber', 'crer', 'imaginar', 'sentir', 'perceber', 'ver', 'ouvir',
    'lembrar', 'esquecer', 'entender', 'compreender', 'notar', 'reconhecer'
  ],
  relational: [
    'ser', 'estar', 'ficar', 'parecer', 'tornar', 'virar', 'ter', 'possuir',
    'pertencer', 'conter', 'incluir', 'representar', 'significar'
  ],
  verbal: [
    'dizer', 'falar', 'contar', 'narrar', 'perguntar', 'responder', 'gritar',
    'sussurrar', 'murmurar', 'declarar', 'afirmar', 'negar'
  ],
  behavioral: [
    'rir', 'chorar', 'sorrir', 'suspirar', 'respirar', 'dormir', 'acordar',
    'comer', 'beber', 'cantar', 'dançar', 'olhar', 'observar'
  ],
  existential: [
    'existir', 'haver', 'ocorrer', 'acontecer', 'surgir', 'aparecer', 'nascer',
    'morrer', 'viver', 'permanecer', 'continuar', 'durar'
  ]
};

const MODALITY_MARKERS = {
  certainty: ['certamente', 'definitivamente', 'obviamente', 'claramente', 'realmente', 'com certeza'],
  uncertainty: ['talvez', 'possivelmente', 'provavelmente', 'quiçá', 'porventura', 'acaso'],
  obligation: ['deve', 'precisa', 'necessita', 'tem que', 'é preciso', 'é necessário']
};

export function classifyTransitivity(verb: string): string | null {
  const lowerVerb = verb.toLowerCase();
  
  for (const [type, verbs] of Object.entries(PROCESS_TYPES)) {
    if (verbs.some(v => lowerVerb.includes(v) || v.includes(lowerVerb))) {
      return type;
    }
  }
  
  return null;
}

export function analyzeTransitivity(text: string): Record<string, TransitivityProcess> {
  const processes: Record<string, TransitivityProcess> = {};
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      const processType = classifyTransitivity(word);
      if (processType) {
        if (!processes[processType]) {
          processes[processType] = {
            type: processType as any,
            verb: word,
            count: 0,
            examples: []
          };
        }
        processes[processType].count++;
        if (processes[processType].examples.length < 3) {
          processes[processType].examples.push(sentence.trim().substring(0, 100));
        }
      }
    });
  });
  
  return processes;
}

export function analyzeAgency(text: string): AgencyPattern[] {
  const patterns: AgencyPattern[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const agentivePatterns = {
    'explicit-agent': { regex: /\b(eu|ele|ela|nós|eles|elas)\s+\w+/, description: 'Agente explícito como sujeito' },
    'implicit-agent': { regex: /\b\w+do\b|\b\w+da\b/, description: 'Agente implícito (passiva)' },
    'patient-focus': { regex: /\bfoi\s+\w+do\b|\bfoi\s+\w+da\b/, description: 'Foco no paciente (passiva)' },
    'impersonal': { regex: /\b(se|há|existe)\s+\w+/, description: 'Construção impessoal' }
  };
  
  Object.entries(agentivePatterns).forEach(([pattern, config]) => {
    const matches = sentences.filter(s => config.regex.test(s.toLowerCase()));
    if (matches.length > 0) {
      patterns.push({
        pattern,
        description: config.description,
        frequency: matches.length,
        examples: matches.slice(0, 3).map(m => m.trim().substring(0, 100))
      });
    }
  });
  
  return patterns;
}

export function analyzeModality(text: string): MindStyleProfile['modalityIndicators'] {
  const lowerText = text.toLowerCase();
  const examples: { type: string; text: string }[] = [];
  
  let certainty = 0;
  let uncertainty = 0;
  let obligation = 0;
  
  MODALITY_MARKERS.certainty.forEach(marker => {
    const count = (lowerText.match(new RegExp(`\\b${marker}\\b`, 'g')) || []).length;
    certainty += count;
  });
  
  MODALITY_MARKERS.uncertainty.forEach(marker => {
    const count = (lowerText.match(new RegExp(`\\b${marker}\\b`, 'g')) || []).length;
    uncertainty += count;
  });
  
  MODALITY_MARKERS.obligation.forEach(marker => {
    const count = (lowerText.match(new RegExp(`\\b${marker}\\b`, 'g')) || []).length;
    obligation += count;
  });
  
  // Extrair exemplos
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (MODALITY_MARKERS.certainty.some(m => lowerSentence.includes(m))) {
      if (examples.length < 10) examples.push({ type: 'certainty', text: sentence.trim().substring(0, 100) });
    } else if (MODALITY_MARKERS.uncertainty.some(m => lowerSentence.includes(m))) {
      if (examples.length < 10) examples.push({ type: 'uncertainty', text: sentence.trim().substring(0, 100) });
    } else if (MODALITY_MARKERS.obligation.some(m => lowerSentence.includes(m))) {
      if (examples.length < 10) examples.push({ type: 'obligation', text: sentence.trim().substring(0, 100) });
    }
  });
  
  return { certainty, uncertainty, obligation, examples };
}

export function analyzeMindStyle(corpus: any): MindStyleProfile {
  const allText = corpus.musicas
    .map((m: any) => m.letra)
    .join('\n\n');
    
  // Análise de transitividade
  const transitivityProcesses = analyzeTransitivity(allText);
  const totalProcesses = Object.values(transitivityProcesses).reduce((sum, p) => sum + p.count, 0);
  
  const transitivityDistribution: Record<string, number> = {};
  const transitivityPercentages: Record<string, number> = {};
  
  Object.entries(transitivityProcesses).forEach(([type, process]) => {
    transitivityDistribution[type] = process.count;
    transitivityPercentages[type] = (process.count / totalProcesses) * 100;
  });
  
  // Top processos
  const topProcesses = Object.values(transitivityProcesses)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  
  // Análise de agência
  const agencyPatterns = analyzeAgency(allText);
  
  // Análise de modalidade
  const modalityIndicators = analyzeModality(allText);
  
  // Percepção vs. Ação
  const perceptionVerbs = (transitivityDistribution['mental'] || 0) + (transitivityDistribution['behavioral'] || 0);
  const actionVerbs = transitivityDistribution['material'] || 0;
  const ratio = actionVerbs > 0 ? perceptionVerbs / actionVerbs : 0;
  
  // Dêixis (simplificado)
  const temporal = (allText.match(/\b(agora|hoje|ontem|amanhã|sempre|nunca)\b/gi) || []).length;
  const spatial = (allText.match(/\b(aqui|ali|lá|perto|longe|acima|abaixo)\b/gi) || []).length;
  const personal = (allText.match(/\b(eu|tu|ele|ela|nós|vós|eles|elas)\b/gi) || []).length;
  
  // Estilo cognitivo
  let cognitiveStyle: 'action-oriented' | 'perception-oriented' | 'balanced' = 'balanced';
  if (ratio > 1.5) cognitiveStyle = 'perception-oriented';
  else if (ratio < 0.67) cognitiveStyle = 'action-oriented';
  
  return {
    corpusType: corpus.tipo,
    transitivityDistribution,
    transitivityPercentages,
    topProcesses,
    agencyPatterns,
    modalityIndicators,
    perceptionVsAction: {
      perceptionVerbs,
      actionVerbs,
      ratio
    },
    deixis: {
      temporal,
      spatial,
      personal
    },
    cognitiveStyle
  };
}

export function exportMindStyleToCSV(profile: MindStyleProfile): string {
  const rows = [
    ['Métrica', 'Valor'],
    ['Estilo Cognitivo', profile.cognitiveStyle],
    ['', ''],
    ['Distribuição de Transitividade', 'Contagem', 'Percentual'],
    ...Object.entries(profile.transitivityDistribution).map(([type, count]) => [
      type,
      count.toString(),
      `${profile.transitivityPercentages[type].toFixed(2)}%`
    ]),
    ['', ''],
    ['Percepção vs. Ação', ''],
    ['Verbos de Percepção', profile.perceptionVsAction.perceptionVerbs.toString()],
    ['Verbos de Ação', profile.perceptionVsAction.actionVerbs.toString()],
    ['Razão', profile.perceptionVsAction.ratio.toFixed(2)],
    ['', ''],
    ['Modalidade', ''],
    ['Certeza', profile.modalityIndicators.certainty.toString()],
    ['Incerteza', profile.modalityIndicators.uncertainty.toString()],
    ['Obrigação', profile.modalityIndicators.obligation.toString()]
  ];
  
  return rows.map(row => row.join(',')).join('\n');
}
