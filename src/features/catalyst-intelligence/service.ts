import type {
  CatalystDirection,
  CatalystEvent,
  CatalystFeed,
  CatalystImpactAssessment,
  CatalystProvider,
  IntelligenceDataStatus,
  MarketContext,
  OpportunityContext,
  SectorContext,
} from './types';

const validDate = (value?: string | null) =>
  value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;

export function classifyCatalystPhase(
  eventTime: string | null | undefined,
  now = new Date(),
): CatalystEvent['phase'] {
  const time = validDate(eventTime);
  if (time === null) return 'historical';
  const age = now.getTime() - time;
  if (age < 0) return 'upcoming';
  if (age <= 24 * 60 * 60 * 1000) return 'active';
  if (age <= 30 * 24 * 60 * 60 * 1000) return 'recent';
  return 'historical';
}

export function assessCatalystImpact(
  event: {
    scope: CatalystEvent['scope'];
    dataStatus: IntelligenceDataStatus;
    verification: CatalystEvent['verification'];
    direction?: CatalystDirection;
    magnitude?: CatalystImpactAssessment['magnitude'];
    timeHorizon?: CatalystImpactAssessment['timeHorizon'];
    publishedAt?: string | null;
  },
  now = new Date(),
): CatalystImpactAssessment {
  const unavailable = ['UNAVAILABLE', 'EMPTY', 'ERROR'].includes(event.dataStatus);
  const published = validDate(event.publishedAt);
  const age = published === null ? null : now.getTime() - published;
  const freshness = unavailable
    ? 'unavailable'
    : age === null
      ? 'unknown'
      : age <= 7 * 86_400_000
        ? 'current'
        : 'stale';
  const confidence = unavailable
    ? null
    : Math.max(
        0,
        Math.min(
          100,
          (event.dataStatus === 'REAL' ? 80 : event.dataStatus === 'PARTIAL' ? 55 : 30) +
            (event.verification === 'confirmed'
              ? 15
              : event.verification === 'unconfirmed'
                ? -15
                : 0) +
            (freshness === 'stale' ? -15 : freshness === 'unknown' ? -10 : 0),
        ),
      );
  return {
    direction: unavailable ? 'insufficient-evidence' : (event.direction ?? 'unclear'),
    magnitude: unavailable ? 'unknown' : (event.magnitude ?? 'unknown'),
    timeHorizon: unavailable ? 'unknown' : (event.timeHorizon ?? 'unknown'),
    confidence,
    dataQuality: event.dataStatus,
    freshness,
    scope: event.scope,
    rationale: unavailable
      ? ['Trusted catalyst evidence is unavailable; no impact was inferred.']
      : ['Assessment reflects supplied event attributes and does not predict price movement.'],
  };
}

export const unavailableCatalystFeed = (
  symbol?: string,
  message = 'No trusted catalyst provider is configured.',
): CatalystFeed => ({
  symbol,
  events: [],
  dataStatus: 'UNAVAILABLE',
  provenance: [],
  message,
});

export const createUnavailableCatalystProvider = (): CatalystProvider => ({
  async getCatalysts(symbol) {
    return unavailableCatalystFeed(symbol);
  },
  async getMarketContext() {
    return unavailableMarketContext();
  },
  async getSectorContext(sector) {
    return unavailableSectorContext(sector);
  },
});

export const unavailableMarketContext = (): MarketContext => ({
  broadTrend: 'unknown',
  volatility: 'unknown',
  riskRegime: 'unknown',
  interestRateEnvironment: 'unknown',
  stress: 'unknown',
  majorEvents: [],
  dataStatus: 'UNAVAILABLE',
  confidence: null,
  provenance: [],
});

export const unavailableSectorContext = (sector: string): SectorContext => ({
  sector,
  strength: 'unknown',
  momentum: 'unknown',
  trend: 'unknown',
  risk: 'unknown',
  catalystActivity: 'unknown',
  conflicts: [],
  catalysts: [],
  dataStatus: 'UNAVAILABLE',
  confidence: null,
  provenance: [],
});

const overallDirection = (events: CatalystEvent[]): CatalystDirection => {
  const directions = new Set(events.map((event) => event.impact.direction));
  if (!events.length) return 'insufficient-evidence';
  if (directions.size > 1) return 'mixed';
  return events[0]!.impact.direction;
};

export function buildOpportunityContext(
  feed: CatalystFeed,
  signals: {
    fundamentalScore: number | null;
    technicalScore: number | null;
    classification: string;
  },
  marketContext?: MarketContext,
  sectorContext?: SectorContext,
): OpportunityContext {
  const events = [...feed.events].sort((a, b) =>
    (a.occurredAt ?? a.expectedStart ?? '').localeCompare(b.occurredAt ?? b.expectedStart ?? ''),
  );
  const direction = overallDirection(events);
  const conflicts: string[] = [];
  const positive = direction === 'potentially-supportive';
  const negative = direction === 'potentially-adverse';
  if ((signals.technicalScore ?? 0) >= 70 && negative)
    conflicts.push('Strong technical evidence conflicts with a potentially adverse catalyst.');
  if ((signals.fundamentalScore ?? 0) >= 70 && negative)
    conflicts.push('Strong fundamental evidence conflicts with a potentially adverse catalyst.');
  if (signals.classification.includes('Bullish') && negative)
    conflicts.push('Bullish quantitative classification conflicts with catalyst context.');
  if (signals.classification.includes('Bearish') && positive)
    conflicts.push(
      'Bearish quantitative classification conflicts with potentially supportive context.',
    );
  const confidences = events.map((e) => e.impact.confidence).filter((v): v is number => v !== null);
  const provenance = [...feed.provenance, ...events.flatMap((event) => event.provenance)];
  return {
    catalystSummary: events.length
      ? `${events.length} trusted catalyst event(s); direction is ${direction}.`
      : 'Catalyst information is unavailable; no events were inferred.',
    catalystDirection: direction,
    catalystStrength: events.some((e) => e.impact.magnitude === 'high')
      ? 'high'
      : events.some((e) => e.impact.magnitude === 'moderate')
        ? 'moderate'
        : events.length
          ? 'low'
          : 'unknown',
    catalystConfidence: confidences.length
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : null,
    upcomingCatalystCount: events.filter((e) => e.phase === 'upcoming').length,
    recentCatalystCount: events.filter((e) => e.phase === 'recent').length,
    catalystRisks: events.flatMap((event) =>
      event.risks.map((type) => ({
        type,
        severity: event.impact.magnitude,
        eventId: event.id,
        explanation: `${event.title}: ${type} risk.`,
      })),
    ),
    marketContext,
    sectorContext,
    eventTimeline: events,
    contextConflicts: conflicts,
    contextWarnings:
      feed.dataStatus === 'DEMO'
        ? ['Catalyst data is explicitly DEMO.']
        : feed.dataStatus === 'PARTIAL'
          ? ['Catalyst evidence is partial.']
          : [],
    missingInformation:
      feed.dataStatus === 'UNAVAILABLE' ? [feed.message ?? 'Catalyst data unavailable.'] : [],
    dataStatus: feed.dataStatus,
    provenance,
  };
}
