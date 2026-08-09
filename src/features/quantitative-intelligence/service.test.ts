// eslint-disable-next-line import/no-unresolved
import { describe, expect, it } from 'vitest';

import type { FundamentalMetric, FundamentalSnapshot } from '@/features/fundamentals/types';
import type { TechnicalAnalysis } from '@/features/technical-analysis/types';

import {
  assessQuantitativeSignals,
  classifyCompositeScore,
  createQuantitativeIntelligenceService,
  normalizeQuantitativeWeights,
} from './service';

const metric = (value: number | null): FundamentalMetric => ({
  value,
  unit: 'ratio',
  classification: value === null ? 'unavailable' : 'available',
  illustrative: false,
  source: 'test',
  asOf: '2026-01-01',
});
const fundamental = (environment: 'real' | 'demo' = 'real'): FundamentalSnapshot => {
  const metrics = new Proxy({}, { get: () => metric(null) }) as FundamentalSnapshot['metrics'];
  Object.assign(metrics, {
    revenueGrowth: metric(20),
    epsGrowth: metric(20),
    freeCashFlowGrowth: metric(20),
    grossMargin: metric(45),
    operatingMargin: metric(20),
    netProfitMargin: metric(15),
    returnOnEquity: metric(20),
    currentRatio: metric(2),
    debtToEquity: metric(0.5),
    freeCashFlowMargin: metric(15),
    priceToEarnings: metric(15),
    priceToSales: metric(3),
    priceToBook: metric(3),
    cashFlowYield: metric(8),
  });
  return {
    company: {
      name: 'Test',
      ticker: 'TST',
      exchange: null,
      sector: null,
      industry: null,
      cik: null,
    },
    period: {
      fiscalYear: 2026,
      fiscalQuarter: null,
      frequency: 'annual',
      reportingPeriodStart: null,
      reportingPeriodEnd: null,
    },
    metrics,
    history: [],
    scoreInputs: [],
    source: 'fixture',
    environment,
    dataStatus: environment === 'real' ? 'populated' : 'unavailable',
    sourceUrl: null,
    providerName: 'test-provider',
    filingDate: null,
    formType: null,
    fetchedAt: '2026-01-01',
    staleAfter: '2026-01-02',
    disclaimer: 'test',
    availability: {} as FundamentalSnapshot['availability'],
  };
};
const technical = (
  value = 80,
  status: TechnicalAnalysis['provenance']['status'] = 'real',
): TechnicalAnalysis => ({
  series: null,
  provenance: {
    status,
    provider: 'technical-test',
    source: 'fixture',
    retrievedAt: '2026-01-01',
    freshness: 'current',
    symbol: 'TST',
    timeframe: '1D',
    error: null,
  },
  trend: 'uptrend',
  momentum: 10,
  volatility: 2,
  volumeCondition: 'above-average',
  support: 90,
  resistance: 110,
  indicators: [],
  score: {
    value,
    classification: value >= 60 ? 'bullish' : value <= 40 ? 'bearish' : 'neutral',
    explanation: 'test',
    components: [
      { name: 'trend', score: value, weight: 0.3, available: true, reason: 'test' },
      { name: 'momentum', score: value, weight: 0.25, available: true, reason: 'test' },
      { name: 'volume', score: value, weight: 0.15, available: true, reason: 'test' },
      { name: 'volatility', score: value, weight: 0.1, available: true, reason: 'test' },
      { name: 'supportResistance', score: value, weight: 0.2, available: true, reason: 'test' },
    ],
  },
  signals: [
    {
      id: 'trend',
      label: 'Positive trend',
      direction: value >= 60 ? 'bullish' : value < 50 ? 'bearish' : 'neutral',
      explanation: 'test',
    },
  ],
  explanation: 'test',
  warnings: [],
});

describe('quantitative intelligence', () => {
  it('normalizes weights deterministically', () => {
    const weights = normalizeQuantitativeWeights({ fundamental: 2, technical: 2 });
    expect(Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 1e-10).toBe(true);
    expect(normalizeQuantitativeWeights({ fundamental: 2, technical: 2 })).toEqual(weights);
  });
  it('rejects invalid weights and input', () => {
    let failures = 0;
    for (const action of [
      () => normalizeQuantitativeWeights({ risk: Number.NaN }),
      () =>
        normalizeQuantitativeWeights(
          Object.fromEntries(Object.keys(normalizeQuantitativeWeights()).map((key) => [key, 0])),
        ),
      () => assessQuantitativeSignals({ symbol: '', fundamental: null, technical: null }),
    ]) {
      try {
        action();
      } catch {
        failures += 1;
      }
    }
    expect(failures).toBe(3);
  });
  it('never turns missing data into zero or non-finite output', () => {
    const result = assessQuantitativeSignals({ symbol: 'TST', fundamental: null, technical: null });
    expect(result.score).toBeNull();
    expect(result.classification).toBe('Unavailable');
    expect(
      result.components.every((item) => item.score === null && item.contribution === null),
    ).toBe(true);
    expect(/NaN|Infinity/.test(JSON.stringify(result))).toBe(false);
  });
  it('calculates reproducible composite contributions and partial confidence', () => {
    const input = { symbol: 'TST', fundamental: fundamental(), technical: technical() };
    const first = assessQuantitativeSignals(input),
      second = assessQuantitativeSignals(input);
    expect(first).toEqual(second);
    expect(first.score).toBe(
      Math.round(first.components.reduce((sum, item) => sum + (item.contribution ?? 0), 0)),
    );
    expect(first.score! >= 0).toBe(true);
    expect(first.score! <= 100).toBe(true);
  });
  it('propagates demo and provider error states without fallback', () => {
    expect(
      assessQuantitativeSignals({
        symbol: 'TST',
        fundamental: fundamental('demo'),
        technical: null,
      }).dataStatus,
    ).toBe('demo');
    const failed = assessQuantitativeSignals({
      symbol: 'TST',
      fundamental: null,
      technical: null,
      errors: { technical: 'upstream failed' },
    });
    expect(failed.dataStatus).toBe('error');
    expect(failed.score).toBeNull();
  });
  it('detects opposing and missing-domain conflicts', () => {
    const opposing = assessQuantitativeSignals({
      symbol: 'TST',
      fundamental: fundamental(),
      technical: technical(20),
    });
    expect(
      opposing.conflicts.some((item) => item.code === 'strong-fundamentals-weak-technicals'),
    ).toBe(true);
    const missing = assessQuantitativeSignals({
      symbol: 'TST',
      fundamental: null,
      technical: technical(85),
    });
    expect(missing.conflicts.some((item) => item.code === 'missing-fundamentals')).toBe(true);
  });
  it('supports bullish, bearish, neutral, and boundary classifications', () => {
    expect(classifyCompositeScore(90)).toBe('Exceptional');
    expect(classifyCompositeScore(80)).toBe('Strong');
    expect(classifyCompositeScore(70)).toBe('Constructive');
    expect(classifyCompositeScore(60)).toBe('Neutral');
    expect(classifyCompositeScore(50)).toBe('Weak');
    expect(classifyCompositeScore(49)).toBe('High Risk / Weak');
    expect(
      assessQuantitativeSignals({ symbol: 'TST', fundamental: null, technical: technical(80) })
        .bullishFactors.length,
    ).toBeGreaterThan(0);
    expect(
      assessQuantitativeSignals({ symbol: 'TST', fundamental: null, technical: technical(20) })
        .bearishFactors.length,
    ).toBeGreaterThan(0);
    expect(
      assessQuantitativeSignals({ symbol: 'TST', fundamental: null, technical: technical(55) })
        .neutralFactors.length,
    ).toBeGreaterThan(0);
  });
  it('uses the provider boundary and preserves failures', async () => {
    const service = createQuantitativeIntelligenceService({
      name: 'test',
      async getInputs() {
        throw new Error('provider error');
      },
    });
    let message = '';
    try {
      await service.analyze('TST');
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toBe('provider error');
  });
});
