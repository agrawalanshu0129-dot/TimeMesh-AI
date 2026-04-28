import { useState, useCallback } from 'react';

/**
 * A generic hook that mirrors useState but persists the value to
 * localStorage automatically. On first render it reads any existing
 * value from storage; if none is found (or if parsing fails) it falls
 * back to `initialValue`.
 *
 * The setter accepts both a direct value and a functional updater,
 * mirroring the normal useState API.
 *
 * @example
 * // Persist a simple counter across page refreshes
 * const [count, setCount] = useLocalStorage('my_counter', 0);
 *
 * // Persist an object
 * const [user, setUser] = useLocalStorage<User | null>('current_user', null);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      console.warn(`[useLocalStorage] Failed to read key "${key}" – using initial value.`);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (err) {
          if (err instanceof DOMException && err.name === 'QuotaExceededError') {
            console.warn(`[useLocalStorage] Quota exceeded for key "${key}" – value not persisted.`);
          } else {
            console.warn(`[useLocalStorage] Failed to write key "${key}":`, err);
          }
        }
        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
