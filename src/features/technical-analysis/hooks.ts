import { useCallback, useEffect, useState } from 'react';

import { requestTechnicalAnalysis } from './service';
import type { TechnicalAnalysis, Timeframe } from './types';
export function useTechnicalAnalysis(symbol: string, timeframe: Timeframe) {
  const [data, setData] = useState<TechnicalAnalysis | null>(null),
    [error, setError] = useState<Error | null>(null),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false);
  const load = useCallback(
    async (force = false) => {
      if (data) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        setData(await requestTechnicalAnalysis(symbol, timeframe, force));
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Technical analysis unavailable.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [data, symbol, timeframe],
  );
  useEffect(() => {
    void load();
  }, [symbol, timeframe]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error, loading, refreshing, refresh: () => load(true), retry: () => load(true) };
}
