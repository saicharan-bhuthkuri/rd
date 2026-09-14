import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  itemName = 'records'
}) => {
  // If there are no records, do not show pagination controls
  if (totalRecords === 0) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalRecords);
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Generate page numbers with smart ellipsis windowing
  const getPageNumbers = (): (number | string)[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', safeTotalPages];
    }

    if (currentPage >= safeTotalPages - 3) {
      return [1, '...', safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', safeTotalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="admin-pagination-container">
      <div className="admin-pagination-info">
        Showing <strong>{startRecord}</strong> - <strong>{endRecord}</strong> of <strong>{totalRecords}</strong> {itemName}
      </div>

      <div className="admin-pagination-controls">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="admin-pagination-btn admin-pagination-nav-btn"
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="admin-pagination-pages">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="admin-pagination-ellipsis">
                  …
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`admin-pagination-btn admin-pagination-page-btn ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          className="admin-pagination-btn admin-pagination-nav-btn"
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
