import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DictionaryEntry, ValidationStatus } from '@/hooks/useDictionaryValidation';

interface VerbeteListProps {
  entries: DictionaryEntry[];
  selectedId: string | null;
  statusFilter: ValidationStatus;
  onSelect: (id: string) => void;
  onFilterChange: (status: ValidationStatus) => void;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    corrected: number;
  };
  isLoading?: boolean;
}

const statusColors: Record<ValidationStatus, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  corrected: 'bg-blue-500',
  rejected: 'bg-red-500',
};

const statusLabels: Record<ValidationStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  corrected: 'Corrigido',
  rejected: 'Rejeitado',
};

export function VerbeteList({
  entries,
  selectedId,
  statusFilter,
  onSelect,
  onFilterChange,
  stats,
  isLoading = false,
}: VerbeteListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter(entry =>
    entry.verbete.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.verbete_normalizado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header with filters */}
      <div className="border-b p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar verbete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('pending')}
            className="h-7 text-xs"
          >
            Pendentes ({stats.pending})
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('approved')}
            className="h-7 text-xs"
          >
            Aprovados ({stats.approved})
          </Button>
          <Button
            variant={statusFilter === 'corrected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('corrected')}
            className="h-7 text-xs"
          >
            Corrigidos ({stats.corrected})
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('rejected')}
            className="h-7 text-xs"
          >
            Rejeitados ({stats.rejected})
          </Button>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum verbete encontrado
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.id)}
                className={cn(
                  'w-full text-left p-3 rounded-md transition-colors',
                  'hover:bg-accent/50',
                  selectedId === entry.id && 'bg-accent border border-border'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{entry.verbete}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {entry.classe_gramatical || 'Sem classe'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        statusColors[entry.validation_status]
                      )}
                      title={statusLabels[entry.validation_status]}
                    />
                    <span className="text-xs text-muted-foreground">
                      #{entry.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with count */}
      <div className="border-t p-2 text-center text-xs text-muted-foreground">
        {filteredEntries.length} de {stats.total} verbetes
      </div>
    </div>
  );
}
