import type { OpportunityTimeframe, RankedOpportunity } from '@/features/opportunity-intelligence';

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
export type RiskClassification = `${'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'} Risk`;
export type RiskDataQuality =
  'REAL' | 'PARTIAL' | 'DEMO' | 'UNAVAILABLE' | 'ERROR' | 'MISSING' | 'STALE';
export type RiskTimeframe = OpportunityTimeframe;
export type RiskCategory =
  | 'market'
  | 'volatility'
  | 'liquidity'
  | 'technical'
  | 'fundamental'
  | 'catalyst'
  | 'momentum'
  | 'trend'
  | 'concentration'
  | 'event'
  | 'data-quality'
  | 'thesis-conflict';

export interface RiskProvenance {
  provider: string;
  source: string;
  observedAt?: string | null;
  retrievedAt?: string | null;
}

export interface RiskFactor {
  code: string;
  category: RiskCategory;
  /** Normalized risk, where 100 is highest risk. Null preserves unavailable evidence. */
  value: number | null;
  confidence: number | null;
  weight: number;
  dataQuality: RiskDataQuality;
  provenance: RiskProvenance[];
  missingInputs: string[];
  explanation: string;
}

export interface RiskComponent extends RiskFactor {
  classification: RiskClassification | null;
}

export interface RiskScenario {
  code: string;
  label: string;
  probability: number | null;
  impact: number | null;
  explanation: string;
}

export type RiskConflictSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export interface RiskConflict {
  code: string;
  severity: RiskConflictSeverity;
  involvedComponents: RiskCategory[];
  explanation: string;
  resolution: 'UNRESOLVED' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export type OpportunityRiskRelationship =
  `${'Strong' | 'Neutral' | 'Weak'} Opportunity / ${'Low' | 'Moderate' | 'High'} Risk`;
export type TradeReadinessState =
  | 'READY_FOR_RESEARCH'
  | 'WATCH'
  | 'CONDITIONAL'
  | 'INSUFFICIENT_DATA'
  | 'HIGH_RISK'
  | 'CONFLICTED'
  | 'NOT_READY';

export interface TradeReadinessAssessment {
  state: TradeReadinessState;
  relationship: OpportunityRiskRelationship | null;
  reasons: string[];
  missingInputs: string[];
  timeframeCompatible: boolean;
}

export interface PortfolioPreparationInput {
  existingExposure?: number | null;
  positionSize?: number | null;
  portfolioRiskLimit?: number | null;
  sectorExposure?: number | null;
  concentrationLimit?: number | null;
}

export interface PositionSizingInput extends PortfolioPreparationInput {
  accountEquity?: number | null;
  maximumRiskPercentage?: number | null;
  maximumRiskDollarAmount?: number | null;
  entryPrice?: number | null;
  stopPrice?: number | null;
  riskPerShare?: number | null;
  maximumPositionValue?: number | null;
  portfolioExposureLimit?: number | null;
}

export interface PositionSizingResult {
  status: 'COMPLETE' | 'INCOMPLETE' | 'INVALID';
  dollarRiskPerShare: number | null;
  maximumAllowedDollarRisk: number | null;
  suggestedMaximumShares: number | null;
  positionNotionalValue: number | null;
  positionExposurePercentage: number | null;
  estimatedLossAtStop: number | null;
  limitingConstraints: string[];
  warnings: string[];
  missingInputs: string[];
}

export interface RiskAssessment {
  symbol: string;
  timeframe: RiskTimeframe;
  score: number | null;
  classification: RiskClassification | null;
  confidence: number | null;
  dataQuality: RiskDataQuality;
  complete: boolean;
  components: RiskComponent[];
  conflicts: RiskConflict[];
  scenarios: RiskScenario[];
  relationship: OpportunityRiskRelationship | null;
  tradeReadiness: TradeReadinessAssessment;
  missingInputs: string[];
  provenance: RiskProvenance[];
  explanation: string;
  /** Reference to existing 2.4/2.5/2.6 output; no upstream score is recalculated. */
  opportunity: RankedOpportunity;
}

export interface RiskAssessmentInput {
  opportunity: RankedOpportunity;
  factors: RiskFactor[];
  scenarios?: RiskScenario[];
  requiredCategories?: RiskCategory[];
}
