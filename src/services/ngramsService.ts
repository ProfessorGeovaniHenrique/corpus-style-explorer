import { CorpusCompleto, NGram, NGramAnalysis } from "@/data/types/full-text-corpus.types";

/**
 * Generate N-grams from corpus
 * 
 * @param corpus - Full-text corpus
 * @param n - Size of n-gram (2 = bigrams, 3 = trigrams, etc.)
 * @param minFrequencia - Minimum frequency to include (default: 2)
 * @param maxResults - Maximum number of results to return (default: 500)
 * @returns N-gram analysis
 */
export function generateNGrams(
  corpus: CorpusCompleto,
  n: number = 2,
  minFrequencia: number = 2,
  maxResults: number = 500
): NGramAnalysis {
  if (n < 2 || n > 5) {
    throw new Error('N deve estar entre 2 e 5');
  }
  
  console.log(`🔢 Gerando ${n}-grams (min freq: ${minFrequencia})...`);
  
  const ngramsMap = new Map<string, NGram>();
  let totalNGrams = 0;
  
  corpus.musicas.forEach((musica, musicaIdx) => {
    const palavras = musica.palavras;
    
    for (let i = 0; i <= palavras.length - n; i++) {
      const ngram = palavras.slice(i, i + n).join(' ');
      totalNGrams++;
      
      // Context: 3 words before and after
      const contextoInicio = Math.max(0, i - 3);
      const contextoFim = Math.min(palavras.length, i + n + 3);
      const contexto = palavras.slice(contextoInicio, contextoFim).join(' ');
      
      if (!ngramsMap.has(ngram)) {
        ngramsMap.set(ngram, {
          ngram,
          frequencia: 0,
          ocorrencias: []
        });
      }
      
      const entry = ngramsMap.get(ngram)!;
      entry.frequencia++;
      
      // Store only first 10 occurrences to save memory
      if (entry.ocorrencias.length < 10) {
        entry.ocorrencias.push({
          contexto,
          metadata: musica.metadata,
          posicao: musica.posicaoNoCorpus + i
        });
      }
    }
    
    if (musicaIdx % 100 === 0 && musicaIdx > 0) {
      console.log(`  ✓ Processadas ${musicaIdx} músicas...`);
    }
  });
  
  // Filter by minimum frequency and sort by frequency
  const ngramsFiltered = Array.from(ngramsMap.values())
    .filter(ng => ng.frequencia >= minFrequencia)
    .sort((a, b) => b.frequencia - a.frequencia)
    .slice(0, maxResults);
  
  console.log(`✅ ${ngramsFiltered.length} ${n}-grams únicos (de ${ngramsMap.size} totais)`);
  console.log(`📊 Total de ${totalNGrams} ${n}-grams processados`);
  
  return {
    n,
    totalNGrams,
    ngramsUnicos: ngramsMap.size,
    ngrams: ngramsFiltered
  };
}

/**
 * Export N-grams to CSV
 */
export function exportNGramsToCSV(analysis: NGramAnalysis): string {
  const header = 'N-gram,Frequência,Exemplo de Contexto,Artista,Música\n';
  
  const rows = analysis.ngrams.map(ng => {
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    
    // Get first occurrence for example
    const exemplo = ng.ocorrencias[0];
    
    return [
      escapeCsv(ng.ngram),
      ng.frequencia,
      escapeCsv(exemplo?.contexto || ''),
      escapeCsv(exemplo?.metadata.artista || ''),
      escapeCsv(exemplo?.metadata.musica || '')
    ].join(',');
  });
  
  return header + rows.join('\n');
}
