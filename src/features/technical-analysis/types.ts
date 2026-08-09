export const TECHNICAL_TIMEFRAMES = [
  '1m',
  '5m',
  '15m',
  '30m',
  '1h',
  '4h',
  '1D',
  '1W',
  '1M',
] as const;
export type Timeframe = (typeof TECHNICAL_TIMEFRAMES)[number];
export type TechnicalDataStatus = 'real' | 'partial' | 'demo' | 'unavailable' | 'error';
export type TechnicalClassification = 'bullish' | 'bearish' | 'neutral';
export type TrendState = 'uptrend' | 'downtrend' | 'sideways' | 'unavailable';
export type Availability = 'available' | 'insufficient-data' | 'unavailable';

export interface OhlcvCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
export interface HistoricalPriceSeries {
  symbol: string;
  exchange: string | null;
  timeframe: Timeframe;
  candles: OhlcvCandle[];
}
export interface DataProvenance {
  status: TechnicalDataStatus;
  provider: string;
  source: string;
  retrievedAt: string;
  freshness: 'current' | 'stale' | 'unknown';
  symbol: string;
  timeframe: Timeframe;
  error: { code: string; message: string } | null;
}
export interface Calculation<T> {
  status: Availability;
  value: T | null;
  requiredLookback: number;
  explanation?: string;
}
export interface IndicatorSummary {
  name: string;
  status: Availability;
  value: number | null;
  detail: string;
}
export interface ScoreComponent {
  name: 'trend' | 'momentum' | 'volume' | 'volatility' | 'supportResistance';
  score: number;
  weight: number;
  available: boolean;
  reason: string;
}
export interface TechnicalScore {
  value: number | null;
  classification: TechnicalClassification;
  components: ScoreComponent[];
  explanation: string;
}
export interface TechnicalAnalysis {
  series: HistoricalPriceSeries | null;
  provenance: DataProvenance;
  trend: TrendState;
  momentum: number | null;
  volatility: number | null;
  volumeCondition: 'above-average' | 'below-average' | 'average' | 'unavailable';
  support: number | null;
  resistance: number | null;
  indicators: IndicatorSummary[];
  score: TechnicalScore;
}
export interface MarketDataProvider {
  readonly name: string;
  getHistoricalSeries(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<{ series: HistoricalPriceSeries | null; provenance: DataProvenance }>;
}
export interface TechnicalAnalysisService {
  analyze(symbol: string, timeframe: Timeframe): Promise<TechnicalAnalysis>;
}
