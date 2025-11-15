/**
 * Custom hook for pagination logic
 * Handles page calculations and navigation
 */
import { useMemo } from 'react';

export const usePagination = (currentPage, totalPages, itemsPerPage, totalItems) => {
  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    
    return {
      startIndex,
      endIndex,
      showing: `${startIndex} to ${endIndex} of ${totalItems}`,
    };
  }, [currentPage, itemsPerPage, totalItems]);

  // Generate page numbers for pagination controls
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  // Check if navigation is possible
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return {
    paginationInfo,
    pageNumbers,
    canGoPrev,
    canGoNext,
  };
};

