/**
 * Filtros do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder, AlertTriangle } from 'lucide-react';

interface MusicCatalogFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedCorpusFilter: string;
  onCorpusFilterChange: (corpus: string) => void;
  showSuspiciousOnly: boolean;
  onShowSuspiciousChange: (show: boolean) => void;
  corpora: Array<{ id: string; name: string; color: string | null; normalized_name?: string }>;
}

export function MusicCatalogFilters({
  statusFilter,
  onStatusFilterChange,
  selectedCorpusFilter,
  onCorpusFilterChange,
  showSuspiciousOnly,
  onShowSuspiciousChange,
  corpora,
}: MusicCatalogFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filtrar por status:</span>
        <div className="flex gap-2">
          {['all', 'pending', 'enriched', 'processed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilterChange(status)}
            >
              {status === 'all' ? 'Todas' : 
               status === 'pending' ? 'Pendentes' : 
               status === 'enriched' ? 'Enriquecidas' : 'Processadas'}
            </Button>
          ))}
        </div>
      </div>

      {/* Suspicious data filter */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-sm font-medium">Dados Suspeitos:</span>
        <Button
          variant={showSuspiciousOnly ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onShowSuspiciousChange(!showSuspiciousOnly)}
        >
          {showSuspiciousOnly ? 'Mostrando Suspeitos' : 'Mostrar Suspeitos'}
        </Button>
      </div>

      {/* Corpus filter */}
      <div className="flex items-center gap-2">
        <Folder className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtrar por corpus:</span>
        <Select value={selectedCorpusFilter} onValueChange={onCorpusFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por corpus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Corpus</SelectItem>
            {corpora.map((corpus) => (
              <SelectItem key={corpus.id} value={corpus.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: corpus.color || undefined }}
                  />
                  <span>{corpus.name}</span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="null">Sem classificação</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
