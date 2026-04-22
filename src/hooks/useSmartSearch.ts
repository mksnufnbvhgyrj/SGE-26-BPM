import { useState, useDeferredValue, useMemo } from 'react';

export function useSmartSearch<T>(
  items: T[],
  searchFields: (keyof T)[]
) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    if (!deferredSearch.trim()) return items;
    const lower = deferredSearch.toLowerCase();
    
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return String(value).toLowerCase().includes(lower);
      })
    );
  }, [items, deferredSearch, searchFields]);

  return { search, setSearch, filtered, isPending: search !== deferredSearch };
}
