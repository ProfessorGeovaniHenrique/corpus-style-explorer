import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPrevPage,
  onNextPage,
  onFirstPage,
  onLastPage,
  canGoPrev,
  canGoNext
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <div className="text-sm text-muted-foreground">
        Mostrando <span className="font-semibold">{startIndex}</span> a{' '}
        <span className="font-semibold">{endIndex}</span> de{' '}
        <span className="font-semibold">{totalItems}</span> resultados
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFirstPage}
          disabled={!canGoPrev}
          title="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!canGoPrev}
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <div className="flex items-center gap-1 px-3">
          <span className="text-sm font-medium">{currentPage}</span>
          <span className="text-sm text-muted-foreground">de</span>
          <span className="text-sm font-medium">{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoNext}
          title="Próxima página"
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onLastPage}
          disabled={!canGoNext}
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
