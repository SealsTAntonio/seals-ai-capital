import type { OpportunityTimeframe, RankedOpportunity } from '@/features/opportunity-intelligence';
import type { RiskAssessment } from '@/features/risk-intelligence';

export type PortfolioDataQuality =
  'REAL' | 'PARTIAL' | 'DEMO' | 'UNAVAILABLE' | 'ERROR' | 'MISSING' | 'STALE';
export type PortfolioTimeframe = OpportunityTimeframe;
export type PortfolioDirection = 'LONG' | 'SHORT';
export type PortfolioAvailability = 'SUPPLIED' | 'DERIVED' | 'UNAVAILABLE' | 'INVALID';
export interface PortfolioProvenance {
  provider: string;
  source: string;
  observedAt?: string | null;
  retrievedAt?: string | null;
}
export interface PortfolioValue {
  value: number | null;
  availability: PortfolioAvailability;
  sourceInputs: string[];
}

export interface PortfolioPosition {
  symbol: string;
  direction: PortfolioDirection;
  quantity?: number | null;
  entryPrice?: number | null;
  referencePrice?: number | null;
  notionalValue?: number | null;
  weight?: number | null;
}
export interface PortfolioHolding extends PortfolioPosition {
  assetClass?: string | null;
  sector?: string | null;
  timeframe?: PortfolioTimeframe | null;
  catalystThemes?: string[];
  liquidityAvailable?: boolean | null;
  riskAssessment?: RiskAssessment | null;
  opportunity?: RankedOpportunity | null;
  confidence?: number | null;
  dataQuality: PortfolioDataQuality;
  provenance: PortfolioProvenance[];
}
export interface PortfolioSnapshot {
  id: string;
  asOf?: string | null;
  holdings: PortfolioHolding[];
  riskBudget?: number | null;
  targetAllocations?: Record<string, number> | null;
  correlation?: PortfolioCorrelation[] | null;
  dataQuality: PortfolioDataQuality;
  provenance: PortfolioProvenance[];
}
export interface PortfolioExposure {
  total: PortfolioValue;
  long: PortfolioValue;
  short: PortfolioValue;
  net: PortfolioValue;
  gross: PortfolioValue;
  positionWeights: Record<string, PortfolioValue>;
  sectorWeights: Record<string, PortfolioValue>;
  assetWeights: Record<string, PortfolioValue>;
  opportunityWeights: Record<string, PortfolioValue>;
  riskWeights: Record<string, PortfolioValue>;
  catalystWeights: Record<string, PortfolioValue>;
  timeframeWeights: Record<string, PortfolioValue>;
}
export type ConcentrationLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'INSUFFICIENT_DATA';
export interface PortfolioConcentration {
  overall: ConcentrationLevel;
  dimensions: Record<string, ConcentrationLevel>;
  largestWeights: Record<string, number | null>;
  explanation: string[];
}
export type DiversificationLevel =
  | 'WELL_DIVERSIFIED'
  | 'MODERATELY_DIVERSIFIED'
  | 'CONCENTRATED'
  | 'HIGHLY_CONCENTRATED'
  | 'INSUFFICIENT_DATA';
export interface PortfolioDiversification {
  classification: DiversificationLevel;
  dimensions: Record<string, DiversificationLevel>;
  correlationStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'INSUFFICIENT_DATA';
  explanation: string[];
}
export interface PortfolioCorrelation {
  symbolA: string;
  symbolB: string;
  coefficient: number;
  provenance: PortfolioProvenance[];
}
export interface PortfolioRiskBudget {
  status: 'AVAILABLE' | 'RISK_BUDGET_UNAVAILABLE' | 'INSUFFICIENT_DATA';
  budget: number | null;
  aggregateRisk: number | null;
  utilization: number | null;
  remainingCapacity: number | null;
  positionContributions: Record<string, number | null>;
  sectorContributions: Record<string, number | null>;
  concentrationRisk: number | null;
}
export interface PortfolioAllocation {
  current: Record<string, PortfolioValue>;
  targets: Record<string, number> | null;
  gaps: Record<string, PortfolioValue>;
  comparisonStatus: 'AVAILABLE' | 'UNAVAILABLE';
}
export type PortfolioFit =
  'STRONG_FIT' | 'ACCEPTABLE_FIT' | 'NEUTRAL' | 'WEAK_FIT' | 'CONFLICT' | 'INSUFFICIENT_DATA';
export interface PortfolioOpportunity {
  symbol: string;
  rank: number;
  opportunityScore: number | null;
  riskScore: number | null;
  catalystContext: string | null;
  existingExposure: number | null;
  concentrationImpact: ConcentrationLevel;
  diversificationImpact: 'IMPROVES' | 'NEUTRAL' | 'REDUCES' | 'UNAVAILABLE';
  catalystOverlap: boolean | null;
  timeframeOverlap: boolean | null;
  riskImpact: number | null;
  fit: PortfolioFit;
  explanation: string[];
}
export type PortfolioConflictSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export interface PortfolioConflict {
  code: string;
  severity: PortfolioConflictSeverity;
  affectedComponents: string[];
  explanation: string;
  evidence: string[];
  resolution: 'OPEN' | 'REVIEWED' | 'RESOLVED' | 'UNAVAILABLE';
}
export type PortfolioReadinessState =
  | 'READY_FOR_RESEARCH'
  | 'READY_FOR_PORTFOLIO_REVIEW'
  | 'WATCH'
  | 'CONDITIONAL'
  | 'INSUFFICIENT_DATA'
  | 'HIGH_RISK'
  | 'CONCENTRATED'
  | 'CONFLICTED'
  | 'NOT_READY';
export interface PortfolioReadiness {
  state: PortfolioReadinessState;
  reasons: string[];
}
export interface PortfolioAssessment {
  snapshot: PortfolioSnapshot;
  exposure: PortfolioExposure;
  allocation: PortfolioAllocation;
  concentration: PortfolioConcentration;
  diversification: PortfolioDiversification;
  riskBudget: PortfolioRiskBudget;
  opportunities: PortfolioOpportunity[];
  conflicts: PortfolioConflict[];
  readiness: PortfolioReadiness;
  dataQuality: PortfolioDataQuality;
  provenance: PortfolioProvenance[];
  missingInputs: string[];
  explanation: string;
}
export interface PortfolioAssessmentInput {
  snapshot: PortfolioSnapshot;
  opportunities?: RankedOpportunity[];
}
