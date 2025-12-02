/**
 * Tab de Músicas do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { EnrichedDataTable, SongCard } from '@/components/music';
import { Song } from '@/components/music/SongCard';
import type { ViewMode } from '@/hooks/music-catalog';

interface TabSongsProps {
  songs: Song[];
  loading: boolean;
  viewMode: ViewMode;
  searchQuery: string;
  enrichingIds: Set<string>;
  onEnrich: (songId: string) => void;
  onEdit: (song: any) => void;
  onReEnrich: (songId: string) => void;
  onMarkReviewed: (songId: string) => void;
  onDelete: (songId: string) => void;
}

export function TabSongs({
  songs,
  loading,
  viewMode,
  searchQuery,
  enrichingIds,
  onEnrich,
  onEdit,
  onReEnrich,
  onMarkReviewed,
  onDelete,
}: TabSongsProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando músicas...</p>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery 
            ? "Nenhuma música encontrada com esses filtros."
            : "Nenhuma música enriquecida ainda. Comece fazendo upload!"
          }
        </p>
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <EnrichedDataTable 
        songs={songs.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artists?.name || 'Desconhecido',
          composer: s.composer,
          year: s.release_year,
          genre: s.artists?.genre,
          confidence: s.confidence_score || 0,
          status: s.status || 'pending'
        }))}
        onExport={() => {}}
        onEnrich={onEnrich}
        enrichingIds={enrichingIds}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {songs.map((song) => (
        <SongCard 
          key={song.id}
          song={{
            id: song.id,
            title: song.title,
            artist: song.artists?.name || 'Desconhecido',
            album: song.raw_data?.album,
            year: song.release_year,
            genre: song.artists?.genre,
            confidence: song.confidence_score || 0,
            status: song.status || 'pending',
            corpusName: song.corpora?.name,
            corpusColor: song.corpora?.color,
            youtubeUrl: song.youtube_url
          }}
          onEdit={(s) => onEdit(s.id)}
          onEnrich={onEnrich}
          onReEnrich={onReEnrich}
          onMarkReviewed={onMarkReviewed}
          onDelete={onDelete}
          isEnriching={enrichingIds.has(song.id)}
        />
      ))}
    </div>
  );
}
