import { useState, useEffect, useRef, useCallback } from 'react';

export function useSafeState<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (mounted.current) setState(value);
  }, []);

  return [state, safeSetState] as const;
}
