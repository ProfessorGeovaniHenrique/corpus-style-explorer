/**
 * Types for POS (Part-of-Speech) Annotation
 * Used for morphosyntactic analysis of corpus texts
 */

import { CorpusType } from './corpus-tools.types';

export interface POSToken {
  palavra: string;           // Original word form
  lema: string;              // Canonical form (e.g., "correndo" → "correr")
  pos: string;               // Universal POS tag (NOUN, VERB, ADJ, ADV, etc.)
  posDetalhada: string;      // Fine-grained POS (PROPN, AUX, DET, etc.)
  features: MorphFeatures;   // Morphological features
  posicao: number;           // Position in text
}

export interface MorphFeatures {
  tempo?: 'Pres' | 'Past' | 'Fut' | 'Imp';
  numero?: 'Sing' | 'Plur';
  pessoa?: '1' | '2' | '3';
  genero?: 'Masc' | 'Fem';
  modo?: 'Ind' | 'Sub' | 'Imp';
  grau?: 'Cmp' | 'Sup' | 'Abs';
}

export interface POSAnnotatedSong {
  musicaId: string;
  metadata: {
    artista: string;
    musica: string;
    album?: string;
    ano?: string;
  };
  tokens: POSToken[];
}

export interface CorpusComPOS {
  tipo: CorpusType;
  totalMusicas: number;
  totalPalavras: number;
  totalTokens: number;
  musicas: POSAnnotatedSong[];
}

export interface POSStatistics {
  totalTokens: number;
  distribuicaoPOS: Record<string, number>;
  distribuicaoPercentual: Record<string, number>;
  lemasFrequentes: Array<{
    lema: string;
    pos: string;
    frequencia: number;
  }>;
  temposVerbais: Record<string, number>;
  densidadeLexical: number; // (NOUN + VERB + ADJ + ADV) / total
  typeTokenRatio: number;    // unique tokens / total tokens
}

export interface POSFilter {
  posTags?: string[];        // Filter by POS tags
  lemmas?: string[];         // Filter by lemmas
  features?: Partial<MorphFeatures>; // Filter by morphological features
}

export interface POSAnnotationRequest {
  texto: string;
  idioma?: 'pt' | 'es';
}

export interface POSAnnotationResponse {
  tokens: POSToken[];
  statistics: POSStatistics;
  error?: string;
}
