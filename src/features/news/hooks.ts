import { useCallback, useEffect, useState } from 'react';

import { getNewsService } from './services/newsService';
import type { Catalyst, CompanyNewsSummary, NewsArticle, NewsQuery, NewsResponse } from './types';

type Entry<T> = { data?: NewsResponse<T>; promise?: Promise<NewsResponse<T>>; updatedAt?: number };
const cache = new Map<string, Entry<unknown>>();
const TTL = 60_000;
function request<T>(key: string, load: () => Promise<NewsResponse<T>>, force = false) {
  const old = (cache.get(key) ?? {}) as Entry<T>;
  if (old.promise) return old.promise;
  if (!force && old.data && Date.now() - (old.updatedAt ?? 0) < TTL)
    return Promise.resolve(old.data);
  const promise = load()
    .then((data) => {
      cache.set(key, { data, updatedAt: Date.now() });
      return data;
    })
    .finally(() => {
      const current = cache.get(key) as Entry<T>;
      if (current?.promise) cache.set(key, { ...current, promise: undefined });
    });
  cache.set(key, { ...old, promise });
  return promise;
}
function useResource<T>(key: string, load: () => Promise<NewsResponse<T>>) {
  const cached = (cache.get(key) as Entry<T>)?.data;
  const [data, setData] = useState(cached ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const run = useCallback(
    async (force = false) => {
      setError(null);
      if (data) setRefreshing(true);
      else setLoading(true);
      try {
        setData(await request(key, load, force));
      } catch (e) {
        setError(e instanceof Error ? e : new Error('News is unavailable.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [data, key, load],
  );
  useEffect(() => {
    void run();
  }, [run]);
  return {
    data: data?.data ?? null,
    meta: data
      ? {
          source: data.source,
          fetchedAt: data.fetchedAt,
          staleAfter: data.staleAfter,
          disclaimer: data.disclaimer,
        }
      : null,
    error,
    loading,
    refreshing,
    stale: Boolean(data && Date.parse(data.staleAfter) <= Date.now()),
    refresh: () => run(true),
    retry: () => run(true),
  };
}
const keyOf = (q?: NewsQuery) => JSON.stringify(q ?? {});
export function useNews(query?: NewsQuery) {
  const k = keyOf(query);
  const load = useCallback(() => getNewsService().getNews(JSON.parse(k) as NewsQuery), [k]);
  return useResource<NewsArticle[]>(`news:${k}`, load);
}
export function useSymbolNews(symbol: string, query?: NewsQuery) {
  const k = keyOf(query),
    s = symbol.trim().toUpperCase();
  const load = useCallback(
    () => getNewsService().getNewsForSymbol(s, JSON.parse(k) as NewsQuery),
    [k, s],
  );
  return useResource<NewsArticle[]>(`symbol-news:${s}:${k}`, load);
}
export function useMarketNews(query?: NewsQuery) {
  const k = keyOf(query);
  const load = useCallback(() => getNewsService().getMarketNews(JSON.parse(k) as NewsQuery), [k]);
  return useResource<NewsArticle[]>(`market-news:${k}`, load);
}
export function useCatalysts(query?: NewsQuery) {
  const k = keyOf(query);
  const load = useCallback(() => getNewsService().getCatalysts(JSON.parse(k) as NewsQuery), [k]);
  return useResource<Catalyst[]>(`catalysts:${k}`, load);
}
export function useSymbolCatalysts(symbol: string, query?: NewsQuery) {
  const k = keyOf(query),
    s = symbol.trim().toUpperCase();
  const load = useCallback(
    () => getNewsService().getCatalystsForSymbol(s, JSON.parse(k) as NewsQuery),
    [k, s],
  );
  return useResource<Catalyst[]>(`symbol-catalysts:${s}:${k}`, load);
}
export function useCompanyNewsSummary(symbol: string) {
  const s = symbol.trim().toUpperCase();
  const load = useCallback(() => getNewsService().getCompanyNewsSummary(s), [s]);
  return useResource<CompanyNewsSummary>(`news-summary:${s}`, load);
}
