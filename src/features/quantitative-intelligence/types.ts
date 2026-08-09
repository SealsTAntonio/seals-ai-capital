import type { FundamentalSnapshot } from '@/features/fundamentals';
import type { TechnicalAnalysis } from '@/features/technical-analysis';

export type QuantitativeDataStatus = 'real' | 'partial' | 'demo' | 'unavailable' | 'error';
export type QuantitativeComponentName =
  'fundamental' | 'technical' | 'momentum' | 'trend' | 'volume' | 'risk' | 'valuation' | 'quality';
export type QuantitativeClassification =
  'Exceptional' | 'Strong' | 'Constructive' | 'Neutral' | 'Weak' | 'High Risk / Weak';
export type SignalDirection = 'bullish' | 'bearish' | 'neutral';

export type QuantitativeWeights = Record<QuantitativeComponentName, number>;

export interface QuantitativeInput {
  symbol: string;
  fundamental: FundamentalSnapshot | null;
  technical: TechnicalAnalysis | null;
  errors?: { fundamental?: string; technical?: string };
}

export interface ScoreFactor {
  id: string;
  label: string;
  direction: SignalDirection;
  explanation: string;
}

export interface QuantitativeScoreComponent {
  name: QuantitativeComponentName;
  score: number | null;
  weight: number;
  effectiveWeight: number;
  contribution: number | null;
  positiveFactors: ScoreFactor[];
  negativeFactors: ScoreFactor[];
  neutralFactors: ScoreFactor[];
  missingInputs: string[];
  dataStatus: QuantitativeDataStatus;
  provenance: string[];
  confidence: number;
}

export interface SignalConflict {
  code: string;
  severity: 'info' | 'warning';
  components: QuantitativeComponentName[];
  explanation: string;
}

export interface QuantitativeAssessment {
  symbol: string;
  score: number | null;
  classification: QuantitativeClassification | 'Unavailable';
  components: QuantitativeScoreComponent[];
  bullishFactors: ScoreFactor[];
  bearishFactors: ScoreFactor[];
  neutralFactors: ScoreFactor[];
  conflicts: SignalConflict[];
  riskFlags: ScoreFactor[];
  missingData: string[];
  dataStatus: QuantitativeDataStatus;
  confidence: number;
  incomplete: boolean;
  methodology: string;
}

/** Provider-neutral input boundary. Implementations normalize into existing SAC domains. */
export interface QuantitativeSignalProvider {
  readonly name: string;
  getInputs(symbol: string): Promise<QuantitativeInput>;
}

export interface QuantitativeIntelligenceService {
  assess(input: QuantitativeInput, weights?: Partial<QuantitativeWeights>): QuantitativeAssessment;
  analyze(symbol: string, weights?: Partial<QuantitativeWeights>): Promise<QuantitativeAssessment>;
}
