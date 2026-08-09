// eslint-disable-next-line import/no-unresolved
import { describe, expect, it } from 'vitest';

import {
  assessCatalystImpact,
  buildOpportunityContext,
  classifyCatalystPhase,
  createUnavailableCatalystProvider,
} from './service';
import type { CatalystEvent, CatalystFeed, IntelligenceProvenance } from './types';

const now = new Date('2026-08-09T12:00:00Z');
const provenance: IntelligenceProvenance = {
  provider: 'trusted-fixture',
  sourceName: 'Provider record',
  sourceId: 'source-1',
  publishedAt: '2026-08-09T10:00:00Z',
  retrievedAt: '2026-08-09T11:00:00Z',
};
const event = (overrides: Partial<CatalystEvent> = {}): CatalystEvent => ({
  id: 'event-1',
  symbol: 'SAC',
  title: 'Confirmed earnings release',
  category: 'earnings',
  scope: 'company',
  phase: 'recent',
  verification: 'confirmed',
  availability: 'available',
  occurredAt: '2026-08-08T12:00:00Z',
  risks: ['earnings'],
  dataStatus: 'REAL',
  provenance: [provenance],
  impact: assessCatalystImpact(
    {
      scope: 'company',
      dataStatus: 'REAL',
      verification: 'confirmed',
      direction: 'potentially-supportive',
      magnitude: 'high',
      timeHorizon: 'near-term',
      publishedAt: provenance.publishedAt,
    },
    now,
  ),
  ...overrides,
});

describe('catalyst and market context intelligence', () => {
  it('classifies upcoming, active, recent, and historical dates without inventing dates', () => {
    expect(classifyCatalystPhase('2026-08-10T12:00:00Z', now)).toBe('upcoming');
    expect(classifyCatalystPhase('2026-08-09T11:00:00Z', now)).toBe('active');
    expect(classifyCatalystPhase('2026-08-01T12:00:00Z', now)).toBe('recent');
    expect(classifyCatalystPhase('2026-01-01T12:00:00Z', now)).toBe('historical');
    expect(classifyCatalystPhase(undefined, now)).toBe('historical');
  });

  it('assesses impact deterministically with bounded confidence, freshness, and provenance-neutral language', () => {
    const impact = event().impact;
    expect(impact.direction).toBe('potentially-supportive');
    expect(impact.confidence).toBe(95);
    expect(impact.freshness).toBe('current');
    expect(impact.rationale[0]?.includes('will')).toBe(false);
  });

  it.each(['UNAVAILABLE', 'EMPTY', 'ERROR'] as const)(
    'does not infer an event impact for %s evidence',
    (dataStatus) => {
      const impact = assessCatalystImpact(
        {
          scope: 'company',
          dataStatus,
          verification: 'unknown',
          direction: 'potentially-supportive',
        },
        now,
      );
      expect(impact.direction).toBe('insufficient-evidence');
      expect(impact.confidence).toBeNull();
    },
  );

  it('preserves partial status and lowers confidence for unconfirmed stale evidence', () => {
    const impact = assessCatalystImpact(
      {
        scope: 'sector',
        dataStatus: 'PARTIAL',
        verification: 'unconfirmed',
        direction: 'mixed',
        publishedAt: '2025-01-01T00:00:00Z',
      },
      now,
    );
    expect(impact.dataQuality).toBe('PARTIAL');
    expect(impact.confidence).toBe(25);
  });

  it('enriches but never changes a quantitative score and detects technical/fundamental conflicts', () => {
    const adverse = event({ impact: { ...event().impact, direction: 'potentially-adverse' } });
    const feed: CatalystFeed = {
      symbol: 'SAC',
      events: [adverse],
      dataStatus: 'REAL',
      provenance: [provenance],
    };
    const context = buildOpportunityContext(feed, {
      fundamentalScore: 80,
      technicalScore: 75,
      classification: 'Bullish Opportunity',
    });
    expect(context.contextConflicts).toHaveLength(3);
    expect(context.catalystRisks[0]?.type).toBe('earnings');
    expect(context.provenance[0]).toEqual(provenance);
  });

  it('reports unavailable rather than silently falling back to demo data', async () => {
    const provider = createUnavailableCatalystProvider();
    const feed = await provider.getCatalysts('NONE');
    const market = await provider.getMarketContext();
    const sector = await provider.getSectorContext('Technology');
    expect(feed).toMatchObject({ events: [], dataStatus: 'UNAVAILABLE', provenance: [] });
    expect(market).toMatchObject({ majorEvents: [], dataStatus: 'UNAVAILABLE', confidence: null });
    expect(sector).toMatchObject({
      catalysts: [],
      dataStatus: 'UNAVAILABLE',
      sector: 'Technology',
    });
  });
});
