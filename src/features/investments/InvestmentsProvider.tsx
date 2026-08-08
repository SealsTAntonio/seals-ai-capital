import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useQuotes } from '@/features/market-data';

import { calculatePortfolioTotals, calculatePosition } from './calculations';
import {
  addWatchlistItem,
  loadPositions,
  loadWatchlist,
  removePosition as deletePosition,
  removeWatchlistItem,
  savePosition as persistPosition,
} from './investmentService';
import type { EnrichedPosition, PortfolioPosition, PortfolioTotals, WatchlistItem } from './types';
import { normalizeSymbol } from './validation';

type ContextValue = {
  watchlist: WatchlistItem[];
  positions: PortfolioPosition[];
  enrichedPositions: EnrichedPosition[];
  totals: PortfolioTotals;
  watchlistQuotes: ReturnType<typeof useQuotes>['data'];
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  mutationError: string | null;
  saving: boolean;
  refresh: () => Promise<void>;
  refreshMarketData: () => Promise<void>;
  isWatched: (symbol: string) => boolean;
  addToWatchlist: (symbol: string, name?: string | null) => Promise<boolean>;
  removeFromWatchlist: (symbol: string) => Promise<boolean>;
  savePosition: (symbol: string, quantity: number, averageCost: number) => Promise<boolean>;
  removePosition: (symbol: string) => Promise<boolean>;
};

const InvestmentsContext = createContext<ContextValue | undefined>(undefined);

export function InvestmentsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasLoaded = useRef(false);
  const symbols = useMemo(
    () => [
      ...new Set([
        ...watchlist.map((item) => item.symbol),
        ...positions.map((item) => item.symbol),
      ]),
    ],
    [positions, watchlist],
  );
  const quotes = useQuotes(symbols);
  const refresh = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setPositions([]);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(!hasLoaded.current);
    setRefreshing(hasLoaded.current);
    try {
      const [nextWatchlist, nextPositions] = await Promise.all([
        loadWatchlist(user.id),
        loadPositions(user.id),
      ]);
      setWatchlist(nextWatchlist);
      setPositions(nextPositions);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('Investment data is unavailable.'));
    } finally {
      hasLoaded.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const mutate = useCallback(async (operation: () => Promise<void>) => {
    setMutationError(null);
    setSaving(true);
    try {
      await operation();
      return true;
    } catch {
      setMutationError('We could not save that change. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);
  const quoteMap = useMemo(
    () => new Map((quotes.data ?? []).map((quote) => [quote.symbol, quote])),
    [quotes.data],
  );
  const enrichedPositions = useMemo(
    () =>
      positions.map((position) => {
        const quote = quoteMap.get(position.symbol) ?? null;
        return { ...position, quote, ...calculatePosition(position, quote?.currentPrice ?? null) };
      }),
    [positions, quoteMap],
  );
  const value = useMemo<ContextValue>(
    () => ({
      watchlist,
      positions,
      enrichedPositions,
      totals: calculatePortfolioTotals(enrichedPositions),
      watchlistQuotes: watchlist
        .map((item) => quoteMap.get(item.symbol))
        .filter((quote) => quote !== undefined),
      loading,
      refreshing: refreshing || quotes.refreshing,
      error: error ?? quotes.error,
      mutationError,
      saving,
      refresh,
      refreshMarketData: quotes.refresh,
      isWatched: (symbol) => watchlist.some((item) => item.symbol === normalizeSymbol(symbol)),
      addToWatchlist: (symbol, name) =>
        mutate(async () => {
          if (!user) throw new Error();
          const item = await addWatchlistItem(user.id, symbol, name);
          setWatchlist((current) => [...current, item]);
        }),
      removeFromWatchlist: (symbol) =>
        mutate(async () => {
          if (!user) throw new Error();
          await removeWatchlistItem(user.id, symbol);
          setWatchlist((current) =>
            current.filter((item) => item.symbol !== normalizeSymbol(symbol)),
          );
        }),
      savePosition: (symbol, quantity, averageCost) =>
        mutate(async () => {
          if (!user) throw new Error();
          const item = await persistPosition(user.id, symbol, quantity, averageCost);
          setPositions((current) => [
            ...current.filter((position) => position.symbol !== item.symbol),
            item,
          ]);
        }),
      removePosition: (symbol) =>
        mutate(async () => {
          if (!user) throw new Error();
          await deletePosition(user.id, symbol);
          setPositions((current) =>
            current.filter((item) => item.symbol !== normalizeSymbol(symbol)),
          );
        }),
    }),
    [
      enrichedPositions,
      error,
      loading,
      mutate,
      mutationError,
      positions,
      quoteMap,
      quotes.error,
      quotes.refresh,
      quotes.refreshing,
      refresh,
      refreshing,
      saving,
      user,
      watchlist,
    ],
  );
  return <InvestmentsContext.Provider value={value}>{children}</InvestmentsContext.Provider>;
}

export function useInvestments() {
  const value = useContext(InvestmentsContext);
  if (!value) throw new Error('useInvestments must be used within InvestmentsProvider');
  return value;
}
