/**
 * 🎵 USE CORPUS ARTISTS HOOK
 * 
 * Hook para carregar lista de artistas por tipo de corpus
 * com cache via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { getArtistsByCorpusType, AnalysisCorpusType } from '@/services/analysisCorpusService';

export interface Artist {
  id: string;
  name: string;
  songCount: number;
}

interface UseCorpusArtistsResult {
  artists: Artist[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook para carregar artistas de um corpus específico
 * 
 * @param corpusType - Tipo do corpus (gaucho, nordestino, sertanejo)
 * @returns Lista de artistas, estado de loading e erro
 */
export function useCorpusArtists(
  corpusType: AnalysisCorpusType | null | undefined
): UseCorpusArtistsResult {
  const { 
    data: artists = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['corpus-artists', corpusType],
    queryFn: () => corpusType ? getArtistsByCorpusType(corpusType) : Promise.resolve([]),
    enabled: !!corpusType,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 30 * 60 * 1000,   // 30 minutos no garbage collector
  });

  return {
    artists,
    isLoading,
    error: error as Error | null,
    refetch
  };
}
