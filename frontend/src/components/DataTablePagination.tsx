import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DataTablePaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({ pagination, onPageChange }: DataTablePaginationProps) {
  const { total, page, limit, totalPages } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="p-4 border-t border-[#E8ECF1] flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-gray-500">
        Showing {start} to {end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  pageNum === page
                    ? 'bg-[#5B5FEF] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
