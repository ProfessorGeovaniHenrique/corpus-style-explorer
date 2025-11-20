import { useState, useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VerbeteList } from './VerbeteList';
import { VerbeteEditor } from './VerbeteEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { DictionaryEntry, ValidationStatus } from '@/hooks/useDictionaryValidation';

interface ValidationWorkspaceProps {
  entries: DictionaryEntry[];
  isLoading?: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
  onSave: (id: string, data: Partial<DictionaryEntry>) => Promise<void>;
  onRefetch?: () => void;
  entryTypeFilter?: 'all' | 'word' | 'mwe';
  onEntryTypeFilterChange?: (value: 'all' | 'word' | 'mwe') => void;
}

export function ValidationWorkspace({
  entries,
  isLoading = false,
  onApprove,
  onReject,
  onSave,
  onRefetch,
  entryTypeFilter = 'all',
  onEntryTypeFilterChange,
}: ValidationWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ValidationStatus>('pending');

  const filteredEntries = entries.filter(e => e.validation_status === statusFilter);
  const selectedEntry = entries.find(e => e.id === selectedId);

  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.validation_status === 'pending').length,
    approved: entries.filter(e => e.validation_status === 'approved').length,
    rejected: entries.filter(e => e.validation_status === 'rejected').length,
    corrected: entries.filter(e => e.validation_status === 'corrected').length,
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = filteredEntries.findIndex(e => e.id === selectedId);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' 
      ? (currentIndex + 1) % filteredEntries.length
      : (currentIndex - 1 + filteredEntries.length) % filteredEntries.length;

    setSelectedId(filteredEntries[nextIndex]?.id || null);
  };

  const handleApproveAndNext = async (id: string) => {
    await onApprove(id);
    handleNavigate('next');
    onRefetch?.();
  };

  const handleRejectAndNext = async (id: string, notes?: string) => {
    await onReject(id, notes);
    handleNavigate('next');
    onRefetch?.();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow Up/Down navigation
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNavigate('prev');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNavigate('next');
      }

      // Ctrl+Enter to approve
      if (e.ctrlKey && e.key === 'Enter' && selectedId) {
        e.preventDefault();
        handleApproveAndNext(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, filteredEntries]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      {onEntryTypeFilterChange && (
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <label className="text-sm font-medium">Tipo de Entrada:</label>
          <Select value={entryTypeFilter} onValueChange={onEntryTypeFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="word">Palavras</SelectItem>
              <SelectItem value="mwe">Expressões (MWE)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-16rem)] w-full rounded-lg border">
        {/* Left Panel - List */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <VerbeteList
            entries={filteredEntries}
            selectedId={selectedId}
            statusFilter={statusFilter}
            onSelect={setSelectedId}
            onFilterChange={setStatusFilter}
            stats={stats}
            isLoading={isLoading}
          />
        </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel - Editor */}
      <ResizablePanel defaultSize={70}>
        <div className="h-full overflow-y-auto">
          {!selectedEntry ? (
            <div className="flex h-full items-center justify-center p-8">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Estatísticas de Validação
                  </CardTitle>
                  <CardDescription>
                    Selecione um verbete na lista para começar a validação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendentes:</span>
                    <span className="font-semibold text-yellow-600">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aprovados:</span>
                    <span className="font-semibold text-green-600">{stats.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Corrigidos:</span>
                    <span className="font-semibold text-blue-600">{stats.corrected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rejeitados:</span>
                    <span className="font-semibold text-red-600">{stats.rejected}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <VerbeteEditor
              entry={selectedEntry}
              onApprove={handleApproveAndNext}
              onReject={handleRejectAndNext}
              onSave={onSave}
              onNavigate={handleNavigate}
              canNavigate={{
                prev: filteredEntries.length > 0,
                next: filteredEntries.length > 0,
              }}
            />
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    </div>
  );
}
