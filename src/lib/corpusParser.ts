import { CorpusWord } from "@/data/types/corpus-tools.types";

/**
 * Parse TSV corpus file with format:
 * Type  POS  Headword  Rank  Freq  Range  NormFreq  NormRange
 */
export function parseTSVCorpus(tsvContent: string): CorpusWord[] {
  const lines = tsvContent.split('\n').slice(1); // Skip header
  
  return lines
    .filter(line => line.trim())
    .map(line => {
      const columns = line.split('\t');
      
      // TSV format: Type, POS, Headword, Rank, Freq, Range, NormFreq, NormRange
      const headword = columns[2]?.trim() || '';
      const rank = parseInt(columns[3]) || 0;
      const freq = parseInt(columns[4]) || 0;
      const range = parseInt(columns[5]) || 0;
      const normFreq = parseFloat(columns[6]) || 0;
      const normRange = parseFloat(columns[7]) || 0;
      
      return {
        headword,
        rank,
        freq,
        range,
        normFreq,
        normRange
      };
    })
    .filter(word => word.headword && word.freq > 0); // Filter out invalid entries
}

/**
 * Calculate total tokens from corpus
 */
export function calculateTotalTokens(corpus: CorpusWord[]): number {
  return corpus.reduce((total, word) => total + word.freq, 0);
}
