// ============================================================
// Hook de localStorage (fallback para datos no críticos)
// ============================================================

import { useCallback, useState } from 'react';

/**
 * Hook genérico que sincroniza estado con localStorage.
 * Similar a useState pero con persistencia.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Función de lectura inicial (perezosa)
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Guardar con autoreferencia a la función de escritura
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? (value as (p: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignorar errores de cuota o privacidad
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}