/**
 * 🎵 CATALOG CORPUS SERVICE
 * Carrega corpus de letras diretamente do catálogo de música
 * Substitui arquivos estáticos .txt por queries ao banco de dados
 */

import { supabase } from '@/integrations/supabase/client';
import { CorpusCompleto, SongEntry, SongMetadata } from '@/data/types/full-text-corpus.types';
import { CorpusType } from '@/data/types/corpus-tools.types';
import { createLogger } from '@/lib/loggerFactory';

const log = createLogger('catalogCorpusService');

export interface CatalogCorpusFilters {
  corpusId?: string;
  artistIds?: string[];
  artistNames?: string[];
  years?: number[];
  status?: 'pending' | 'enriched' | 'error';
}

/**
 * Carrega corpus completo do catálogo de música
 * Processa APENAS as letras (lyrics), metadados são preservados mas não processados
 */
export async function loadCorpusFromCatalog(
  corpusType: CorpusType,
  filters?: CatalogCorpusFilters
): Promise<CorpusCompleto> {
  log.info('Loading corpus from catalog', { corpusType, filters });
  
  try {
    // Query base: buscar songs com lyrics não-nulas
    let query = supabase
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
          corpus_id,
          corpora!inner (
            id,
            normalized_name
          )
        )
      `)
      .not('lyrics', 'is', null);
    
    // Aplicar filtros
    if (filters?.corpusId) {
      query = query.eq('artists.corpus_id', filters.corpusId);
    }
    
    if (filters?.artistIds && filters.artistIds.length > 0) {
      query = query.in('artist_id', filters.artistIds);
    }
    
    if (filters?.artistNames && filters.artistNames.length > 0) {
      query = query.in('artists.name', filters.artistNames);
    }
    
    if (filters?.years && filters.years.length > 0) {
      query = query.in('release_year', filters.years.map(String));
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    // Executar query
    const { data: songs, error } = await query;
    
    if (error) {
      log.error('Failed to load songs from catalog', error);
      throw new Error(`Erro ao carregar músicas: ${error.message}`);
    }
    
    if (!songs || songs.length === 0) {
      log.warn('No songs found in catalog', { corpusType, filters });
      return {
        tipo: corpusType,
        totalMusicas: 0,
        totalPalavras: 0,
        musicas: []
      };
    }
    
    log.info('Songs loaded from catalog', { count: songs.length });
    
    // Transformar em formato CorpusCompleto
    const musicas: SongEntry[] = [];
    let posicaoGlobal = 0;
    
    for (const song of songs) {
      // Validar estrutura
      if (!song.lyrics || !song.artists) continue;
      
      const metadata: SongMetadata = {
        artista: song.artists.name,
        compositor: undefined, // Não disponível no catálogo ainda
        album: '', // Não disponível no catálogo ainda
        musica: song.title,
        ano: song.release_year || undefined,
        fonte: (song.enrichment_source as any) || 'manual'
      };
      
      // Processar APENAS as letras
      const letra = song.lyrics.trim();
      const linhas = letra.split('\n').filter(l => l.trim());
      
      // Tokenizar palavras (preservar acentos, remover pontuação)
      const palavras = letra
        .toLowerCase()
        .replace(/[^\wáéíóúâêôãõàèìòùäëïöüçñ\s]/g, ' ')
        .split(/\s+/)
        .filter(p => p.length > 0);
      
      if (palavras.length === 0) {
        log.warn('Song has no words', { songId: song.id, title: song.title });
        continue;
      }
      
      musicas.push({
        metadata,
        letra,
        linhas,
        palavras,
        posicaoNoCorpus: posicaoGlobal
      });
      
      posicaoGlobal += palavras.length;
    }
    
    const totalPalavras = musicas.reduce((sum, m) => sum + m.palavras.length, 0);
    
    log.info('Corpus parsed from catalog', {
      totalMusicas: musicas.length,
      totalPalavras,
      avgWordsPerSong: (totalPalavras / musicas.length).toFixed(1)
    });
    
    return {
      tipo: corpusType,
      totalMusicas: musicas.length,
      totalPalavras,
      musicas
    };
    
  } catch (error) {
    log.error('Failed to load corpus from catalog', error as Error);
    throw error;
  }
}

/**
 * Verifica se o catálogo tem músicas disponíveis para um corpus
 */
export async function hasCatalogCorpus(corpusType: CorpusType): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('songs')
      .select('id', { count: 'exact', head: true })
      .not('lyrics', 'is', null)
      .limit(1);
    
    if (error) {
      log.error('Failed to check catalog availability', error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    log.error('Error checking catalog availability', error as Error);
    return false;
  }
}

/**
 * Obtém lista de artistas disponíveis no catálogo
 */
export async function getCatalogArtists(corpusId?: string): Promise<string[]> {
  try {
    let query = supabase
      .from('artists')
      .select('name')
      .order('name');
    
    if (corpusId) {
      query = query.eq('corpus_id', corpusId);
    }
    
    const { data: artists, error } = await query;
    
    if (error) {
      log.error('Failed to load artists', error);
      return [];
    }
    
    return artists?.map(a => a.name) || [];
  } catch (error) {
    log.error('Error loading artists', error as Error);
    return [];
  }
}

/**
 * Obtém estatísticas de um corpus
 */
export async function getCorpusStats(corpusId: string): Promise<{
  totalSongs: number;
  songsWithLyrics: number;
  totalArtists: number;
}> {
  try {
    const { count: totalSongs, error: countError } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artists.corpus_id', corpusId);
    
    if (countError) throw countError;
    
    const { count: songsWithLyrics, error: lyricsError } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artists.corpus_id', corpusId)
      .not('lyrics', 'is', null);
    
    if (lyricsError) throw lyricsError;
    
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