/**
 * 🔬 HYBRID POS ANNOTATOR - Layer 1: VA Grammar
 * 
 * Sistema híbrido de anotação POS que prioriza gramática interna
 * antes de recorrer a spaCy ou IA
 */

import { 
  irregularVerbs, 
  conjugatedToInfinitive,
  auxiliaryVerbs 
} from './verbal-morphology.ts';
import {
  personalPronouns,
  possessivePronouns,
  demonstrativePronouns,
  indefinitePronouns,
  relativePronouns,
  interrogativePronouns,
} from './pronoun-system.ts';
import { detectGauchoMWEs } from './gaucho-mwe.ts';
import { 
  getCachedPOSAnnotation, 
  setCachedPOSAnnotation,
} from './pos-annotation-cache.ts';

// Features compatible with Record<string, string>
type MorphFeatures = Record<string, string>;

export interface AnnotatedToken {
  palavra: string;
  lema: string;
  pos: string;
  posDetalhada: string;
  features: MorphFeatures;
  posicao: number;
  source: 'va_grammar' | 'spacy' | 'gemini' | 'cache';
  confianca: number;
}

// Conjuntos de palavras funcionais
const DETERMINERS = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas']);
const PREPOSITIONS = new Set(['de', 'em', 'para', 'por', 'com', 'sem', 'sobre', 'até', 'desde', 'após', 'ante', 'contra', 'entre', 'perante', 'sob']);
const CONJUNCTIONS = new Set(['e', 'ou', 'mas', 'porém', 'contudo', 'todavia', 'entretanto', 'que', 'se', 'porque', 'quando', 'como', 'embora']);
const ADVERBS = new Set(['não', 'sim', 'nunca', 'sempre', 'talvez', 'aqui', 'ali', 'lá', 'hoje', 'ontem', 'amanhã', 'agora', 'já', 'ainda', 'logo', 'bem', 'mal', 'muito', 'pouco', 'mais', 'menos']);

// Consolidar todos os pronomes em um único Set
const ALL_PRONOUNS = new Set([
  ...Object.values(personalPronouns.retos).flat(),
  ...Object.values(personalPronouns.obliquos.atonos).flat(),
  ...Object.values(personalPronouns.obliquos.tonicos).flat(),
  ...personalPronouns.tratamento,
  ...Object.values(possessivePronouns).flat(),
  ...demonstrativePronouns.proximidade.primeira_pessoa,
  ...demonstrativePronouns.proximidade.segunda_pessoa,
  ...demonstrativePronouns.proximidade.terceira_pessoa,
  ...indefinitePronouns.invariaveis,
  ...indefinitePronouns.variaveis,
  ...relativePronouns.invariaveis,
  ...relativePronouns.variaveis,
  ...interrogativePronouns,
]);

/**
 * Anota texto usando Layer 1 (Gramática VA)
 */
export async function annotateWithVAGrammar(texto: string): Promise<AnnotatedToken[]> {
  // 1. Detectar MWEs primeiro (antes de tokenizar)
  const mwes = detectGauchoMWEs(texto);

  // 2. Tokenizar (simples por espaços e pontuação, evitando MWEs)
  const tokens = tokenizeRespectingMWEs(texto, mwes);

  // 3. Anotar cada token
  const annotated: AnnotatedToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const palavra = tokens[i];
    const leftContext = i > 0 ? tokens[i - 1] : '';
    const rightContext = i < tokens.length - 1 ? tokens[i + 1] : '';

    // Verificar cache primeiro
    const cached = getCachedPOSAnnotation(palavra, leftContext, rightContext);
    if (cached) {
      annotated.push({
        palavra,
        lema: cached.lema,
        pos: cached.pos,
        posDetalhada: cached.posDetalhada,
        features: cached.features,
        posicao: i,
        source: 'cache',
        confianca: 1.0,
      });
      continue;
    }

    // Anotar usando gramática VA
    const annotation = annotateTokenWithGrammar(palavra, leftContext, rightContext);
    annotated.push({
      ...annotation,
      posicao: i,
    });

    // Cachear resultado (apenas se confiança >= 95%)
    if (annotation.confianca >= 0.95) {
      setCachedPOSAnnotation(palavra, {
        palavra: annotation.palavra,
        lema: annotation.lema,
        pos: annotation.pos,
        posDetalhada: annotation.posDetalhada,
        features: annotation.features,
        source: annotation.source,
      }, leftContext, rightContext);
    }
  }

  return annotated;
}

/**
 * Tokeniza texto respeitando MWEs detectadas
 */
function tokenizeRespectingMWEs(texto: string, mwes: ReturnType<typeof detectGauchoMWEs>): string[] {
  const tokens: string[] = [];
  let currentIndex = 0;

  // Ordenar MWEs por posição
  const sortedMWEs = [...mwes].sort((a, b) => a.startIndex - b.startIndex);

  for (const mwe of sortedMWEs) {
    // Adicionar tokens antes da MWE
    const before = texto.substring(currentIndex, mwe.startIndex);
    tokens.push(...simpleTokenize(before));

    // Adicionar MWE como token único
    tokens.push(mwe.text);
    currentIndex = mwe.endIndex;
  }

  // Adicionar tokens restantes
  const after = texto.substring(currentIndex);
  tokens.push(...simpleTokenize(after));

  return tokens.filter(t => t.trim().length > 0);
}

/**
 * Tokenização simples (espaços e pontuação)
 */
function simpleTokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !/^[.,!?;:()"\-]+$/.test(t)); // Remover pontuação isolada
}

/**
 * Anota token individual usando conhecimento gramatical VA
 */
function annotateTokenWithGrammar(
  palavra: string,
  leftContext: string,
  rightContext: string
): AnnotatedToken {
  const lower = palavra.toLowerCase();

  // 1. Verificar verbos irregulares (50+ formas)
  if (conjugatedToInfinitive[lower]) {
    const infinitivo = conjugatedToInfinitive[lower];
    const isAuxiliary = auxiliaryVerbs.includes(infinitivo);
    
    return {
      palavra,
      lema: infinitivo,
      pos: 'VERB',
      posDetalhada: isAuxiliary ? 'AUX' : 'VERB',
      features: inferVerbFeatures(lower, infinitivo),
      posicao: 0,
      source: 'va_grammar',
      confianca: 1.0,
    };
  }

  // 2. Verificar pronomes
  if (ALL_PRONOUNS.has(lower)) {
    const pronounType = inferPronounType(lower);
    return {
      palavra,
      lema: lower,
      pos: 'PRON',
      posDetalhada: pronounType,
      features: {},
      posicao: 0,
      source: 'va_grammar',
      confianca: 1.0,
    };
  }

  // 3. Verificar determinantes (artigos)
  if (DETERMINERS.has(lower)) {
    return {
      palavra,
      lema: lower,
      pos: 'DET',
      posDetalhada: 'ART',
      features: inferDeterminerFeatures(lower),
      posicao: 0,
      source: 'va_grammar',
      confianca: 1.0,
    };
  }

  // 4. Verificar preposições
  if (PREPOSITIONS.has(lower)) {
    return {
      palavra,
      lema: lower,
      pos: 'ADP',
      posDetalhada: 'PREP',
      features: {},
      posicao: 0,
      source: 'va_grammar',
      confianca: 1.0,
    };
  }

  // 5. Verificar conjunções
  if (CONJUNCTIONS.has(lower)) {
    return {
      palavra,
      lema: lower,
      pos: 'CCONJ',
      posDetalhada: 'CONJ',
      features: {},
      posicao: 0,
      source: 'va_grammar',
      confianca: 1.0,
    };
  }

  // 6. Verificar advérbios
  if (ADVERBS.has(lower)) {
    return {
      palavra,
      lema: lower,
      pos: 'ADV',
      posDetalhada: 'ADV',
      features: {},
      posicao: 0,
      source: 'va_grammar',
      confianca: 1.0,
    };
  }

  // 7. Heurísticas simples para substantivos/adjetivos
  if (lower.endsWith('mente')) {
    return {
      palavra,
      lema: lower.replace(/mente$/, ''),
      pos: 'ADV',
      posDetalhada: 'ADV',
      features: {},
      posicao: 0,
      source: 'va_grammar',
      confianca: 0.9,
    };
  }

  if (lower.endsWith('ção') || lower.endsWith('dade') || lower.endsWith('ismo')) {
    return {
      palavra,
      lema: lower,
      pos: 'NOUN',
      posDetalhada: 'NOUN',
      features: { genero: 'Fem', numero: 'Sing' },
      posicao: 0,
      source: 'va_grammar',
      confianca: 0.85,
    };
  }

  // 8. Palavra desconhecida - baixa confiança (para Layer 2/3 processar)
  return {
    palavra,
    lema: lower,
    pos: 'UNKNOWN',
    posDetalhada: 'UNKNOWN',
    features: {},
    posicao: 0,
    source: 'va_grammar',
    confianca: 0.0,
  };
}

function inferVerbFeatures(forma: string, infinitivo: string): MorphFeatures {
  const features: Record<string, string> = {};

  if (forma.endsWith('ndo')) {
    features.tempo = 'Pres';
    features.modo = 'Ger';
  } else if (forma.endsWith('do') || forma.endsWith('to')) {
    features.tempo = 'Past';
    features.modo = 'Part';
  } else if (forma.endsWith('va') || forma.endsWith('vam')) {
    features.tempo = 'Imp';
    features.modo = 'Ind';
  }

  return features;
}

function inferPronounType(pronome: string): string {
  const allRetos = Object.values(personalPronouns.retos).flat();
  const allAtonos = Object.values(personalPronouns.obliquos.atonos).flat();
  const allTonicos = Object.values(personalPronouns.obliquos.tonicos).flat();
  
  if (allRetos.includes(pronome)) return 'PRON_PERS';
  if (allAtonos.includes(pronome) || allTonicos.includes(pronome)) return 'PRON_OBL';
  if (Object.values(possessivePronouns).some(p => p.includes(pronome))) return 'PRON_POSS';
  if ([
    ...demonstrativePronouns.proximidade.primeira_pessoa,
    ...demonstrativePronouns.proximidade.segunda_pessoa,
    ...demonstrativePronouns.proximidade.terceira_pessoa
  ].includes(pronome)) return 'PRON_DEM';
  if (indefinitePronouns.invariaveis.includes(pronome) || 
      indefinitePronouns.variaveis.includes(pronome)) return 'PRON_IND';
  if (relativePronouns.invariaveis.includes(pronome) || 
      relativePronouns.variaveis.includes(pronome)) return 'PRON_REL';
  if (interrogativePronouns.includes(pronome)) return 'PRON_INT';

  return 'PRON';
}

function inferDeterminerFeatures(det: string): MorphFeatures {
  const features: Record<string, string> = {};

  if (['o', 'um'].includes(det)) {
    features.genero = 'Masc';
    features.numero = 'Sing';
  } else if (['a', 'uma'].includes(det)) {
    features.genero = 'Fem';
    features.numero = 'Sing';
  } else if (['os', 'uns'].includes(det)) {
    features.genero = 'Masc';
    features.numero = 'Plur';
  } else if (['as', 'umas'].includes(det)) {
    features.genero = 'Fem';
    features.numero = 'Plur';
  }

  return features;
}

/**
 * Calcula estatísticas de cobertura do Layer 1
 */
export function calculateVAGrammarCoverage(tokens: AnnotatedToken[]): {
  totalTokens: number;
  coveredByVA: number;
  coverageRate: number;
  unknownWords: string[];
  sourceDistribution: Record<string, number>;
} {
  const total = tokens.length;
  const covered = tokens.filter(t => t.source === 'va_grammar' && t.confianca > 0.8).length;
  const unknown = tokens.filter(t => t.pos === 'UNKNOWN').map(t => t.palavra);

  const sourceDistribution = tokens.reduce((acc, t) => {
    acc[t.source] = (acc[t.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTokens: total,
    coveredByVA: covered,
    coverageRate: total > 0 ? (covered / total) * 100 : 0,
    unknownWords: [...new Set(unknown)],
    sourceDistribution,
  };
}