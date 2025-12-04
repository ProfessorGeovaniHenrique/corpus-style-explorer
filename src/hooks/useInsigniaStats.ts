import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InsigniaDistribution {
  insignia: string;
  count: number;
  percentage: number;
}

export interface InsigniaStats {
  totalWithInsignias: number;
  totalWithoutInsignias: number;
  distribution: InsigniaDistribution[];
  incorrectCount: number;
  validatedCount: number;
  pendingValidation: number;
  byCorpus: {
    gaucho: { with: number; without: number };
    nordestino: { with: number; without: number };
    sertanejo: { with: number; without: number };
  };
}

export function useInsigniaStats() {
  return useQuery({
    queryKey: ['insignia-stats'],
    queryFn: async (): Promise<InsigniaStats> => {
      // Get all cache entries with insignia info
      const { data: cacheData, error: cacheError } = await supabase
        .from('semantic_disambiguation_cache')
        .select('id, palavra, insignias_culturais, fonte, song_id, artist_id');

      if (cacheError) throw cacheError;

      const entries = cacheData || [];
      
      // Calculate basic stats
      const withInsignias = entries.filter(e => 
        e.insignias_culturais && Array.isArray(e.insignias_culturais) && e.insignias_culturais.length > 0
      );
      const withoutInsignias = entries.filter(e => 
        !e.insignias_culturais || !Array.isArray(e.insignias_culturais) || e.insignias_culturais.length === 0
      );

      // Calculate distribution
      const insigniaCounts: Record<string, number> = {};
      withInsignias.forEach(entry => {
        (entry.insignias_culturais as string[]).forEach(insignia => {
          insigniaCounts[insignia] = (insigniaCounts[insignia] || 0) + 1;
        });
      });

      const distribution: InsigniaDistribution[] = Object.entries(insigniaCounts)
        .map(([insignia, count]) => ({
          insignia,
          count,
          percentage: (count / withInsignias.length) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      // Validated vs pending
      const validatedCount = entries.filter(e => e.fonte === 'manual').length;
      const pendingValidation = entries.length - validatedCount;

      // Get corpus breakdown (simplified - would need joins for full accuracy)
      const byCorpus = {
        gaucho: { with: 0, without: 0 },
        nordestino: { with: 0, without: 0 },
        sertanejo: { with: 0, without: 0 },
      };

      // Note: For accurate corpus breakdown, we'd need to join with songs/artists tables
      // This is a placeholder that can be enhanced later

      return {
        totalWithInsignias: withInsignias.length,
        totalWithoutInsignias: withoutInsignias.length,
        distribution,
        incorrectCount: 0, // Will be populated by detect_conflicts
        validatedCount,
        pendingValidation,
        byCorpus,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useInsigniaConflicts() {
  return useQuery({
    queryKey: ['insignia-conflicts'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('analyze-insignias', {
        body: { mode: 'detect_conflicts' },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    enabled: false, // Only run when manually triggered
  });
}
