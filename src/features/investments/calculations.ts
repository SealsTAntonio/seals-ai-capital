import type {
  EnrichedPosition,
  PortfolioPosition,
  PortfolioTotals,
  PositionMetrics,
} from './types';

export function calculatePosition(
  position: Pick<PortfolioPosition, 'quantity' | 'averageCost'>,
  currentPrice: number | null,
): PositionMetrics {
  const costBasis = position.quantity * position.averageCost;
  if (currentPrice === null)
    return {
      costBasis,
      marketValue: null,
      unrealizedGainLoss: null,
      unrealizedGainLossPercent: null,
    };
  const marketValue = position.quantity * currentPrice;
  const unrealizedGainLoss = marketValue - costBasis;
  return {
    costBasis,
    marketValue,
    unrealizedGainLoss,
    unrealizedGainLossPercent: costBasis === 0 ? null : (unrealizedGainLoss / costBasis) * 100,
  };
}

export function calculatePortfolioTotals(positions: EnrichedPosition[]): PortfolioTotals {
  const costBasis = positions.reduce((sum, item) => sum + item.costBasis, 0);
  const complete = positions.every((item) => item.marketValue !== null);
  const marketValue = complete
    ? positions.reduce((sum, item) => sum + (item.marketValue ?? 0), 0)
    : null;
  const unrealizedGainLoss = marketValue === null ? null : marketValue - costBasis;
  return {
    positionCount: positions.length,
    costBasis,
    marketValue,
    unrealizedGainLoss,
    unrealizedGainLossPercent:
      unrealizedGainLoss === null || costBasis === 0
        ? null
        : (unrealizedGainLoss / costBasis) * 100,
  };
}
