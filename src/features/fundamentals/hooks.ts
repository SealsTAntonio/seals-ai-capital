import { useCallback, useEffect, useState } from 'react';

import { getFundamentalAnalysisService } from './service';
import type { FundamentalResponse, FundamentalSnapshot, FundamentalFrequency } from './types';
type Entry<T> = {
  data?: FundamentalResponse<T>;
  promise?: Promise<FundamentalResponse<T>>;
  updatedAt?: number;
};
const cache = new Map<string, Entry<unknown>>(),
  TTL = 60_000;
const request = <T>(key: string, load: () => Promise<FundamentalResponse<T>>, force = false) => {
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
};
function useResource<T>(key: string, load: () => Promise<FundamentalResponse<T>>) {
  const initial = (cache.get(key) as Entry<T>)?.data;
  const [response, setResponse] = useState(initial ?? null),
    [error, setError] = useState<Error | null>(null),
    [loading, setLoading] = useState(!initial),
    [refreshing, setRefreshing] = useState(false);
  const run = useCallback(
    async (force = false) => {
      setError(null);
      if (response) setRefreshing(true);
      else setLoading(true);
      try {
        setResponse(await request(key, load, force));
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Fundamental analysis is unavailable.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [key, load, response],
  );
  useEffect(() => {
    void run();
  }, [run]);
  return {
    data: response?.data ?? null,
    status: response?.status ?? null,
    meta: response
      ? {
          source: response.source,
          environment: response.environment,
          fetchedAt: response.fetchedAt,
          staleAfter: response.staleAfter,
        }
      : null,
    loading,
    refreshing,
    error,
    empty:
      response?.status === 'empty' || (Array.isArray(response?.data) && response.data.length === 0),
    stale: Boolean(response && Date.parse(response.staleAfter) <= Date.now()),
    refresh: () => run(true),
    retry: () => run(true),
  };
}
const symbol = (value: string) => value.trim().toUpperCase();
export function useFundamentals(value: string) {
  const s = symbol(value);
  const load = useCallback(() => getFundamentalAnalysisService().getFundamentalSummary(s), [s]);
  return useResource<FundamentalSnapshot>(`summary:${s}`, load);
}
export const useCompanyFundamentals = useFundamentals;
function useMethodResource<T>(
  value: string,
  method: string,
  loader: (symbol: string) => Promise<FundamentalResponse<T>>,
) {
  const s = symbol(value);
  const load = useCallback(() => loader(s), [loader, s]);
  return useResource(`${method}:${s}`, load);
}
const currentService = () => getFundamentalAnalysisService();
export const useIncomeStatement = (s: string) =>
  useMethodResource(s, 'income', currentService().getIncomeStatement);
export const useBalanceSheet = (s: string) =>
  useMethodResource(s, 'balance', currentService().getBalanceSheet);
export const useCashFlow = (s: string) =>
  useMethodResource(s, 'cash-flow', currentService().getCashFlow);
export const useProfitability = (s: string) =>
  useMethodResource(s, 'profitability', currentService().getProfitabilityMetrics);
export const useValuation = (s: string) =>
  useMethodResource(s, 'valuation', currentService().getValuationMetrics);
export const useFundamentalScore = (s: string) =>
  useMethodResource(s, 'score', currentService().getFundamentalScoreInputs);
export function useHistoricalFundamentals(value: string, frequency: FundamentalFrequency) {
  const s = symbol(value);
  const load = useCallback(
    () => getFundamentalAnalysisService().getHistoricalFundamentals(s, frequency),
    [s, frequency],
  );
  return useResource(`history:${s}:${frequency}`, load);
}
