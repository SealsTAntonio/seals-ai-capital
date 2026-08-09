import { useCallback, useEffect, useState } from 'react';

import type { ResearchStatus } from '../types';

type Entry<T> = { data?: T; promise?: Promise<T>; updatedAt?: number };
const cache = new Map<string, Entry<unknown>>();
const FRESH_MS = 60_000;
async function requestCached<T>(key: string, request: () => Promise<T>, force: boolean) {
  const entry = (cache.get(key) ?? {}) as Entry<T>;
  if (entry.promise) return entry.promise;
  if (!force && entry.data !== undefined && Date.now() - (entry.updatedAt ?? 0) < FRESH_MS)
    return entry.data;
  const promise = request()
    .then((data) => {
      cache.set(key, { data, updatedAt: Date.now() });
      return data;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });
  cache.set(key, { ...entry, promise });
  return promise;
}
export function useResearchResource<T>(
  key: string | null,
  request: () => Promise<T>,
  isEmpty: (data: T) => boolean,
) {
  const cached = key ? (cache.get(key) as Entry<T> | undefined)?.data : undefined;
  const [data, setData] = useState<T | null>(cached ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<ResearchStatus>(
    key ? (cached === undefined ? 'loading' : isEmpty(cached) ? 'empty' : 'ready') : 'idle',
  );
  const run = useCallback(
    async (force = false) => {
      if (!key) {
        setData(null);
        setError(null);
        setStatus('idle');
        return;
      }
      setError(null);
      setStatus(force ? 'retrying' : 'loading');
      try {
        const next = await requestCached(key, request, force);
        setData(next);
        setStatus(isEmpty(next) ? 'empty' : 'ready');
      } catch (caught) {
        setError(caught instanceof Error ? caught : new Error('Research is unavailable.'));
        setStatus('error');
      }
    },
    [isEmpty, key, request],
  );
  useEffect(() => {
    void run();
  }, [run]);
  return {
    data,
    error,
    status,
    loading: status === 'loading',
    empty: status === 'empty',
    retrying: status === 'retrying',
    retry: () => run(true),
  };
}
