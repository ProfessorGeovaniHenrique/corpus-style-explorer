/**
 * Hook para dados filtrados do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/components/music/SongCard';
import type { MusicCatalogState } from './useMusicCatalogState';

export function useFilteredData(
  state: MusicCatalogState,
  convertToSongCard: (s: any) => Song,
  hasSuspiciousData: (s: Song) => boolean
) {
  // Sync catalog songs with local state
  useEffect(() => {
    const converted = state.catalogSongs.map(convertToSongCard);
    
    let filtered = converted;
    if (state.selectedCorpusFilter !== 'all') {
      if (state.selectedCorpusFilter === 'null') {
        filtered = filtered.filter(s => !s.corpus_id);
      } else {
        filtered = filtered.filter(s => s.corpus_id === state.selectedCorpusFilter);
      }
    }
    
    let displayedSongs = state.statusFilter === 'all' 
      ? filtered 
      : filtered.filter(s => s.status === state.statusFilter);
    
    if (state.showSuspiciousOnly) {
      displayedSongs = displayedSongs.filter(hasSuspiciousData);
    }
    
    state.setAllSongs(converted);
    state.setSongs(displayedSongs);
    state.setSongsWithoutYouTube(filtered.filter(s => !s.youtube_url));
  }, [
    state.catalogSongs, 
    state.statusFilter, 
    state.selectedCorpusFilter, 
    state.showSuspiciousOnly, 
    convertToSongCard,
    hasSuspiciousData
  ]);

  // Filtered songs by search
  const filteredSongs = useMemo(() => {
    return state.songs.filter(song => {
      if (!state.debouncedSearchQuery) return true;
      const query = state.debouncedSearchQuery.toLowerCase();
      return (
        song.title?.toLowerCase().includes(query) ||
        song.artists?.name?.toLowerCase().includes(query) ||
        song.composer?.toLowerCase().includes(query)
      );
    });
  }, [state.songs, state.debouncedSearchQuery]);

  // Filtered artists
  const filteredArtists = useMemo(() => {
    let filtered = state.artistsWithStats;
    
    if (state.selectedCorpusFilter !== 'all') {
      if (state.selectedCorpusFilter === 'null') {
        filtered = filtered.filter(artist => !artist.corpus_id);
      } else {
        filtered = filtered.filter(artist => artist.corpus_id === state.selectedCorpusFilter);
      }
    }
    
    if (state.selectedLetter !== 'all') {
      filtered = filtered.filter(artist => 
        artist.name.charAt(0).toUpperCase() === state.selectedLetter
      );
    }
    
    if (state.debouncedSearchQuery) {
      filtered = filtered.filter(artist =>
        artist.name.toLowerCase().includes(state.debouncedSearchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [state.artistsWithStats, state.selectedLetter, state.debouncedSearchQuery, state.selectedCorpusFilter]);

  // Paginated artists
  const paginatedArtists = useMemo(() => {
    const startIndex = (state.currentArtistPage - 1) * state.ARTISTS_PER_PAGE;
    const endIndex = startIndex + state.ARTISTS_PER_PAGE;
    return filteredArtists.slice(startIndex, endIndex);
  }, [filteredArtists, state.currentArtistPage, state.ARTISTS_PER_PAGE]);

  const totalArtistPages = Math.ceil(filteredArtists.length / state.ARTISTS_PER_PAGE);

  // Fetch pending count for letter
  useEffect(() => {
    if (state.selectedLetter === 'all' || filteredArtists.length === 0) {
      state.setPendingCountForLetter(0);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const artistIds = filteredArtists.map(a => a.id);
        
        const { count, error } = await supabase
          .from('songs')
          .select('id', { count: 'exact', head: true })
          .in('artist_id', artistIds)
          .eq('status', 'pending');

        if (error) throw error;
        state.setPendingCountForLetter(count || 0);
      } catch {
        state.setPendingCountForLetter(0);
      }
    };

    fetchPendingCount();
  }, [state.selectedLetter, filteredArtists]);

  return {
    filteredSongs,
    filteredArtists,
    paginatedArtists,
    totalArtistPages,
  };
}
