import { CorpusCompleto, KWICContext } from "@/data/types/full-text-corpus.types";

/**
 * Generate KWIC (Keyword in Context) concordances
 * 
 * @param corpus - Full-text corpus
 * @param palavraChave - Target keyword
 * @param contextoSize - Number of words to show on each side (default: 5)
 * @returns Array of KWIC contexts
 */
export function generateKWIC(
  corpus: CorpusCompleto,
  palavraChave: string,
  contextoSize: number = 5
): KWICContext[] {
  const resultados: KWICContext[] = [];
  const palavraNormalizada = palavraChave.toLowerCase().trim();
  
  console.log(`🔍 Buscando KWIC para "${palavraChave}" com contexto de ${contextoSize} palavras`);
  
  corpus.musicas.forEach((musica, musicaIdx) => {
    musica.palavras.forEach((palavra, idx) => {
      if (palavra === palavraNormalizada) {
        const inicio = Math.max(0, idx - contextoSize);
        const fim = Math.min(musica.palavras.length, idx + contextoSize + 1);
        
        const contextoEsquerdo = musica.palavras.slice(inicio, idx).join(' ');
        const contextoDireito = musica.palavras.slice(idx + 1, fim).join(' ');
        const linhaCompleta = musica.palavras.slice(inicio, fim).join(' ');
        
        resultados.push({
          palavra: palavraChave,
          contextoEsquerdo,
          contextoDireito,
          metadata: musica.metadata,
          posicaoNaMusica: idx,
          linhaCompleta
        });
      }
    });
    
    if (musicaIdx < 3 && resultados.length > 0) {
      console.log(`  ✓ Música ${musicaIdx + 1}: ${resultados.length} ocorrências até agora`);
    }
  });
  
  console.log(`✅ Total de ${resultados.length} ocorrências de "${palavraChave}"`);
  
  return resultados;
}

/**
 * Export KWIC results to CSV format
 */
export function exportKWICToCSV(contexts: KWICContext[]): string {
  const header = 'Contexto Esquerdo,Palavra-Chave,Contexto Direito,Artista,Música,Álbum,Posição\n';
  
  const rows = contexts.map(ctx => {
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    
    return [
      escapeCsv(ctx.contextoEsquerdo),
      escapeCsv(ctx.palavra),
      escapeCsv(ctx.contextoDireito),
      escapeCsv(ctx.metadata.artista),
      escapeCsv(ctx.metadata.musica),
      escapeCsv(ctx.metadata.album || ''),
      ctx.posicaoNaMusica
    ].join(',');
  });
  
  return header + rows.join('\n');
}
