import { useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Search } from 'lucide-react';
import { ColumnDef } from './DataTable';

interface VirtualizedSongTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
}

export function VirtualizedSongTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Buscar...',
  onRowClick,
  getRowId = (row) => row.id,
}: VirtualizedSongTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.key];
        return value?.toString().toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Altura estimada de cada linha
    overscan: 10, // Renderizar 10 itens extra acima/abaixo do viewport
  });

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results counter */}
      <p className="text-sm text-muted-foreground">
        {sortedData.length === data.length 
          ? `${sortedData.length.toLocaleString()} músicas` 
          : `${sortedData.length.toLocaleString()} de ${data.length.toLocaleString()} músicas`}
      </p>

      {/* Virtual Table */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="border-b bg-muted/50">
          <div className="flex items-center h-12 px-4">
            {columns.map(col => (
              <div 
                key={col.key} 
                className="flex-1 min-w-[100px] font-medium text-sm"
                style={{ flex: col.key === 'select' ? '0 0 50px' : col.key === 'actions' ? '0 0 150px' : undefined }}
              >
                {col.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(col.key)}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    {col.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  col.label
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Virtualized Body */}
        <div
          ref={parentRef}
          className="h-[600px] overflow-auto"
          style={{
            contain: 'strict',
          }}
        >
          {sortedData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = sortedData[virtualRow.index];
                return (
                  <div
                    key={getRowId(row)}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    onClick={() => onRowClick?.(row)}
                    className={`flex items-center px-4 border-b absolute top-0 left-0 w-full ${
                      onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                    }`}
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      height: `${virtualRow.size}px`,
                    }}
                  >
                    {columns.map(col => (
                      <div 
                        key={col.key} 
                        className="flex-1 min-w-[100px] text-sm"
                        style={{ flex: col.key === 'select' ? '0 0 50px' : col.key === 'actions' ? '0 0 150px' : undefined }}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
