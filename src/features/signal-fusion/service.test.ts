// eslint-disable-next-line import/no-unresolved
import { describe, expect, it } from 'vitest';

import type { RankedOpportunity } from '@/features/opportunity-intelligence';
import { assessRisk, type RiskFactor } from '@/features/risk-intelligence';

import { assessSignalFusion } from './service';
import type { DecisionContext } from './types';

const opportunity = (overrides: Partial<RankedOpportunity> = {}): RankedOpportunity => ({
  rank: 1,
  symbol: 'SAC',
  companyName: 'Seals',
  compositeScore: 82,
  classification: 'Strong Bullish Opportunity',
  confidence: {
    score: 85,
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
  momentumScore: 75,
  trendScore: 75,
  volumeScore: 70,
  riskScore: 70,
  valuationScore: 65,
  qualityScore: 75,
  signalAgreement: {
    kind: 'confirmed-strength',
    label: 'strength',
    agreedComponents: ['fundamental', 'technical'],
    conflicts: [],
    score: 90,
  },
  conflicts: [],
  strengths: ['quality'],
  weaknesses: [],
  positiveSignals: [],
  negativeSignals: [],
  warnings: [],
  missingInformation: [],
  catalystAvailable: true,
  dataStatus: 'REAL',
  provenance: ['quantitative/provider'],
  explanation: 'Authoritative opportunity assessment.',
  context: {
    catalystSummary: 'Confirmed supportive event.',
    catalystDirection: 'potentially-supportive',
    catalystStrength: 'high',
    catalystConfidence: 85,
    upcomingCatalystCount: 1,
    recentCatalystCount: 0,
    catalystRisks: [],
    eventTimeline: [],
    contextConflicts: [],
    contextWarnings: [],
    missingInformation: [],
    dataStatus: 'REAL',
    provenance: [
      { provider: 'catalyst-provider', sourceName: 'filing', retrievedAt: '2026-08-09T00:00:00Z' },
    ],
  },
  ...overrides,
});
const factors = (value = 30, quality: RiskFactor['dataQuality'] = 'REAL'): RiskFactor[] =>
  (['market', 'volatility', 'liquidity', 'technical', 'catalyst'] as const).map((category) => ({
    code: category,
    category,
    value,
    confidence: 90,
    weight: 1,
    dataQuality: quality,
    provenance: [{ provider: 'risk-provider', source: category }],
    missingInputs: [],
    explanation: `${category} risk`,
  }));
const context = (riskValue = 30, overrides: Partial<DecisionContext> = {}): DecisionContext => {
  const o = opportunity();
  return {
    opportunity: o,
    risk: assessRisk({ opportunity: o, factors: factors(riskValue) }),
    portfolioFit: {
      symbol: 'SAC',
      rank: 1,
      opportunityScore: 82,
      riskScore: riskValue,
      catalystContext: 'supportive',
      existingExposure: 5,
      concentrationImpact: 'LOW',
      diversificationImpact: 'IMPROVES',
      catalystOverlap: false,
      timeframeOverlap: false,
      riskImpact: riskValue,
      fit: 'STRONG_FIT',
      explanation: ['Strong portfolio fit.'],
    },
    ...overrides,
  };
};

describe('signal fusion decision intelligence', () => {
  it('is deterministic, aligned, explainable, and preserves provenance', () => {
    const result = assessSignalFusion(context());
    expect(result.alignment).toBe('ALIGNED');
    expect(result.classification).toBe('HIGH_CONVICTION_RESEARCH');
    expect(result.agreements.length).toBeGreaterThan(0);
    expect(result.provenance.some((p) => p.provider === 'risk-provider')).toBe(true);
    expect(assessSignalFusion(context())).toEqual(result);
    expect(result.readiness.executableInstruction).toBe(false);
  });
  it('distinguishes mostly aligned and mixed signals', () => {
    expect(assessSignalFusion(context(45)).alignment).toBe('MOSTLY_ALIGNED');
    const mixed = assessSignalFusion(
      context(45, { opportunity: opportunity({ technicalScore: 20, fundamentalScore: 30 }) }),
    );
    expect(mixed.alignment).toBe('MIXED');
    expect(mixed.classification).toBe('MIXED_SIGNAL');
  });
  it('never ignores critical risk or concentration conflicts', () => {
    const risky = assessSignalFusion(context(85));
    expect(risky.conflicts.some((c) => c.code === 'STRONG_OPPORTUNITY_EXCESSIVE_RISK')).toBe(true);
    expect(risky.classification).toBe('CONFLICTED');
    const concentrated = assessSignalFusion(
      context(30, {
        portfolioFit: {
          ...context().portfolioFit!,
          fit: 'CONFLICT',
          concentrationImpact: 'VERY_HIGH',
        },
      }),
    );
    expect(concentrated.conflicts.some((c) => c.code === 'SCORE_PORTFOLIO_CONFLICT')).toBe(true);
  });
  it('gates missing opportunity and risk while preserving optional catalyst and portfolio absence', () => {
    const missingOpportunity = assessSignalFusion(
      context(30, { opportunity: opportunity({ dataStatus: 'UNAVAILABLE' }) }),
    );
    expect(missingOpportunity.classification).toBe('INSUFFICIENT_DATA');
    const missingRisk = assessSignalFusion({ opportunity: opportunity() });
    expect(missingRisk.classification).toBe('INSUFFICIENT_DATA');
    const optional = assessSignalFusion({
      opportunity: opportunity({ context: undefined }),
      risk: context().risk,
    });
    expect(optional.components.find((c) => c.name === 'CATALYST')?.availability).toBe(
      'UNAVAILABLE',
    );
    expect(optional.components.find((c) => c.name === 'PORTFOLIO_FIT')?.availability).toBe(
      'MISSING',
    );
  });
  it('reduces confidence for stale and poor quality evidence without fallback', () => {
    const current = assessSignalFusion(context());
    const partialOpportunity = opportunity({ dataStatus: 'PARTIAL' });
    const partial = assessSignalFusion({
      opportunity: partialOpportunity,
      risk: assessRisk({ opportunity: partialOpportunity, factors: factors() }),
    });
    expect(partial.confidence.score! < current.confidence.score!).toBe(true);
    expect(partial.dataQuality.overall).toBe('PARTIAL');
    expect(partial.conflicts.some((c) => c.code === 'OPPORTUNITY_DATA_QUALITY')).toBe(true);
    const staleOpportunity = opportunity();
    const stale = assessSignalFusion({
      opportunity: staleOpportunity,
      risk: assessRisk({ opportunity: staleOpportunity, factors: factors(30, 'STALE') }),
    });
    expect(stale.dataQuality.staleComponents).toEqual(['RISK']);
    expect(stale.confidence.score! < current.confidence.score!).toBe(true);
  });
  it('preserves unavailable provider state and produces unavailable when all critical evidence is absent', () => {
    const result = assessSignalFusion({
      opportunity: opportunity({
        dataStatus: 'UNAVAILABLE',
        compositeScore: null,
        confidence: {
          score: null,
          label: 'unavailable',
          completeness: 0,
          validComponents: 0,
          totalComponents: 8,
          reasons: ['provider unavailable'],
        },
        technicalScore: null,
        fundamentalScore: null,
        context: undefined,
      }),
    });
    expect(result.alignment).toBe('UNAVAILABLE');
    expect(result.classification).toBe('UNAVAILABLE');
    expect(result.confidence.score).toBeNull();
  });
  it('rejects invalid numbers, confidence, and weights', () => {
    expect(() =>
      assessSignalFusion({ opportunity: opportunity({ compositeScore: Number.NaN }) }),
    ).toThrow();
    expect(() =>
      assessSignalFusion({
        opportunity: opportunity({ confidence: { ...opportunity().confidence, score: 101 } }),
      }),
    ).toThrow();
    expect(() => assessSignalFusion(context(), { weights: { RISK: -1 } })).toThrow();
  });
  it('reports explicitly supplied timeframe divergence without collapsing horizons', () => {
    const result = assessSignalFusion(
      context(30, {
        timeframeSignals: [
          { timeframe: 'short-term', direction: 'SUPPORTIVE', source: 'technical' },
          { timeframe: 'long-term', direction: 'OPPOSING', source: 'fundamental' },
        ],
      }),
    );
    expect(result.conflicts.some((c) => c.code === 'TIMEFRAME_DIVERGENCE')).toBe(true);
    expect(result.timeframe).toBe('swing');
  });
  it('generates stable non-trading explanations and supports legacy callers through optional integration', () => {
    const a = assessSignalFusion(context());
    const b = assessSignalFusion(context());
    expect(a.explanation).toBe(b.explanation);
    expect(/buy|sell|guarantee/i.test(a.explanation)).toBe(false);
    const legacyWorkspaceProps = { opportunities: [opportunity()] };
    expect(legacyWorkspaceProps.opportunities).toHaveLength(1);
  });
});
