/**
 * Alerts do MusicCatalog com integração ao sistema de jobs persistentes
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Filter, RefreshCw, Sparkles, Youtube, Loader2 } from 'lucide-react';
import { useEnrichmentJob } from '@/hooks/useEnrichmentJob';
import { EnrichmentJobCard } from '@/components/music/EnrichmentJobCard';

interface MusicCatalogAlertsProps {
  // Active filters alert
  statusFilter: string;
  selectedCorpusFilter: string;
  showSuspiciousOnly: boolean;
  corpora: Array<{ id: string; name: string; color: string | null }>;
  onClearFilters: () => void;
  
  // Pending enrichment alert
  pendingSongs: number;
  onBatchEnrich: () => void;
  
  // YouTube alert
  songsWithoutYouTube: number;
  onBatchEnrichYouTube: () => void;
}

export function MusicCatalogAlerts({
  statusFilter,
  selectedCorpusFilter,
  showSuspiciousOnly,
  corpora,
  onClearFilters,
  pendingSongs,
  onBatchEnrich,
  songsWithoutYouTube,
  onBatchEnrichYouTube,
}: MusicCatalogAlertsProps) {
  const hasActiveFilters = statusFilter !== 'all' || selectedCorpusFilter !== 'all' || showSuspiciousOnly;
  
  // Hooks para jobs de enriquecimento persistentes
  const metadataJob = useEnrichmentJob({ jobType: 'metadata' });
  const youtubeJob = useEnrichmentJob({ jobType: 'youtube' });

  const handleStartMetadataJob = async () => {
    await metadataJob.startJob({ scope: 'all', jobType: 'metadata' });
  };

  const handleStartYouTubeJob = async () => {
    await youtubeJob.startJob({ scope: 'all', jobType: 'youtube' });
  };

  return (
    <div className="space-y-4">
      {/* Active Filters Alert */}
      {hasActiveFilters && (
        <Alert className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <Filter className="h-4 w-4 text-blue-500" />
          <AlertTitle>Filtros Ativos</AlertTitle>
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-sm">
                As visualizações estão filtradas.
                {statusFilter !== 'all' && <strong> Status: {statusFilter}</strong>}
                {selectedCorpusFilter !== 'all' && (
                  <strong> Corpus: {selectedCorpusFilter === 'null' ? 'Sem classificação' : corpora.find(c => c.id === selectedCorpusFilter)?.name}</strong>
                )}
                {showSuspiciousOnly && <strong> Dados Suspeitos: Apenas problemáticos</strong>}
              </span>
              <Button variant="outline" size="sm" onClick={onClearFilters} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Job de Metadados Ativo */}
      {metadataJob.activeJob && (
        <EnrichmentJobCard
          jobType="metadata"
          compact={true}
        />
      )}

      {/* Job de YouTube Ativo */}
      {youtubeJob.activeJob && (
        <EnrichmentJobCard
          jobType="youtube"
          compact={true}
        />
      )}

      {/* Pending Enrichment Alert - só mostra se não há job ativo */}
      {pendingSongs > 0 && !metadataJob.activeJob && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle>Músicas Aguardando Enriquecimento</AlertTitle>
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span>
                {pendingSongs} música{pendingSongs > 1 ? 's' : ''} precisa{pendingSongs > 1 ? 'm' : ''} ser enriquecida{pendingSongs > 1 ? 's' : ''}.
              </span>
              <Button 
                size="sm" 
                onClick={handleStartMetadataJob} 
                disabled={metadataJob.isLoading}
                className="w-full sm:w-auto"
              >
                {metadataJob.isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Iniciar Job de Metadados ({pendingSongs})
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* YouTube Enrichment Alert - só mostra se não há job ativo */}
      {songsWithoutYouTube > 0 && !youtubeJob.activeJob && (
        <Alert className="border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
          <Youtube className="h-4 w-4 text-red-500" />
          <AlertTitle>Músicas sem Link do YouTube</AlertTitle>
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span>
                {songsWithoutYouTube} música{songsWithoutYouTube > 1 ? 's' : ''} sem link do YouTube.
                <span className="text-xs block mt-1 text-muted-foreground">⚠️ Limite diário: 10.000 consultas</span>
              </span>
              <Button 
                size="sm" 
                onClick={handleStartYouTubeJob}
                disabled={youtubeJob.isLoading}
                variant="outline"
                className="w-full sm:w-auto border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                {youtubeJob.isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Youtube className="h-4 w-4 mr-2" />
                )}
                Iniciar Job YouTube ({songsWithoutYouTube})
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
