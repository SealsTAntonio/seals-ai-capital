export type IntelligenceDataStatus =
  'REAL' | 'PARTIAL' | 'DEMO' | 'UNAVAILABLE' | 'EMPTY' | 'ERROR';

export type CatalystCategory =
  | 'earnings'
  | 'revenue-guidance'
  | 'company-filing'
  | 'corporate-action'
  | 'analyst-rating'
  | 'product-launch'
  | 'fda-regulatory'
  | 'merger-acquisition'
  | 'management-change'
  | 'share-offering-dilution'
  | 'buyback'
  | 'dividend'
  | 'split'
  | 'major-contract'
  | 'legal-regulatory'
  | 'company-announcement'
  | 'macro-economic'
  | 'sector-event'
  | 'market-wide';
export type CatalystPhase = 'upcoming' | 'active' | 'recent' | 'historical';
export type VerificationStatus = 'confirmed' | 'unconfirmed' | 'unknown';
export type AvailabilityStatus = 'available' | 'unavailable' | 'error';
export type CatalystDirection =
  'potentially-supportive' | 'potentially-adverse' | 'mixed' | 'unclear' | 'insufficient-evidence';
export type ImpactMagnitude = 'low' | 'moderate' | 'high' | 'unknown';
export type ImpactHorizon = 'immediate' | 'near-term' | 'medium-term' | 'long-term' | 'unknown';
export type ContextScope = 'company' | 'sector' | 'market';
export type CatalystRiskType =
  | 'earnings'
  | 'regulatory'
  | 'dilution'
  | 'litigation'
  | 'macro'
  | 'sector'
  | 'event-uncertainty'
  | 'data-uncertainty';

export interface IntelligenceProvenance {
  provider: string;
  sourceName: string;
  sourceUrl?: string | null;
  sourceId?: string | null;
  publishedAt?: string | null;
  retrievedAt: string;
}

export interface CatalystImpactAssessment {
  direction: CatalystDirection;
  magnitude: ImpactMagnitude;
  timeHorizon: ImpactHorizon;
  confidence: number | null;
  dataQuality: IntelligenceDataStatus;
  freshness: 'current' | 'stale' | 'unknown' | 'unavailable';
  scope: ContextScope;
  rationale: string[];
}

export interface CatalystEvent {
  id: string;
  symbol?: string | null;
  title: string;
  summary?: string | null;
  category: CatalystCategory;
  scope: ContextScope;
  phase: CatalystPhase;
  verification: VerificationStatus;
  availability: AvailabilityStatus;
  occurredAt?: string | null;
  expectedStart?: string | null;
  expectedEnd?: string | null;
  impact: CatalystImpactAssessment;
  risks: CatalystRiskType[];
  dataStatus: IntelligenceDataStatus;
  provenance: IntelligenceProvenance[];
}

export interface CatalystFeed {
  symbol?: string | null;
  events: CatalystEvent[];
  dataStatus: IntelligenceDataStatus;
  provenance: IntelligenceProvenance[];
  message?: string;
}

export interface MarketContext {
  broadTrend: 'bullish' | 'bearish' | 'sideways' | 'unknown';
  volatility: 'low' | 'normal' | 'elevated' | 'stressed' | 'unknown';
  riskRegime: 'risk-on' | 'risk-off' | 'mixed' | 'unknown';
  interestRateEnvironment: 'rising' | 'falling' | 'stable' | 'uncertain' | 'unknown';
  stress: 'none-observed' | 'elevated' | 'severe' | 'unknown';
  majorEvents: CatalystEvent[];
  dataStatus: IntelligenceDataStatus;
  confidence: number | null;
  provenance: IntelligenceProvenance[];
}

export interface SectorContext {
  sector: string;
  strength: 'strong' | 'neutral' | 'weak' | 'unknown';
  momentum: 'positive' | 'neutral' | 'negative' | 'unknown';
  trend: 'bullish' | 'bearish' | 'sideways' | 'unknown';
  risk: 'low' | 'moderate' | 'high' | 'unknown';
  catalystActivity: 'low' | 'moderate' | 'high' | 'unknown';
  conflicts: string[];
  catalysts: CatalystEvent[];
  dataStatus: IntelligenceDataStatus;
  confidence: number | null;
  provenance: IntelligenceProvenance[];
}

export interface CatalystRisk {
  type: CatalystRiskType;
  severity: 'low' | 'moderate' | 'high' | 'unknown';
  eventId?: string;
  explanation: string;
}

export interface OpportunityContext {
  catalystSummary: string;
  catalystDirection: CatalystDirection;
  catalystStrength: ImpactMagnitude;
  catalystConfidence: number | null;
  upcomingCatalystCount: number;
  recentCatalystCount: number;
  catalystRisks: CatalystRisk[];
  marketContext?: MarketContext;
  sectorContext?: SectorContext;
  eventTimeline: CatalystEvent[];
  contextConflicts: string[];
  contextWarnings: string[];
  missingInformation: string[];
  dataStatus: IntelligenceDataStatus;
  provenance: IntelligenceProvenance[];
}

export interface CatalystProvider {
  getCatalysts(symbol: string): Promise<CatalystFeed>;
  getMarketContext(): Promise<MarketContext>;
  getSectorContext(sector: string): Promise<SectorContext>;
}

export type CatalystAlertType =
  | 'new-catalyst'
  | 'date-approaching'
  | 'status-change'
  | 'material-update'
  | 'regulatory-event'
  | 'earnings-event'
  | 'guidance-change'
  | 'company-filing'
  | 'sector-event'
  | 'market-wide-event'
  | 'risk-increase'
  | 'catalyst-conflict';

export interface CatalystAlertEvent {
  id: string;
  type: CatalystAlertType;
  catalystId: string;
  symbol?: string | null;
  occurredAt: string;
  dataStatus: IntelligenceDataStatus;
  provenance: IntelligenceProvenance[];
}

export interface PortfolioContextSnapshot {
  symbol: string;
  events: CatalystEvent[];
  risks: CatalystRisk[];
  marketContext?: MarketContext;
  sectorContext?: SectorContext;
}
