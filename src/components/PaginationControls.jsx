import React, { memo } from 'react';
import { usePagination } from '../hooks/usePagination';

/**
 * PaginationControls Component
 * Handles pagination UI and navigation
 * Memoized to prevent unnecessary re-renders
 */
const PaginationControls = memo(({
  currentPage,
  totalPages,
  itemsPerPage,
  totalStudents,
  onPageChange,
  onItemsPerPageChange,
  position = 'top',
}) => {
  const { paginationInfo, pageNumbers, canGoPrev, canGoNext } = usePagination(
    currentPage,
    totalPages,
    itemsPerPage,
    totalStudents
  );

  return (
    <div className={`pagination-controls ${position}`}>
      <div className="pagination-info">
        Showing {paginationInfo.showing} students
      </div>
      <div className="pagination-actions">
        {position === 'top' && (
          <select
            value={itemsPerPage}
            onChange={onItemsPerPageChange}
            className="page-size-select"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        )}

        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          className="pagination-btn first"
          title="First Page"
        >
          ⏮ First
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className="pagination-btn prev"
          title="Previous Page"
        >
          ◀ Prev
        </button>

        {position === 'bottom' ? (
          <div className="page-numbers-list">
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`pagination-btn page-number ${
                  currentPage === page ? "active" : ""
                }`}
                title={`Page ${page}`}
              >
                {page}
              </button>
            ))}
          </div>
        ) : (
          <span className="page-numbers">
            Page {currentPage} of {totalPages}
          </span>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="pagination-btn next"
          title="Next Page"
        >
          Next ▶
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="pagination-btn last"
          title="Last Page"
        >
          Last ⏭
        </button>
      </div>
    </div>
  );
});

PaginationControls.displayName = 'PaginationControls';

export default PaginationControls;

