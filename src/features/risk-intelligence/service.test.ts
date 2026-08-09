// eslint-disable-next-line import/no-unresolved
import { describe, expect, it } from 'vitest';

import type { RankedOpportunity } from '@/features/opportunity-intelligence';

import { assessRisk, calculatePositionSize, classifyRisk } from './service';
import type { RiskCategory, RiskFactor } from './types';

const opportunity = (overrides: Partial<RankedOpportunity> = {}): RankedOpportunity => ({
  rank: 1,
  symbol: 'SAC',
  companyName: null,
  compositeScore: 78,
  classification: 'Bullish Opportunity',
  confidence: {
    score: 80,
    label: 'high',
    completeness: 100,
    validComponents: 8,
    totalComponents: 8,
    reasons: [],
  },
  timeframe: 'swing',
  timeframeSupported: true,
  fundamentalScore: 75,
  technicalScore: 80,
  momentumScore: 72,
  trendScore: 70,
  volumeScore: 65,
  riskScore: 65,
  valuationScore: 60,
  qualityScore: 75,
  signalAgreement: {
    kind: 'confirmed-strength',
    label: 'Confirmed Strength',
    agreedComponents: ['fundamental', 'technical'],
    conflicts: [],
    score: 90,
  },
  conflicts: [],
  strengths: [],
  weaknesses: [],
  positiveSignals: [],
  negativeSignals: [],
  warnings: [],
  missingInformation: [],
  catalystAvailable: null,
  dataStatus: 'REAL',
  provenance: ['upstream'],
  explanation: 'Upstream fixture.',
  ...overrides,
});
const categories: RiskCategory[] = ['market', 'volatility', 'liquidity', 'technical', 'catalyst'];
const factors = (value = 40): RiskFactor[] =>
  categories.map((category) => ({
    code: category.toUpperCase(),
    category,
    value,
    confidence: 80,
    weight: 1,
    dataQuality: 'REAL',
    provenance: [{ provider: 'test-provider', source: category }],
    missingInputs: [],
    explanation: `${category} evidence`,
  }));

describe('risk intelligence', () => {
  it('normalizes weighted risk, classifies boundaries, preserves provenance, and is deterministic', () => {
    const result = assessRisk({ opportunity: opportunity(), factors: factors(40) });
    expect(result.score).toBe(40);
    expect(result.classification).toBe('Moderate Risk');
    expect(result.relationship).toBe('Strong Opportunity / Moderate Risk');
    expect(result.provenance).toHaveLength(5);
    expect(assessRisk({ opportunity: opportunity(), factors: factors(40) })).toEqual(result);
    expect([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map((v) => classifyRisk(v).level)).toEqual([
      'VERY_LOW',
      'VERY_LOW',
      'LOW',
      'LOW',
      'MODERATE',
      'MODERATE',
      'HIGH',
      'HIGH',
      'VERY_HIGH',
      'VERY_HIGH',
    ]);
  });

  it('rejects negative, non-finite, out-of-range, and contradictory provider values', () => {
    for (const value of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY]) {
      const invalid = factors();
      invalid[0] = { ...invalid[0]!, value };
      expect(() => assessRisk({ opportunity: opportunity(), factors: invalid })).toThrow();
    }
    const failed = factors();
    failed[0] = { ...failed[0]!, dataQuality: 'ERROR' };
    expect(() => assessRisk({ opportunity: opportunity(), factors: failed })).toThrow();
  });

  it('does not treat missing or provider-failed evidence as zero risk', () => {
    const partial = factors();
    partial[0] = {
      ...partial[0]!,
      value: null,
      confidence: null,
      dataQuality: 'ERROR',
      missingInputs: ['market provider response'],
    };
    const result = assessRisk({ opportunity: opportunity(), factors: partial });
    expect(result.score).toBeNull();
    expect(result.complete).toBe(false);
    expect(result.dataQuality).toBe('ERROR');
    expect(result.tradeReadiness.state).toBe('INSUFFICIENT_DATA');
    expect(result.missingInputs).toContain('market provider response');
  });

  it('detects catalyst/volatility, liquidity, concentration, and timeframe conflicts without resolving them', () => {
    const high: RiskFactor[] = [
      ...factors(40),
      { ...factors(90)[0]!, code: 'CONCENTRATION', category: 'concentration' as const },
    ];
    high[1] = { ...high[1]!, value: 90 };
    high[2] = { ...high[2]!, value: 85 };
    const result = assessRisk({
      opportunity: opportunity({
        timeframeSupported: false,
        context: {
          catalystSummary: 'Event',
          catalystDirection: 'potentially-supportive',
          catalystStrength: 'high',
          catalystConfidence: 80,
          upcomingCatalystCount: 1,
          recentCatalystCount: 0,
          catalystRisks: [],
          eventTimeline: [],
          contextConflicts: [],
          contextWarnings: [],
          missingInformation: [],
          dataStatus: 'REAL',
          provenance: [],
        },
      }),
      factors: high,
    });
    expect(result.conflicts.map((c) => c.code)).toEqual(
      expect.arrayContaining([
        'POSITIVE_CATALYST_EXTREME_VOLATILITY',
        'ATTRACTIVE_OPPORTUNITY_POOR_LIQUIDITY',
        'STRONG_OPPORTUNITY_CONCENTRATION',
        'CONFLICTING_TIMEFRAMES',
      ]),
    );
    expect(result.conflicts.every((c) => c.resolution === 'UNRESOLVED')).toBe(true);
    expect(result.tradeReadiness.state).toBe('NOT_READY');
  });
});

describe('position sizing', () => {
  it('calculates risk budget, shares, notional, exposure, and stop loss', () => {
    expect(
      calculatePositionSize({
        accountEquity: 100_000,
        maximumRiskPercentage: 1,
        entryPrice: 50,
        stopPrice: 48,
      }),
    ).toMatchObject({
      status: 'COMPLETE',
      dollarRiskPerShare: 2,
      maximumAllowedDollarRisk: 1000,
      suggestedMaximumShares: 500,
      positionNotionalValue: 25_000,
      positionExposurePercentage: 25,
      estimatedLossAtStop: 1000,
    });
  });
  it('applies explicit dollar, position-value, exposure, and concentration constraints', () => {
    const result = calculatePositionSize({
      accountEquity: 10_000,
      maximumRiskPercentage: 5,
      maximumRiskDollarAmount: 200,
      entryPrice: 20,
      riskPerShare: 1,
      maximumPositionValue: 3000,
      portfolioExposureLimit: 25,
      concentrationLimit: 10,
    });
    expect(result.suggestedMaximumShares).toBe(50);
    expect(result.limitingConstraints).toEqual(['concentration limit']);
  });
  it('preserves missing inputs and rejects zero, negative, non-finite, and invalid percentages', () => {
    expect(calculatePositionSize({ maximumRiskPercentage: 1, stopPrice: 9 }).missingInputs).toEqual(
      expect.arrayContaining(['account equity', 'entry price']),
    );
    expect(
      calculatePositionSize({
        accountEquity: 1000,
        maximumRiskPercentage: 1,
        entryPrice: 10,
        stopPrice: 10,
      }).status,
    ).toBe('INVALID');
    for (const input of [
      { accountEquity: -1 },
      { entryPrice: Number.NaN },
      { maximumRiskPercentage: 101 },
    ])
      expect(calculatePositionSize(input).status).toBe('INVALID');
  });
});
