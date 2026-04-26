import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableTableHeaderProps {
  label: string;
  field: string;
  currentSortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export const SortableTableHeader = ({ label, field, currentSortField, sortDirection, onSort, className = '' }: SortableTableHeaderProps) => {
  return (
    <th 
      className={`px-4 py-3 text-left font-semibold cursor-pointer select-none group border-b border-slate-200 ${className}`} 
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
        {label}
        {currentSortField === field ? (
          sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 text-blue-600" /> : <ArrowDown className="w-4 h-4 text-blue-600" />
        ) : (
          <ArrowUpDown className="w-4 h-4 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
        )}
      </div>
    </th>
  );
};
