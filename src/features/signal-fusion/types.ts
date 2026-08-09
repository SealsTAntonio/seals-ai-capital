import type { OpportunityTimeframe, RankedOpportunity } from '@/features/opportunity-intelligence';
import type { PortfolioAssessment, PortfolioOpportunity } from '@/features/portfolio-intelligence';
import type { RiskAssessment } from '@/features/risk-intelligence';

export type SignalComponentName =
  | 'COMPOSITE_SCORE'
  | 'OPPORTUNITY'
  | 'CATALYST'
  | 'RISK'
  | 'PORTFOLIO_FIT'
  | 'TECHNICAL_CONTEXT'
  | 'FUNDAMENTAL_CONTEXT';
export type SignalAvailability =
  'SUPPLIED' | 'DERIVED' | 'UNAVAILABLE' | 'STALE' | 'PARTIAL' | 'DEMO' | 'ERROR' | 'MISSING';
export type SignalAlignment =
  'ALIGNED' | 'MOSTLY_ALIGNED' | 'MIXED' | 'CONFLICTED' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
export type DecisionClassification =
  | 'HIGH_CONVICTION_RESEARCH'
  | 'SUPPORTIVE_RESEARCH'
  | 'WATCH'
  | 'CONDITIONAL_RESEARCH'
  | 'MIXED_SIGNAL'
  | 'HIGH_RISK'
  | 'CONFLICTED'
  | 'INSUFFICIENT_DATA'
  | 'UNAVAILABLE';
export type SignalTimeframe = OpportunityTimeframe;
export type ConflictSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type ResolutionStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'UNAVAILABLE';

export interface SignalProvenance {
  component: SignalComponentName;
  provider: string;
  source: string;
  observedAt?: string | null;
  retrievedAt?: string | null;
  status: SignalAvailability;
}
export interface SignalDataQuality {
  overall: SignalAvailability;
  byComponent: Partial<Record<SignalComponentName, SignalAvailability>>;
  staleComponents: SignalComponentName[];
  missingCriticalComponents: SignalComponentName[];
  issues: string[];
}
export interface SignalWeight {
  component: SignalComponentName;
  configured: number;
  applied: number;
  reason: string;
}
export interface SignalComponent {
  name: SignalComponentName;
  direction: 'SUPPORTIVE' | 'NEUTRAL' | 'OPPOSING' | 'UNAVAILABLE';
  strength: number | null;
  availability: SignalAvailability;
  timeframe: SignalTimeframe;
  evidence: string[];
  provenance: SignalProvenance[];
}
export interface SignalAgreement {
  code: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  involvedComponents: SignalComponentName[];
  explanation: string;
  evidence: string[];
  timeframe: SignalTimeframe;
  provenance: SignalProvenance[];
  resolution: ResolutionStatus;
}
export interface SignalConflict {
  code: string;
  severity: ConflictSeverity;
  affectedComponents: SignalComponentName[];
  explanation: string;
  evidence: string[];
  timeframe: SignalTimeframe;
  dataQuality: SignalAvailability;
  resolution: ResolutionStatus;
}
export interface DecisionConfidence {
  score: number | null;
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'UNAVAILABLE';
  factors: { code: string; impact: number; explanation: string }[];
}
export interface SignalReadiness {
  state: 'READY_FOR_RESEARCH' | 'CONDITIONAL' | 'WATCH' | 'NOT_READY' | 'INSUFFICIENT_DATA';
  reasons: string[];
  executableInstruction: false;
}
export interface TimeframeSignal {
  timeframe: SignalTimeframe;
  direction: 'SUPPORTIVE' | 'NEUTRAL' | 'OPPOSING';
  source: string;
}
export interface DecisionContext {
  opportunity: RankedOpportunity;
  risk?: RiskAssessment | null;
  portfolio?: PortfolioAssessment | null;
  portfolioFit?: PortfolioOpportunity | null;
  timeframeSignals?: TimeframeSignal[];
}
export interface SignalFusionConfig {
  weights?: Partial<Record<SignalComponentName, number>>;
  criticalComponents?: SignalComponentName[];
}
export interface SignalFusionAssessment {
  symbol: string;
  classification: DecisionClassification;
  confidence: DecisionConfidence;
  timeframe: SignalTimeframe;
  alignment: SignalAlignment;
  compositeScoreReference: number | null;
  opportunityAssessment: RankedOpportunity;
  catalystAssessment: RankedOpportunity['context'] | null;
  riskAssessment: RiskAssessment | null;
  portfolioFitAssessment: PortfolioOpportunity | null;
  components: SignalComponent[];
  weights: SignalWeight[];
  agreements: SignalAgreement[];
  conflicts: SignalConflict[];
  dominantSupportingFactors: string[];
  dominantOpposingFactors: string[];
  dataQuality: SignalDataQuality;
  readiness: SignalReadiness;
  provenance: SignalProvenance[];
  explanation: string;
  unresolvedIssues: string[];
  methodology: string;
}

export class SignalFusionValidationError extends Error {
  readonly name = 'SignalFusionValidationError';
}
