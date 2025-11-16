import { CorpusCompleto, DispersionPoint, DispersionAnalysis } from "@/data/types/full-text-corpus.types";

/**
 * Calculate dispersion coefficient using Juilland's D
 * Ranges from 0 (concentrated) to 1 (evenly dispersed)
 */
function calculateDispersionCoefficient(
  frequencies: number[],
  totalOccurrences: number
): number {
  if (frequencies.length === 0 || totalOccurrences === 0) return 0;
  
  const n = frequencies.length;
  const expectedFreq = totalOccurrences / n;
  
  // Calculate standard deviation
  const variance = frequencies.reduce((sum, freq) => {
    return sum + Math.pow(freq - expectedFreq, 2);
  }, 0) / n;
  
  const stdDev = Math.sqrt(variance);
  
  // Coefficient of variation
  const cv = stdDev / expectedFreq;
  
  // Juilland's D: closer to 1 = more dispersed
  const d = 1 - (cv / Math.sqrt(n - 1));
  
  return Math.max(0, Math.min(1, d));
}

/**
 * Generate dispersion analysis for a word
 */
export function generateDispersion(
  corpus: CorpusCompleto,
  palavra: string
): DispersionAnalysis {
  const pontos: DispersionPoint[] = [];
  const palavraNormalizada = palavra.toLowerCase().trim();
  const frequenciesPorMusica: number[] = [];
  let musicasComPalavra = 0;
  
  console.log(`📊 Analisando dispersão de "${palavra}"`);
  
  corpus.musicas.forEach((musica, musicaIdx) => {
    let freqNaMusica = 0;
    
    musica.palavras.forEach((p, idx) => {
      if (p === palavraNormalizada) {
        const posicaoAbsoluta = musica.posicaoNoCorpus + idx;
        
        pontos.push({
          palavra,
          posicaoNoCorpus: posicaoAbsoluta / corpus.totalPalavras,
          posicaoAbsoluta,
          metadata: musica.metadata,
          musicaIndex: musicaIdx
        });
        
        freqNaMusica++;
      }
    });
    
    frequenciesPorMusica.push(freqNaMusica);
    if (freqNaMusica > 0) musicasComPalavra++;
  });
  
  const coeficienteDispersao = calculateDispersionCoefficient(
    frequenciesPorMusica,
    pontos.length
  );
  
  // Classify dispersion density
  let densidade: 'Alta' | 'Média' | 'Baixa';
  if (coeficienteDispersao > 0.7) densidade = 'Alta';
  else if (coeficienteDispersao > 0.4) densidade = 'Média';
  else densidade = 'Baixa';
  
  console.log(`  ✓ ${pontos.length} ocorrências em ${musicasComPalavra} músicas`);
  console.log(`  ✓ Coeficiente de dispersão: ${coeficienteDispersao.toFixed(3)} (${densidade})`);
  
  return {
    palavra,
    totalOcorrencias: pontos.length,
    pontos,
    coeficienteDispersao,
    musicasComPalavra,
    densidade
  };
}

/**
 * Export dispersion data to CSV
 */
export function exportDispersionToCSV(analysis: DispersionAnalysis): string {
  const header = 'Palavra,Posição no Corpus (%),Posição Absoluta,Artista,Música,Álbum\n';
  
  const rows = analysis.pontos.map(ponto => {
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    
    return [
      escapeCsv(ponto.palavra),
      (ponto.posicaoNoCorpus * 100).toFixed(2),
      ponto.posicaoAbsoluta,
      escapeCsv(ponto.metadata.artista),
      escapeCsv(ponto.metadata.musica),
      escapeCsv(ponto.metadata.album || '')
    ].join(',');
  });
  
  return header + rows.join('\n');
}
