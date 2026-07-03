import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-card">
      <div className="hidden sm:block text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
        <span className="font-medium text-foreground">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{' '}
        of <span className="font-medium text-foreground">{totalItems}</span> entries
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground sm:hidden">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
