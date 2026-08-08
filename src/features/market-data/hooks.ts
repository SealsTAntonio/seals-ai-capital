import { useCallback, useEffect, useState } from 'react';

import { getMarketDataService } from './marketDataService';
import type { MarketQuote, MarketStatusSnapshot } from './types';

type ResourceState<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refreshing: boolean;
};
type CacheEntry<T> = { data?: T; error?: Error; promise?: Promise<T>; updatedAt?: number };
const cache = new Map<string, CacheEntry<unknown>>();
const FRESH_FOR_MS = 30_000;

function load<T>(key: string, request: () => Promise<T>, force = false): Promise<T> {
  const entry = (cache.get(key) ?? {}) as CacheEntry<T>;
  if (entry.promise) return entry.promise;
  if (!force && entry.data !== undefined && Date.now() - (entry.updatedAt ?? 0) < FRESH_FOR_MS)
    return Promise.resolve(entry.data);
  const promise = request()
    .then((data) => {
      cache.set(key, { data, updatedAt: Date.now() });
      return data;
    })
    .catch((error: unknown) => {
      const normalized = error instanceof Error ? error : new Error('Market data is unavailable.');
      cache.set(key, { error: normalized });
      throw normalized;
    });
  cache.set(key, { ...entry, promise });
  return promise;
}

function useMarketResource<T>(
  key: string | null,
  request: () => Promise<T>,
): ResourceState<T> & { refresh: () => Promise<void> } {
  const cached = key ? (cache.get(key) as CacheEntry<T> | undefined) : undefined;
  const [state, setState] = useState<ResourceState<T>>({
    data: cached?.data ?? null,
    error: cached?.error ?? null,
    loading: Boolean(key && cached?.data === undefined),
    refreshing: false,
  });
  const run = useCallback(
    async (force = false) => {
      if (!key) {
        setState({ data: null, error: null, loading: false, refreshing: false });
        return;
      }
      setState((current) => ({
        ...current,
        error: null,
        loading: current.data === null,
        refreshing: current.data !== null,
      }));
      try {
        const data = await load(key, request, force);
        setState({ data, error: null, loading: false, refreshing: false });
      } catch (error) {
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error : new Error('Market data is unavailable.'),
          loading: false,
          refreshing: false,
        }));
      }
    },
    [key, request],
  );
  useEffect(() => {
    void run();
  }, [run]);
  const refresh = useCallback(() => run(true), [run]);
  return { ...state, refresh };
}

export function useQuote(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  const request = useCallback(() => getMarketDataService().getQuote(normalized), [normalized]);
  return useMarketResource<MarketQuote | null>(normalized ? `quote:${normalized}` : null, request);
}

export function useQuotes(symbols: string[]) {
  const normalized = [
    ...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)),
  ].sort();
  const key = normalized.join(',');
  // Recreate the normalized list from the stable key so equivalent input arrays share a callback.
  const request = useCallback(() => getMarketDataService().getQuotes(key.split(',')), [key]);
  return useMarketResource<MarketQuote[]>(key ? `quotes:${key}` : null, request);
}

export function useMarketStatus() {
  const request = useCallback(() => getMarketDataService().getMarketStatus(), []);
  return useMarketResource<MarketStatusSnapshot>('market-status', request);
}
