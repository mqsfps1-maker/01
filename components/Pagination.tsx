
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalItems === 0 || totalPages <= 1) return null;

    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    return (
        <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)] mt-4 px-1 flex-wrap gap-4">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-text-primary)]">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                </span>
                <span>-</span>
                 <span className="font-semibold text-[var(--color-text-primary)]">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>
                <span>de</span> 
                <span className="font-semibold text-[var(--color-text-primary)]">{totalItems}</span>
                <span className="hidden sm:inline">resultados</span>
            </div>
             <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrev}
                    className="flex items-center gap-1 px-2 py-1.5 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="font-semibold text-[var(--color-text-primary)] px-2">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    className="flex items-center gap-1 px-2 py-1.5 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;