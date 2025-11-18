import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

export function usePagination<T>({
  data,
  itemsPerPage = 100
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => 
    Math.ceil(data.length / itemsPerPage), 
    [data.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const canGoNext = useMemo(() => 
    currentPage < totalPages, 
    [currentPage, totalPages]
  );
  
  const canGoPrev = useMemo(() => 
    currentPage > 1, 
    [currentPage]
  );

  const startIndex = useMemo(() => 
    (currentPage - 1) * itemsPerPage + 1,
    [currentPage, itemsPerPage]
  );
  
  const endIndex = useMemo(() => 
    Math.min(currentPage * itemsPerPage, data.length),
    [currentPage, itemsPerPage, data.length]
  );

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems: data.length
  };
}
