"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const serialized = JSON.stringify(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timer);
    // Serialize so object identity changes don't thrash debounce timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, delayMs]);

  return debouncedValue;
}
