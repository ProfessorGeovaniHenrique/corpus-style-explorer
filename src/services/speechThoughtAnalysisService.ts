/**
 * Speech & Thought Presentation Analysis Service
 * Based on Leech & Short (2007) - Chapter 10
 * Detects categories of speech/thought presentation on NRSA-DS and NRTA-DT scales
 */

import { RhetoricalFigure } from "@/data/types/stylistic-analysis.types";

export interface SpeechPresentationCategory {
  type: 'DS' | 'IS' | 'FIS' | 'FDS' | 'NRSA';
  label: string;
  description: string;
}

export interface ThoughtPresentationCategory {
  type: 'DT' | 'IT' | 'FIT' | 'FDT' | 'NRTA';
  label: string;
  description: string;
}

export interface SpeechThoughtInstance {
  category: string;
  type: 'speech' | 'thought';
  example: string;
  context: string;
  position: number;
  confidence: number;
  metadata?: {
    artista?: string;
    musica?: string;
  };
}

export interface SpeechThoughtProfile {
  corpusType: string;
  totalInstances: number;
  speechInstances: number;
  thoughtInstances: number;
  distribution: {
    speech: Record<string, number>;
    thought: Record<string, number>;
  };
  instances: SpeechThoughtInstance[];
  dominantCategory: {
    speech: string;
    thought: string;
  };
}

const SPEECH_CATEGORIES: SpeechPresentationCategory[] = [
  {
    type: 'DS',
    label: 'Discurso Direto (DS)',
    description: 'Fala com aspas e verbos dicendi: "Eu vou", disse ele'
  },
  {
    type: 'IS',
    label: 'Discurso Indireto (IS)',
    description: 'Fala reportada com backshift: Ele disse que iria'
  },
  {
    type: 'FIS',
    label: 'Discurso Indireto Livre (FIS)',
    description: 'Fala sem marcadores explícitos, 3ª pessoa'
  },
  {
    type: 'FDS',
    label: 'Discurso Direto Livre (FDS)',
    description: 'Fala direta sem aspas ou verbos dicendi'
  },
  {
    type: 'NRSA',
    label: 'Atos de Fala Narrados (NRSA)',
    description: 'Menção de fala sem conteúdo: Ele falou comigo'
  }
];

const THOUGHT_CATEGORIES: ThoughtPresentationCategory[] = [
  {
    type: 'DT',
    label: 'Pensamento Direto (DT)',
    description: 'Pensamento com aspas: "Vou fazer isso", pensou'
  },
  {
    type: 'IT',
    label: 'Pensamento Indireto (IT)',
    description: 'Pensamento reportado: Ele pensou que faria'
  },
  {
    type: 'FIT',
    label: 'Pensamento Indireto Livre (FIT)',
    description: 'Pensamento sem marcadores, 3ª pessoa'
  },
  {
    type: 'FDT',
    label: 'Pensamento Direto Livre (FDT)',
    description: 'Pensamento direto sem aspas'
  },
  {
    type: 'NRTA',
    label: 'Atos Mentais Narrados (NRTA)',
    description: 'Menção de pensamento: Ele refletiu sobre isso'
  }
];

const SPEECH_VERBS = [
  'disse', 'falou', 'gritou', 'murmurou', 'sussurrou', 'perguntou',
  'respondeu', 'exclamou', 'declarou', 'afirmou', 'contou', 'narrou'
];

const THOUGHT_VERBS = [
  'pensou', 'refletiu', 'imaginou', 'considerou', 'ponderou', 'cogitou',
  'acreditou', 'sentiu', 'percebeu', 'notou', 'lembrou', 'recordou'
];

export function detectSpeechPresentation(text: string): SpeechThoughtInstance[] {
  const instances: SpeechThoughtInstance[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach((sentence, idx) => {
    const trimmed = sentence.trim();
    const lowerSentence = trimmed.toLowerCase();
    
    // DS: Com aspas e verbo de fala
    const dsMatch = /[""]([^"""]+)[""],?\s+(\w+)\s+\w+/.exec(trimmed);
    if (dsMatch && SPEECH_VERBS.some(v => lowerSentence.includes(v))) {
      instances.push({
        category: 'DS',
        type: 'speech',
        example: dsMatch[1].substring(0, 100),
        context: trimmed.substring(0, 200),
        position: idx,
        confidence: 0.95
      });
      return;
    }
    
    // NRSA: Verbo de fala sem conteúdo proposicional
    const nrsaVerb = SPEECH_VERBS.find(v => lowerSentence.includes(v));
    if (nrsaVerb && !trimmed.includes('"') && !lowerSentence.includes('que ')) {
      instances.push({
        category: 'NRSA',
        type: 'speech',
        example: trimmed.substring(0, 100),
        context: trimmed,
        position: idx,
        confidence: 0.75
      });
      return;
    }
    
    // IS: Verbo de fala + "que" (backshift)
    if (SPEECH_VERBS.some(v => lowerSentence.includes(v)) && lowerSentence.includes(' que ')) {
      instances.push({
        category: 'IS',
        type: 'speech',
        example: trimmed.substring(0, 100),
        context: trimmed,
        position: idx,
        confidence: 0.85
      });
      return;
    }
    
    // FDS: Aspas sem verbo de fala
    if ((trimmed.includes('"') || trimmed.includes('"')) && !SPEECH_VERBS.some(v => lowerSentence.includes(v))) {
      instances.push({
        category: 'FDS',
        type: 'speech',
        example: trimmed.substring(0, 100),
        context: trimmed,
        position: idx,
        confidence: 0.7
      });
    }
  });
  
  return instances;
}

export function detectThoughtPresentation(text: string): SpeechThoughtInstance[] {
  const instances: SpeechThoughtInstance[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach((sentence, idx) => {
    const trimmed = sentence.trim();
    const lowerSentence = trimmed.toLowerCase();
    
    // DT: Com aspas e verbo de pensamento
    const dtMatch = /[""]([^"""]+)[""],?\s+(\w+)\s+\w+/.exec(trimmed);
    if (dtMatch && THOUGHT_VERBS.some(v => lowerSentence.includes(v))) {
      instances.push({
        category: 'DT',
        type: 'thought',
        example: dtMatch[1].substring(0, 100),
        context: trimmed.substring(0, 200),
        position: idx,
        confidence: 0.95
      });
      return;
    }
    
    // NRTA: Verbo de pensamento sem conteúdo proposicional
    const nrtaVerb = THOUGHT_VERBS.find(v => lowerSentence.includes(v));
    if (nrtaVerb && !trimmed.includes('"') && !lowerSentence.includes('que ')) {
      instances.push({
        category: 'NRTA',
        type: 'thought',
        example: trimmed.substring(0, 100),
        context: trimmed,
        position: idx,
        confidence: 0.75
      });
      return;
    }
    
    // IT: Verbo de pensamento + "que"
    if (THOUGHT_VERBS.some(v => lowerSentence.includes(v)) && lowerSentence.includes(' que ')) {
      instances.push({
        category: 'IT',
        type: 'thought',
        example: trimmed.substring(0, 100),
        context: trimmed,
        position: idx,
        confidence: 0.85
      });
      return;
    }
    
    // FDT: Aspas com verbo mental implícito
    if ((trimmed.includes('"') || trimmed.includes('"')) && !THOUGHT_VERBS.some(v => lowerSentence.includes(v))) {
      const hasMentalContext = /\b(mente|coração|alma|espírito)\b/.test(lowerSentence);
      if (hasMentalContext) {
        instances.push({
          category: 'FDT',
          type: 'thought',
          example: trimmed.substring(0, 100),
          context: trimmed,
          position: idx,
          confidence: 0.6
        });
      }
    }
  });
  
  return instances;
}

export function analyzeSpeechThoughtPresentation(corpus: any): SpeechThoughtProfile {
  const allText = corpus.musicas
    .map((m: any) => m.letra)
    .join('\n\n');
    
  const speechInstances = detectSpeechPresentation(allText);
  const thoughtInstances = detectThoughtPresentation(allText);
  
  const allInstances = [...speechInstances, ...thoughtInstances];
  
  // Adicionar metadata de artista/música
  corpus.musicas.forEach((musica: any) => {
    const musicaText = musica.letra;
    allInstances.forEach(instance => {
      if (musicaText.includes(instance.context.substring(0, 50))) {
        instance.metadata = {
          artista: musica.artista,
          musica: musica.titulo
        };
      }
    });
  });
  
  // Calcular distribuições
  const speechDistribution: Record<string, number> = {};
  speechInstances.forEach(inst => {
    speechDistribution[inst.category] = (speechDistribution[inst.category] || 0) + 1;
  });
  
  const thoughtDistribution: Record<string, number> = {};
  thoughtInstances.forEach(inst => {
    thoughtDistribution[inst.category] = (thoughtDistribution[inst.category] || 0) + 1;
  });
  
  // Encontrar categorias dominantes
  const dominantSpeech = Object.entries(speechDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'NRSA';
  const dominantThought = Object.entries(thoughtDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'NRTA';
  
  return {
    corpusType: corpus.tipo,
    totalInstances: allInstances.length,
    speechInstances: speechInstances.length,
    thoughtInstances: thoughtInstances.length,
    distribution: {
      speech: speechDistribution,
      thought: thoughtDistribution
    },
    instances: allInstances,
    dominantCategory: {
      speech: dominantSpeech,
      thought: dominantThought
    }
  };
}

export function exportSpeechThoughtToCSV(profile: SpeechThoughtProfile): string {
  const rows = [
    ['Tipo', 'Categoria', 'Exemplo', 'Contexto', 'Artista', 'Música', 'Confiança'],
    ...profile.instances.map(inst => [
      inst.type,
      inst.category,
      `"${inst.example.replace(/"/g, '""')}"`,
      `"${inst.context.replace(/"/g, '""')}"`,
      inst.metadata?.artista || '',
      inst.metadata?.musica || '',
      inst.confidence.toFixed(2)
    ])
  ];
  
  return rows.map(row => row.join(',')).join('\n');
}
