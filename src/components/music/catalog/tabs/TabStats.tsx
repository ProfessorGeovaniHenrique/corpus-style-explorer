/**
 * Tab de Estatísticas do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { StatsCard } from '@/components/music';

interface TabStatsProps {
  totalSongs: number;
  totalArtists: number;
  avgConfidence: number;
}

export function TabStats({ totalSongs, totalArtists, avgConfidence }: TabStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard 
        title="Total de Músicas"
        value={totalSongs}
        subtitle="no catálogo"
      />
      <StatsCard 
        title="Total de Artistas"
        value={totalArtists}
        subtitle="artistas únicos"
      />
      <StatsCard 
        title="Confiança Média"
        value={`${avgConfidence.toFixed(1)}/100`}
        subtitle="score de qualidade"
      />
    </div>
  );
}
