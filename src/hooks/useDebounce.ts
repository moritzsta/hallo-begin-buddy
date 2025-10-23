import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a value
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default: 600ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 600): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timeout to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
