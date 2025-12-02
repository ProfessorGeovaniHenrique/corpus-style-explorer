/**
 * Tab de Validação do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { EnrichmentValidationPanel } from '@/components/EnrichmentValidationPanel';

export function TabValidation() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Validação do Pipeline de Enrichment</h2>
          <p className="text-muted-foreground">
            Teste a persistência de dados e atualização da UI para Biography, YouTube e Metadata
          </p>
        </div>
        
        <EnrichmentValidationPanel />
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Esta aba é temporária para validação do MVP.
          </p>
        </div>
      </div>
    </div>
  );
}
