import { CorpusCompleto, SongEntry } from "@/data/types/full-text-corpus.types";
import { SubcorpusMetadata, ComparativoSubcorpora } from "@/data/types/subcorpus.types";
import { CorpusWord, KeywordEntry } from "@/data/types/corpus-tools.types";
import { generateKeywords } from "@/services/keywordService";

/**
 * Extrai metadados de todos os artistas do corpus
 */
export function extractSubcorpora(corpus: CorpusCompleto): SubcorpusMetadata[] {
  const artistasMap = new Map<string, SongEntry[]>();
  
  // Agrupar músicas por artista
  corpus.musicas.forEach(musica => {
    const artista = musica.metadata.artista;
    if (!artistasMap.has(artista)) {
      artistasMap.set(artista, []);
    }
    artistasMap.get(artista)!.push(musica);
  });
  
  // Calcular metadados para cada artista
  return Array.from(artistasMap.entries()).map(([artista, musicas]) => {
    const palavras = musicas.flatMap(m => m.palavras);
    const palavrasUnicas = new Set(palavras.map(p => p.toLowerCase()));
    
    const anos = musicas
      .map(m => parseInt(m.metadata.ano || '0'))
      .filter(a => a > 0);
    
    return {
      id: artista.toLowerCase().replace(/\s+/g, '-'),
      artista,
      totalMusicas: musicas.length,
      totalPalavras: palavras.length,
      totalPalavrasUnicas: palavrasUnicas.size,
      riquezaLexical: palavrasUnicas.size / palavras.length,
      anoInicio: anos.length > 0 ? Math.min(...anos) : undefined,
      anoFim: anos.length > 0 ? Math.max(...anos) : undefined,
      albums: [...new Set(musicas.map(m => m.metadata.album))]
    };
  }).sort((a, b) => b.totalPalavras - a.totalPalavras);
}

/**
 * Filtra músicas de um artista específico
 */
function filterMusicasByArtista(corpus: CorpusCompleto, artista: string): SongEntry[] {
  return corpus.musicas.filter(m => m.metadata.artista === artista);
}

/**
 * Converte array de palavras em formato CorpusWord para análise de keywords
 */
function palavrasToCorpusWords(palavras: string[]): CorpusWord[] {
  const frequencyMap = new Map<string, number>();
  
  palavras.forEach(palavra => {
    const palavraLower = palavra.toLowerCase();
    frequencyMap.set(palavraLower, (frequencyMap.get(palavraLower) || 0) + 1);
  });
  
  const totalWords = palavras.length;
  
  // Convert to array and sort by frequency
  const sorted = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1]);
  
  return sorted.map(([palavra, freq], idx) => ({
    headword: palavra,
    rank: idx + 1,
    freq,
    range: 1, // Simplified: cada palavra aparece em pelo menos 1 "texto"
    normFreq: (freq / totalWords) * 1000000, // Per million
    normRange: 1
  }));
}

/**
 * Compara dois subcorpora
 */
export function compareSubcorpora(
  corpus: CorpusCompleto,
  artistaA: string,
  artistaB?: string // Se não fornecido, compara com "resto do corpus"
): ComparativoSubcorpora {
  const musicasA = filterMusicasByArtista(corpus, artistaA);
  const musicasB = artistaB 
    ? filterMusicasByArtista(corpus, artistaB)
    : corpus.musicas.filter(m => m.metadata.artista !== artistaA);
  
  // Extrair palavras
  const palavrasA = musicasA.flatMap(m => m.palavras);
  const palavrasB = musicasB.flatMap(m => m.palavras);
  
  // Calcular metadados
  const palavrasUnicasA = new Set(palavrasA.map(p => p.toLowerCase()));
  const palavrasUnicasB = new Set(palavrasB.map(p => p.toLowerCase()));
  
  // Palavras exclusivas e compartilhadas
  const apenasA = [...palavrasUnicasA].filter(p => !palavrasUnicasB.has(p));
  const apenasB = [...palavrasUnicasB].filter(p => !palavrasUnicasA.has(p));
  const compartilhadas = [...palavrasUnicasA].filter(p => palavrasUnicasB.has(p));
  
  // Metadados dos subcorpora
  const anosA = musicasA.map(m => parseInt(m.metadata.ano || '0')).filter(a => a > 0);
  const anosB = musicasB.map(m => parseInt(m.metadata.ano || '0')).filter(a => a > 0);
  
  const metadataA: SubcorpusMetadata = {
    id: artistaA.toLowerCase().replace(/\s+/g, '-'),
    artista: artistaA,
    totalMusicas: musicasA.length,
    totalPalavras: palavrasA.length,
    totalPalavrasUnicas: palavrasUnicasA.size,
    riquezaLexical: palavrasUnicasA.size / palavrasA.length,
    anoInicio: anosA.length > 0 ? Math.min(...anosA) : undefined,
    anoFim: anosA.length > 0 ? Math.max(...anosA) : undefined,
    albums: [...new Set(musicasA.map(m => m.metadata.album))]
  };
  
  const metadataB: SubcorpusMetadata = {
    id: artistaB ? artistaB.toLowerCase().replace(/\s+/g, '-') : 'resto-corpus',
    artista: artistaB || 'Resto do Corpus',
    totalMusicas: musicasB.length,
    totalPalavras: palavrasB.length,
    totalPalavrasUnicas: palavrasUnicasB.size,
    riquezaLexical: palavrasUnicasB.size / palavrasB.length,
    anoInicio: anosB.length > 0 ? Math.min(...anosB) : undefined,
    anoFim: anosB.length > 0 ? Math.max(...anosB) : undefined,
    albums: [...new Set(musicasB.map(m => m.metadata.album))]
  };
  
  // Calcular keywords comparativas
  const corpusWordsA = palavrasToCorpusWords(palavrasA);
  const corpusWordsB = palavrasToCorpusWords(palavrasB);
  
  const keywordsA = generateKeywords(corpusWordsA, corpusWordsB, 3.84); // p < 0.05
  const keywordsB = generateKeywords(corpusWordsB, corpusWordsA, 3.84);
  
  return {
    subcorpusA: metadataA,
    subcorpusB: metadataB,
    palavrasExclusivas: {
      apenasA,
      apenasB,
      compartilhadas
    },
    keywordsComparativas: {
      keywordsA: keywordsA.slice(0, 30), // Top 30 keywords
      keywordsB: keywordsB.slice(0, 30)
    }
  };
}

/**
 * Busca subcorpus por artista
 */
export function getSubcorpusByArtista(
  subcorpora: SubcorpusMetadata[],
  artista: string
): SubcorpusMetadata | undefined {
  return subcorpora.find(
    s => s.artista.toLowerCase() === artista.toLowerCase()
  );
}
