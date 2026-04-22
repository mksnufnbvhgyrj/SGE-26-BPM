import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

const prefetchCache = new Set<string>();

export function usePrefetch() {
  const prefetchMembers = useCallback(() => {
    if (prefetchCache.has('members')) return;
    prefetchCache.add('members');
    
    // Só prefetch se o navegador estiver ocioso
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        void supabase.from('membros').select('*').limit(50);
      });
    }
  }, []);

  const prefetchAudiencias = useCallback(() => {
    if (prefetchCache.has('audiencias')) return;
    prefetchCache.add('audiencias');
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        void supabase.from('audiencias').select('*').limit(20);
      });
    }
  }, []);

  return { prefetchMembers, prefetchAudiencias };
}
