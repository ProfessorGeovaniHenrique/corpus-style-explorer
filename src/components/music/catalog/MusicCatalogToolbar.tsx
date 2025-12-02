/**
 * Toolbar do MusicCatalog
 * Sprint F2.1 - Refatoração
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdvancedExportMenu } from '@/components/music';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LayoutGrid, LayoutList, Search, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ViewMode } from '@/hooks/music-catalog';

interface MusicCatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRefresh: () => void;
  onClearCatalog: () => void;
  isClearingCatalog: boolean;
  totalSongs: number;
  totalArtists: number;
}

export function MusicCatalogToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  onClearCatalog,
  isClearingCatalog,
  totalSongs,
  totalArtists,
}: MusicCatalogToolbarProps) {
  const { toast } = useToast();

  return (
    <div className="border-b bg-muted/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar músicas, artistas, compositores..."
                className="pl-9 h-9 bg-background/50"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 gap-2" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background/50">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onViewModeChange('table')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onViewModeChange('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <AdvancedExportMenu 
              onExport={(format) => {
                toast({
                  title: "Exportação iniciada",
                  description: `Preparando arquivo ${format.toUpperCase()} para download.`,
                });
              }}
            />

            {/* Clear Catalog Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 text-destructive hover:text-destructive"
                  disabled={isClearingCatalog}
                >
                  {isClearingCatalog ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Limpar Catálogo</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá excluir permanentemente <strong>todas as {totalSongs} músicas</strong>, 
                    <strong> todos os {totalArtists} artistas</strong> e seus uploads.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onClearCatalog}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
