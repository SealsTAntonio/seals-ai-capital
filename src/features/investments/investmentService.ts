import { getSupabaseClient } from '@/lib/supabase';

import type { PortfolioPosition, WatchlistItem } from './types';
import { normalizeSymbol } from './validation';

type WatchlistRow = {
  id: string;
  user_id: string;
  symbol: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};
type PositionRow = {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number | string;
  average_cost: number | string;
  created_at: string;
  updated_at: string;
};

const watchlistSelection = 'id, user_id, symbol, display_name, created_at, updated_at';
const positionSelection = 'id, user_id, symbol, quantity, average_cost, created_at, updated_at';
const mapWatchlist = (row: WatchlistRow): WatchlistItem => ({
  id: row.id,
  userId: row.user_id,
  symbol: row.symbol,
  displayName: row.display_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const mapPosition = (row: PositionRow): PortfolioPosition => ({
  id: row.id,
  userId: row.user_id,
  symbol: row.symbol,
  quantity: Number(row.quantity),
  averageCost: Number(row.average_cost),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function loadWatchlist(userId: string): Promise<WatchlistItem[]> {
  const { data, error } = await getSupabaseClient()
    .from('watchlist')
    .select(watchlistSelection)
    .eq('user_id', userId)
    .order('created_at');
  if (error) throw error;
  return (data as WatchlistRow[]).map(mapWatchlist);
}

export async function addWatchlistItem(
  userId: string,
  symbol: string,
  displayName?: string | null,
): Promise<WatchlistItem> {
  const { data, error } = await getSupabaseClient()
    .from('watchlist')
    .insert({ user_id: userId, symbol: normalizeSymbol(symbol), display_name: displayName || null })
    .select(watchlistSelection)
    .single<WatchlistRow>();
  if (error) throw error;
  return mapWatchlist(data);
}

export async function removeWatchlistItem(userId: string, symbol: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', normalizeSymbol(symbol));
  if (error) throw error;
}

export async function loadPositions(userId: string): Promise<PortfolioPosition[]> {
  const { data, error } = await getSupabaseClient()
    .from('portfolio_positions')
    .select(positionSelection)
    .eq('user_id', userId)
    .order('created_at');
  if (error) throw error;
  return (data as PositionRow[]).map(mapPosition);
}

export async function savePosition(
  userId: string,
  symbol: string,
  quantity: number,
  averageCost: number,
): Promise<PortfolioPosition> {
  const { data, error } = await getSupabaseClient()
    .from('portfolio_positions')
    .upsert(
      { user_id: userId, symbol: normalizeSymbol(symbol), quantity, average_cost: averageCost },
      { onConflict: 'user_id,symbol' },
    )
    .select(positionSelection)
    .single<PositionRow>();
  if (error) throw error;
  return mapPosition(data);
}

export async function removePosition(userId: string, symbol: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('portfolio_positions')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', normalizeSymbol(symbol));
  if (error) throw error;
}
