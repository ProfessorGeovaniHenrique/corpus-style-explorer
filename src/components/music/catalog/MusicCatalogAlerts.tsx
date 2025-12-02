/**
 * Alerts do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Filter, RefreshCw, Sparkles, Youtube } from 'lucide-react';

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

      {/* Pending Enrichment Alert */}
      {pendingSongs > 0 && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle>Músicas Aguardando Enriquecimento</AlertTitle>
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span>
                {pendingSongs} música{pendingSongs > 1 ? 's' : ''} precisa{pendingSongs > 1 ? 'm' : ''} ser enriquecida{pendingSongs > 1 ? 's' : ''}.
              </span>
              <Button size="sm" onClick={onBatchEnrich} className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" />
                Enriquecer Metadados ({pendingSongs})
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* YouTube Enrichment Alert */}
      {songsWithoutYouTube > 0 && (
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
                onClick={onBatchEnrichYouTube}
                variant="outline"
                className="w-full sm:w-auto border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Youtube className="h-4 w-4 mr-2" />
                Enriquecer YouTube ({songsWithoutYouTube})
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
