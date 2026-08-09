// eslint-disable-next-line import/no-unresolved
import { describe, expect, it } from 'vitest';

import type {
  QuantitativeAssessment,
  QuantitativeComponentName,
  QuantitativeDataStatus,
} from '@/features/quantitative-intelligence';

import {
  calculateOpportunityConfidence,
  classifyOpportunity,
  rankOpportunities,
  rankWatchlistOpportunities,
} from './service';
import type { OpportunityCandidate } from './types';

const names: QuantitativeComponentName[] = [
  'fundamental',
  'technical',
  'momentum',
  'trend',
  'volume',
  'risk',
  'valuation',
  'quality',
];
const assessment = (
  symbol: string,
  value: number | null,
  status: QuantitativeDataStatus = 'real',
  overrides: Partial<Record<QuantitativeComponentName, number | null>> = {},
): QuantitativeAssessment => ({
  symbol,
  score: value,
  classification: value === null ? 'Unavailable' : 'Neutral',
  components: names.map((name) => ({
    name,
    score: name in overrides ? overrides[name]! : value,
    weight: 0.125,
    effectiveWeight: 0.125,
    contribution: value === null ? null : value * 0.125,
    positiveFactors:
      value !== null && value >= 60
        ? [{ id: name, label: name, direction: 'bullish', explanation: `${name} positive` }]
        : [],
    negativeFactors:
      value !== null && value < 50
        ? [{ id: name, label: name, direction: 'bearish', explanation: `${name} negative` }]
        : [],
    neutralFactors: [],
    missingInputs:
      (name in overrides && overrides[name] === null) || value === null ? [`missing ${name}`] : [],
    dataStatus: status,
    provenance: status === 'unavailable' ? [] : ['fixture'],
    confidence: status === 'real' ? 100 : 50,
  })),
  bullishFactors: [],
  bearishFactors: [],
  neutralFactors: [],
  conflicts: [],
  riskFlags: [],
  missingData: value === null ? ['all inputs unavailable'] : [],
  dataStatus: status,
  confidence: value === null ? 0 : 100,
  incomplete: value === null,
  methodology: 'fixture',
});
const candidate = (
  symbol: string,
  value: number | null,
  extra: Partial<OpportunityCandidate> = {},
): OpportunityCandidate => ({
  assessment: assessment(symbol, value),
  requestedTimeframe: 'swing',
  supportedTimeframes: ['swing'],
  historyAvailable: true,
  sourceFreshness: 'current',
  ...extra,
});

describe('opportunity intelligence', () => {
  it('ranks deterministically and breaks exact ties by symbol', () => {
    const input = [candidate('ZZZ', 80), candidate('AAA', 80), candidate('MID', 70)];
    expect(rankOpportunities(input, { timeframe: 'swing' }).map((x) => x.symbol)).toEqual([
      'AAA',
      'ZZZ',
      'MID',
    ]);
    expect(rankOpportunities(input, { timeframe: 'swing' })).toEqual(
      rankOpportunities(input, { timeframe: 'swing' }),
    );
  });
  it('classifies bullish, neutral, bearish, and high-risk cases', () => {
    expect(classifyOpportunity(90, 90, true)).toBe('Strong Bullish Opportunity');
    expect(classifyOpportunity(55, 90, true)).toBe('Neutral / Watch');
    expect(classifyOpportunity(35, 90, true)).toBe('Bearish Opportunity');
    expect(classifyOpportunity(80, 20, true)).toBe('High-Risk / Avoid');
  });
  it('reports strong agreement and structured conflicts', () => {
    const strong = rankOpportunities([candidate('UP', 80)], { timeframe: 'swing' })[0]!;
    expect(strong.signalAgreement.label).toBe('Confirmed Strength');
    const conflicted = candidate('MIX', 60, {
      assessment: assessment('MIX', 60, 'real', { fundamental: 80, technical: 30 }),
    });
    conflicted.assessment.conflicts.push({
      code: 'test-conflict',
      severity: 'warning',
      components: ['fundamental', 'technical'],
      explanation: 'opposed',
    });
    const result = rankOpportunities([conflicted], { timeframe: 'swing' })[0]!;
    expect(result.signalAgreement.label).toBe('Fundamental/Technical Conflict');
    expect(result.conflicts[0]!.impact).toBe('reduces-confidence');
  });
  it('does not manufacture scores or confidence from missing and failed data', () => {
    for (const status of ['unavailable', 'error'] as const) {
      const missing = candidate('NONE', null, { assessment: assessment('NONE', null, status) });
      const result = rankOpportunities([missing], { timeframe: 'swing' })[0]!;
      expect(result.compositeScore).toBeNull();
      expect(result.confidence.score).toBeNull();
      expect(result.dataStatus).toBe(status.toUpperCase());
      expect(result.provenance).toEqual([]);
    }
  });
  it('reduces confidence for partial, stale, conflicting evidence', () => {
    const full = calculateOpportunityConfidence(candidate('FULL', 75));
    const partialCandidate = candidate('PART', 75, {
      assessment: assessment('PART', 75, 'partial', { volume: null }),
      sourceFreshness: 'stale',
      historyAvailable: false,
    });
    partialCandidate.assessment.conflicts.push({
      code: 'x',
      severity: 'warning',
      components: ['trend', 'momentum'],
      explanation: 'x',
    });
    expect(calculateOpportunityConfidence(partialCandidate).score! < full.score!).toBe(true);
  });
  it('marks unsupported timeframes insufficient rather than broadening a signal', () => {
    const result = rankOpportunities([candidate('DAY', 90)], { timeframe: 'long-term' })[0]!;
    expect(result.timeframeSupported).toBe(false);
    expect(result.classification).toBe('Incomplete Assessment');
    expect(result.missingInformation.join(' ').includes('not supported')).toBe(true);
  });
  it('integrates watchlist contracts and preserves provenance without demo fallback', () => {
    const partial = assessment('WATCH', 70, 'partial');
    const result = rankWatchlistOpportunities(
      [
        {
          symbol: 'WATCH',
          displayName: 'Watch Co',
          assessment: partial,
          supportedTimeframes: ['swing'],
        },
      ],
      'swing',
    )[0]!;
    expect(result.companyName).toBe('Watch Co');
    expect(result.dataStatus).toBe('PARTIAL');
    expect(result.provenance).toEqual(['fixture']);
    expect(result.warnings.some((warning) => warning.includes('Demo data'))).toBe(false);
  });
  it('keeps demo explicitly labeled and warns that it is illustrative', () => {
    const demo = candidate('DEMO', 80, { assessment: assessment('DEMO', 80, 'demo') });
    const result = rankOpportunities([demo], { timeframe: 'swing' })[0]!;
    expect(result.dataStatus).toBe('DEMO');
    expect(result.warnings.join(' ').includes('illustrative')).toBe(true);
  });
});
