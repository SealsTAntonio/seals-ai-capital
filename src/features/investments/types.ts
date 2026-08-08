import type { MarketQuote } from '@/features/market-data';

export type WatchlistItem = {
  id: string;
  userId: string;
  symbol: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioPosition = {
  id: string;
  userId: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  createdAt: string;
  updatedAt: string;
};

export type PositionMetrics = {
  marketValue: number | null;
  costBasis: number;
  unrealizedGainLoss: number | null;
  unrealizedGainLossPercent: number | null;
};

export type EnrichedPosition = PortfolioPosition & PositionMetrics & { quote: MarketQuote | null };
export type PortfolioTotals = PositionMetrics & { positionCount: number };
