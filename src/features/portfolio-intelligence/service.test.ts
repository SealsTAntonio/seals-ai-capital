// eslint-disable-next-line import/no-unresolved
import { describe, expect, it } from 'vitest';

import { assessPortfolio } from './service';
import type { PortfolioSnapshot } from './types';

const snapshot = (overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot => ({
  id: 'audit-1',
  dataQuality: 'REAL',
  provenance: [{ provider: 'fixture', source: 'test' }],
  riskBudget: 50,
  targetAllocations: { AAA: 0.4, BBB: 0.6 },
  holdings: [
    {
      symbol: 'AAA',
      direction: 'LONG',
      quantity: 2,
      referencePrice: 100,
      sector: 'Tech',
      assetClass: 'equity',
      timeframe: 'swing',
      catalystThemes: ['earnings'],
      dataQuality: 'REAL',
      provenance: [{ provider: 'fixture', source: 'positions' }],
    },
    {
      symbol: 'BBB',
      direction: 'SHORT',
      notionalValue: 100,
      sector: 'Finance',
      assetClass: 'equity',
      timeframe: 'long-term',
      dataQuality: 'STALE',
      provenance: [{ provider: 'fixture', source: 'positions' }],
    },
  ],
  ...overrides,
});

describe('portfolio intelligence', () => {
  it('derives deterministic long, short, gross, net, weights and allocation gaps', () => {
    const result = assessPortfolio({ snapshot: snapshot() });
    expect(result.exposure.long.value).toBe(200);
    expect(result.exposure.short.value).toBe(100);
    expect(result.exposure.gross.value).toBe(300);
    expect(result.exposure.net.value).toBe(100);
    expect(result.exposure.positionWeights.AAA?.availability).toBe('DERIVED');
    expect(result.allocation.gaps.AAA?.value).toBe(-0.2667);
  });
  it('does not invent correlation, risk budgets, targets, or missing values', () => {
    const result = assessPortfolio({
      snapshot: snapshot({ riskBudget: null, targetAllocations: null, correlation: null }),
    });
    expect(result.riskBudget.status).toBe('RISK_BUDGET_UNAVAILABLE');
    expect(result.allocation.comparisonStatus).toBe('UNAVAILABLE');
    expect(result.diversification.correlationStatus).toBe('UNAVAILABLE');
    expect(result.conflicts.map((c) => c.code)).toContain('MISSING_RISK_BUDGET');
  });
  it('preserves provenance and stale quality', () => {
    const result = assessPortfolio({ snapshot: snapshot({ dataQuality: 'STALE' }) });
    expect(result.dataQuality).toBe('STALE');
    expect(result.provenance).toHaveLength(2);
    expect(result.readiness.state).toBe('CONFLICTED');
  });
  it('exposes incomplete and empty portfolios without fabricating exposure', () => {
    const incomplete = assessPortfolio({
      snapshot: snapshot({
        holdings: [{ symbol: 'AAA', direction: 'LONG', dataQuality: 'MISSING', provenance: [] }],
      }),
    });
    expect(incomplete.exposure.total.value).toBeNull();
    expect(incomplete.missingInputs).toHaveLength(1);
    expect(assessPortfolio({ snapshot: snapshot({ holdings: [] }) }).readiness.state).toBe(
      'INSUFFICIENT_DATA',
    );
  });
  it('rejects invalid numeric values', () => {
    expect(() =>
      assessPortfolio({
        snapshot: snapshot({
          holdings: [
            { symbol: 'AAA', direction: 'LONG', quantity: 0, dataQuality: 'REAL', provenance: [] },
          ],
        }),
      }),
    ).toThrow();
    expect(() => assessPortfolio({ snapshot: snapshot({ riskBudget: -1 }) })).toThrow();
  });
});
