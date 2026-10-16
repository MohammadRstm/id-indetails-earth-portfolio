import { useEffect, useState } from 'react';

/**
 * Holds on to the previous value briefly so content can fade out before the
 * next value fades in. Returns what to show and whether it is on its way out.
 */
export function useCrossfade<T>(value: T, durationMs: number): { shown: T; leaving: boolean } {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (Object.is(value, shown)) return;
    const timer = window.setTimeout(() => setShown(value), durationMs);
    return () => window.clearTimeout(timer);
  }, [value, shown, durationMs]);

  return { shown, leaving: !Object.is(value, shown) };
}
