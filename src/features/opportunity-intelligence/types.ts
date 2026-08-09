import type {
  CatalystFeed,
  MarketContext,
  OpportunityContext,
  SectorContext,
} from '@/features/catalyst-intelligence';
import type {
  QuantitativeAssessment,
  QuantitativeComponentName,
  QuantitativeDataStatus,
  SignalConflict,
} from '@/features/quantitative-intelligence';

export type OpportunityTimeframe =
  'intraday' | 'short-term' | 'swing' | 'medium-term' | 'long-term';
export type OpportunityClassification =
  | 'Strong Bullish Opportunity'
  | 'Bullish Opportunity'
  | 'Constructive Setup'
  | 'Neutral / Watch'
  | 'Weak Setup'
  | 'Bearish Opportunity'
  | 'High-Risk / Avoid'
  | 'Incomplete Assessment';
export type OpportunityDataStatus = 'REAL' | 'PARTIAL' | 'DEMO' | 'UNAVAILABLE' | 'EMPTY' | 'ERROR';
export type SignalAgreementKind =
  | 'confirmed-strength'
  | 'confirmed-weakness'
  | 'fundamental-technical-conflict'
  | 'momentum-driven-risk'
  | 'high-risk-technical-setup'
  | 'mixed'
  | 'incomplete';

export interface OpportunityCandidate {
  assessment: QuantitativeAssessment;
  companyName?: string | null;
  requestedTimeframe: OpportunityTimeframe;
  /** Timeframes explicitly supported by the upstream history. Never inferred from a score. */
  supportedTimeframes: OpportunityTimeframe[];
  catalystAvailable?: boolean | null;
  historyAvailable?: boolean;
  assessedAt?: string | null;
  sourceFreshness?: 'current' | 'stale' | 'unknown';
  /** Optional provider-normalized context; absence never creates synthetic events. */
  catalystFeed?: CatalystFeed;
  marketContext?: MarketContext;
  sectorContext?: SectorContext;
}

export interface OpportunityConflict extends SignalConflict {
  impact: 'reduces-confidence' | 'informational';
}

export interface SignalAgreement {
  kind: SignalAgreementKind;
  label: string;
  agreedComponents: QuantitativeComponentName[];
  conflicts: OpportunityConflict[];
  score: number | null;
}

export interface OpportunityConfidence {
  score: number | null;
  label: 'high' | 'moderate' | 'low' | 'unavailable';
  completeness: number;
  validComponents: number;
  totalComponents: number;
  reasons: string[];
}

export interface RankedOpportunity {
  rank: number;
  symbol: string;
  companyName: string | null;
  compositeScore: number | null;
  classification: OpportunityClassification;
  confidence: OpportunityConfidence;
  timeframe: OpportunityTimeframe;
  timeframeSupported: boolean;
  fundamentalScore: number | null;
  technicalScore: number | null;
  momentumScore: number | null;
  trendScore: number | null;
  volumeScore: number | null;
  riskScore: number | null;
  valuationScore: number | null;
  qualityScore: number | null;
  signalAgreement: SignalAgreement;
  conflicts: OpportunityConflict[];
  strengths: string[];
  weaknesses: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  warnings: string[];
  missingInformation: string[];
  catalystAvailable: boolean | null;
  dataStatus: OpportunityDataStatus;
  provenance: string[];
  explanation: string;
  /** Sprint 2.6 enrichment. Optional to preserve Sprint 2.5 consumers. */
  context?: OpportunityContext;
}

export interface OpportunityRankingOptions {
  timeframe: OpportunityTimeframe;
}

export interface OpportunityRankingService {
  rank(candidates: OpportunityCandidate[], options: OpportunityRankingOptions): RankedOpportunity[];
}

export interface WatchlistOpportunityInput {
  symbol: string;
  displayName: string | null;
  assessment: QuantitativeAssessment;
  supportedTimeframes: OpportunityTimeframe[];
  catalystFeed?: CatalystFeed;
  marketContext?: MarketContext;
  sectorContext?: SectorContext;
}

export interface PortfolioOpportunitySnapshot {
  symbol: string;
  classification: OpportunityClassification;
  compositeScore: number | null;
  confidence: number | null;
  timeframe: OpportunityTimeframe;
  dataStatus: OpportunityDataStatus;
}

export type OpportunityEventType =
  | 'score-changed'
  | 'classification-changed'
  | 'momentum-changed'
  | 'trend-changed'
  | 'conflict-changed'
  | 'risk-changed'
  | 'confidence-changed';

export interface OpportunitySignalEvent {
  id: string;
  type: OpportunityEventType;
  symbol: string;
  timeframe: OpportunityTimeframe;
  occurredAt: string;
  previousValue: number | string | null;
  currentValue: number | string | null;
  dataStatus: OpportunityDataStatus;
  provenance: string[];
}

export const opportunityStatus = (status: QuantitativeDataStatus): OpportunityDataStatus =>
  status.toUpperCase() as OpportunityDataStatus;
