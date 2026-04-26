import { useState, useMemo } from 'react';

export const useSearchFilter = <T,>(
  items: T[],
  searchFields: (keyof T)[],
  initialSortField: keyof T,
  initialSortDir: 'asc' | 'desc' = 'asc'
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<keyof T>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDir);

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = searchTerm === '' || searchFields.some(field => {
          const value = item[field];
          return value ? String(value).toLowerCase().includes(searchTerm.toLowerCase()) : false;
        });
        
        const matchesFilters = Object.entries(filters).every(([key, val]) => {
          if (!val || val === '' || val === 'Todos' || val === 'Todas') return true;
          return (item as any)[key] === val;
        });
        
        return matchesSearch && matchesFilters;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (aVal === undefined || bVal === undefined) return 0;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [items, searchTerm, filters, sortField, sortDirection, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    sortField,
    sortDirection,
    handleSort,
    filteredAndSortedItems
  };
};
