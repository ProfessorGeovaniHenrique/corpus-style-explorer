import { LucideIcon } from "lucide-react";

export interface CorpusWord {
  headword: string;
  rank: number;
  freq: number;
  range: number;
  normFreq: number;
  normRange: number;
}

export interface KeywordEntry {
  palavra: string;
  freqEstudo: number;
  freqReferencia: number;
  normFreqEstudo: number;
  normFreqReferencia: number;
  ll: number;              // Log-Likelihood
  mi: number;              // Mutual Information
  efeito: 'super-representado' | 'sub-representado';
  significancia: 'Alta' | 'Média' | 'Baixa';
  efeitoIcon: LucideIcon;
}

export interface DispersionData {
  palavra: string;
  freq: number;
  range: number;
  dispersao: number;
  categoria: 'Alta dispersão' | 'Média dispersão' | 'Baixa dispersão';
}
