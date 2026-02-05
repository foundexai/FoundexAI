"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Helper to determine which pages to show
  const getVisiblePages = () => {
    if (totalPages <= 7) return pages;

    if (currentPage <= 4) {
      return [...pages.slice(0, 5), "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", ...pages.slice(totalPages - 5)];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md shadow-sm hover:bg-white hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 group"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
      </button>

      <div className="flex items-center gap-1 bg-white/30 backdrop-blur-sm border border-white/40 p-1.5 rounded-2xl dark:bg-white/5 dark:border-white/5">
        {visiblePages.map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`dots-${idx}`}
                className="px-3 py-2 text-gray-400 font-medium"
              >
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageChange(Number(page))}
              className={`
                min-w-[44px] h-[44px] flex items-center justify-center rounded-xl text-sm font-bold transition-all
                ${
                  isCurrent
                    ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-105"
                    : "text-gray-600 hover:bg-white/80 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                }
              `}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md shadow-sm hover:bg-white hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 group"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
      </button>
    </div>
  );
}
