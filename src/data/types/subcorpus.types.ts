import { DominioSemantico } from './corpus.types';
import { KeywordEntry } from './corpus-tools.types';

export interface SubcorpusMetadata {
  id: string;
  artista: string;
  totalMusicas: number;
  totalPalavras: number;
  totalPalavrasUnicas: number;
  riquezaLexical: number; // Type-Token Ratio
  anoInicio?: number;
  anoFim?: number;
  albums: string[];
}

export interface ComparativoSubcorpora {
  subcorpusA: SubcorpusMetadata;
  subcorpusB: SubcorpusMetadata;
  palavrasExclusivas: {
    apenasA: string[];
    apenasB: string[];
    compartilhadas: string[];
  };
  keywordsComparativas: {
    keywordsA: KeywordEntry[];
    keywordsB: KeywordEntry[];
  };
  dominiosComparativos?: {
    dominiosA: DominioSemantico[];
    dominiosB: DominioSemantico[];
  };
}
