/**
 * 🧩 CORPUS CHUNK SERVICE
 * Carregamento incremental de corpus completo em chunks
 * Otimizado para corpora grandes (30k+ músicas)
 */

import { supabase } from '@/integrations/supabase/client';
import { CorpusCompleto, SongEntry, SongMetadata } from '@/data/types/full-text-corpus.types';
import { CorpusType } from '@/data/types/corpus-tools.types';
import { createLogger } from '@/lib/loggerFactory';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const log = createLogger('corpusChunkService');

interface ChunkCache extends DBSchema {
  chunks: {
    key: string; // `${corpusId}-chunk-${index}`
    value: {
      corpusId: string;
      chunkIndex: number;
      songs: any[];
      cachedAt: number;
      totalChunks: number;
    };
  };
}

export interface ChunkConfig {
  chunkSize: number;
  onProgress?: (loaded: number, total: number, percentage: number) => void;
}

export interface CorpusStats {
  totalSongs: number;
  songsWithLyrics: number;
  totalArtists: number;
}

const CACHE_VERSION = 1;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Obter estatísticas de corpus sem carregar letras
 */
export async function getCorpusStats(corpusId: string): Promise<CorpusStats> {
  log.info('Getting corpus stats', { corpusId });
  
  try {
    // Contar total de músicas
    const { count: totalSongs, error: countError } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artists.corpus_id', corpusId);
    
    if (countError) throw countError;
    
    // Contar músicas com letras
    const { count: songsWithLyrics, error: lyricsError } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artists.corpus_id', corpusId)
      .not('lyrics', 'is', null);
    
    if (lyricsError) throw lyricsError;
    
    // Contar artistas únicos
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id', { count: 'exact', head: true })
      .eq('corpus_id', corpusId);
    
    if (artistsError) throw artistsError;
    
    return {
      totalSongs: totalSongs || 0,
      songsWithLyrics: songsWithLyrics || 0,
      totalArtists: artists?.length || 0
    };
  } catch (error) {
    log.error('Failed to get corpus stats', error as Error);
    throw error;
  }
}

/**
 * Carregar um chunk específico de músicas
 */
export async function loadCorpusChunk(
  corpusId: string,
  offset: number,
  limit: number
): Promise<{ songs: SongEntry[]; hasMore: boolean }> {
  log.info('Loading corpus chunk', { corpusId, offset, limit });
  
  try {
    const { data: songs, error } = await supabase
      .from('songs')
      .select(`
        id,
        title,
        lyrics,
        release_year,
        enrichment_source,
        artists!inner (
          id,
          name,
          corpus_id
        )
      `)
      .eq('artists.corpus_id', corpusId)
      .not('lyrics', 'is', null)
      .range(offset, offset + limit - 1);
    
    if (error) {
      log.error('Failed to load chunk', error);
      throw new Error(`Erro ao carregar chunk: ${error.message}`);
    }
    
    const songEntries: SongEntry[] = [];
    let posicaoGlobal = offset;
    
    for (const song of songs || []) {
      if (!song.lyrics || !song.artists) continue;
      
      const metadata: SongMetadata = {
        artista: song.artists.name,
        compositor: undefined,
        album: '',
        musica: song.title,
        ano: song.release_year || undefined,
        fonte: (song.enrichment_source as any) || 'manual'
      };
      
      const letra = song.lyrics.trim();
      const linhas = letra.split('\n').filter(l => l.trim());
      const palavras = letra
        .toLowerCase()
        .replace(/[^\wáéíóúâêôãõàèìòùäëïöüçñ\s]/g, ' ')
        .split(/\s+/)
        .filter(p => p.length > 0);
      
      if (palavras.length === 0) continue;
      
      songEntries.push({
        metadata,
        letra,
        linhas,
        palavras,
        posicaoNoCorpus: posicaoGlobal
      });
      
      posicaoGlobal += palavras.length;
    }
    
    return {
      songs: songEntries,
      hasMore: (songs?.length || 0) === limit
    };
  } catch (error) {
    log.error('Failed to load corpus chunk', error as Error);
    throw error;
  }
}

/**
 * Carregar corpus completo em chunks com cache IndexedDB
 */
export async function loadCorpusInChunks(
  corpusId: string,
  corpusType: CorpusType,
  config: ChunkConfig
): Promise<CorpusCompleto> {
  log.info('Loading full corpus in chunks', { corpusId, chunkSize: config.chunkSize });
  
  try {
    // Abrir IndexedDB
    const db = await openDB<ChunkCache>('corpus-chunks', CACHE_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chunks')) {
          db.createObjectStore('chunks');
        }
      }
    });
    
    // Obter estatísticas para calcular total de chunks
    const stats = await getCorpusStats(corpusId);
    const totalSongs = stats.songsWithLyrics;
    const totalChunks = Math.ceil(totalSongs / config.chunkSize);
    
    log.info('Corpus stats', { totalSongs, totalChunks });
    
    const allSongs: SongEntry[] = [];
    let loadedSongs = 0;
    
    // Carregar cada chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const cacheKey = `${corpusId}-chunk-${chunkIndex}`;
      
      // Verificar cache
      const cached = await db.get('chunks', cacheKey);
      let chunkSongs: SongEntry[];
      
      if (cached && Date.now() - cached.cachedAt < CACHE_EXPIRY_MS) {
        // Usar cache
        log.info('Using cached chunk', { chunkIndex });
        chunkSongs = cached.songs.map(transformToSongEntry);
      } else {
        // Carregar do banco
        const offset = chunkIndex * config.chunkSize;
        const { songs } = await loadCorpusChunk(corpusId, offset, config.chunkSize);
        chunkSongs = songs;
        
        // Salvar no cache
        await db.put('chunks', {
          corpusId,
          chunkIndex,
          songs: songs.map(stripSongEntry),
          cachedAt: Date.now(),
          totalChunks
        }, cacheKey);
      }
      
      allSongs.push(...chunkSongs);
      loadedSongs += chunkSongs.length;
      
      // Callback de progresso
      if (config.onProgress) {
        const percentage = Math.round((loadedSongs / totalSongs) * 100);
        config.onProgress(loadedSongs, totalSongs, percentage);
      }
    }
    
    const totalPalavras = allSongs.reduce((sum, s) => sum + s.palavras.length, 0);
    
    log.info('Corpus loaded successfully', {
      totalMusicas: allSongs.length,
      totalPalavras,
      avgWordsPerSong: (totalPalavras / allSongs.length).toFixed(1)
    });
    
    return {
      tipo: corpusType,
      totalMusicas: allSongs.length,
      totalPalavras,
      musicas: allSongs
    };
  } catch (error) {
    log.error('Failed to load corpus in chunks', error as Error);
    throw error;
  }
}

/**
 * Invalidar cache de chunks para um corpus
 */
export async function invalidateCorpusCache(corpusId: string): Promise<void> {
  try {
    const db = await openDB<ChunkCache>('corpus-chunks', CACHE_VERSION);
    const allKeys = await db.getAllKeys('chunks');
    const corpusKeys = allKeys.filter(key => key.toString().startsWith(corpusId));
    
    for (const key of corpusKeys) {
      await db.delete('chunks', key);
    }
    
    log.info('Cache invalidated', { corpusId, deletedChunks: corpusKeys.length });
  } catch (error) {
    log.error('Failed to invalidate cache', error as Error);
  }
}

// Funções auxiliares para serialização
function stripSongEntry(song: SongEntry): any {
  return {
    metadata: song.metadata,
    letra: song.letra,
    linhas: song.linhas,
    palavras: song.palavras,
    posicaoNoCorpus: song.posicaoNoCorpus
  };
}

function transformToSongEntry(data: any): SongEntry {
  return {
    metadata: data.metadata,
    letra: data.letra,
    linhas: data.linhas,
    palavras: data.palavras,
    posicaoNoCorpus: data.posicaoNoCorpus
  };
}
