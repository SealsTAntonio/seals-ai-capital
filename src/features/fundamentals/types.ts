export type DataClassification = 'available' | 'unavailable' | 'estimated' | 'historical';
export type DataEnvironment = 'demo' | 'real';
export type FundamentalDataStatus = 'populated' | 'partial' | 'empty' | 'unavailable';
export type FundamentalFrequency = 'annual' | 'quarterly';

export interface FundamentalMetric {
  value: number | null;
  unit: 'currency' | 'percent' | 'ratio' | 'per-share' | 'shares' | 'multiple';
  classification: DataClassification;
  illustrative: boolean;
  source: string;
  asOf: string | null;
}

export interface FiscalPeriod {
  fiscalYear: number;
  fiscalQuarter: 1 | 2 | 3 | 4 | null;
  frequency: FundamentalFrequency;
  reportingPeriodStart: string | null;
  reportingPeriodEnd: string | null;
}

export interface CompanyIdentity {
  name: string;
  ticker: string;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  cik: string | null;
}

export type FundamentalMetricKey =
  | 'marketCapitalization'
  | 'revenue'
  | 'revenueGrowth'
  | 'grossProfit'
  | 'grossMargin'
  | 'operatingIncome'
  | 'operatingMargin'
  | 'netIncome'
  | 'netProfitMargin'
  | 'eps'
  | 'epsGrowth'
  | 'freeCashFlow'
  | 'freeCashFlowGrowth'
  | 'freeCashFlowMargin'
  | 'operatingCashFlow'
  | 'capitalExpenditures'
  | 'totalCash'
  | 'totalAssets'
  | 'totalLiabilities'
  | 'shareholdersEquity'
  | 'totalDebt'
  | 'netDebt'
  | 'debtToEquity'
  | 'currentRatio'
  | 'returnOnEquity'
  | 'returnOnInvestedCapital'
  | 'sharesOutstanding'
  | 'dilutedShares'
  | 'bookValue'
  | 'bookValuePerShare'
  | 'cashFlowPerShare'
  | 'priceToEarnings'
  | 'forwardPriceToEarnings'
  | 'priceToSales'
  | 'priceToBook'
  | 'enterpriseValueToEbitda'
  | 'enterpriseValue'
  | 'dividendPerShare'
  | 'dividendYield'
  | 'cashFlowYield';

export type FundamentalMetrics = Record<FundamentalMetricKey, FundamentalMetric>;
export interface HistoricalFundamentals extends FiscalPeriod {
  metrics: Pick<
    FundamentalMetrics,
    | 'revenue'
    | 'eps'
    | 'grossMargin'
    | 'operatingMargin'
    | 'netProfitMargin'
    | 'freeCashFlow'
    | 'totalDebt'
    | 'totalCash'
  >;
  yearOverYearAvailable: boolean;
  sequentialComparisonAvailable: boolean;
}
export type ScoreCategory =
  | 'growth'
  | 'profitability'
  | 'cashFlow'
  | 'balanceSheetStrength'
  | 'valuation'
  | 'shareholderReturns';
export interface ScoreInput {
  category: ScoreCategory;
  label: string;
  weight: number;
  metricKeys: FundamentalMetricKey[];
  value: number | null;
  status: 'foundation' | 'unavailable';
}
export interface FundamentalSnapshot {
  company: CompanyIdentity;
  period: FiscalPeriod;
  metrics: FundamentalMetrics;
  history: HistoricalFundamentals[];
  scoreInputs: ScoreInput[];
  source: string;
  environment: DataEnvironment;
  dataStatus: FundamentalDataStatus;
  sourceUrl: string | null;
  providerName: string;
  filingDate: string | null;
  formType: string | null;
  fetchedAt: string;
  staleAfter: string;
  disclaimer: string;
  availability: Record<FundamentalMetricKey, boolean>;
}
export interface FundamentalResponse<T> {
  data: T | null;
  status: 'success' | 'empty';
  source: string;
  fetchedAt: string;
  staleAfter: string;
  environment: DataEnvironment;
}
export type StatementData = Pick<FundamentalSnapshot, 'company' | 'period' | 'metrics'>;

export interface FundamentalAnalysisService {
  getCompanyOverview(symbol: string): Promise<FundamentalResponse<FundamentalSnapshot>>;
  getIncomeStatement(symbol: string): Promise<FundamentalResponse<StatementData>>;
  getBalanceSheet(symbol: string): Promise<FundamentalResponse<StatementData>>;
  getCashFlow(symbol: string): Promise<FundamentalResponse<StatementData>>;
  getProfitabilityMetrics(symbol: string): Promise<FundamentalResponse<FundamentalMetrics>>;
  getGrowthMetrics(symbol: string): Promise<FundamentalResponse<FundamentalMetrics>>;
  getValuationMetrics(symbol: string): Promise<FundamentalResponse<FundamentalMetrics>>;
  getFinancialHealthMetrics(symbol: string): Promise<FundamentalResponse<FundamentalMetrics>>;
  getHistoricalFundamentals(
    symbol: string,
    frequency: FundamentalFrequency,
  ): Promise<FundamentalResponse<HistoricalFundamentals[]>>;
  getFundamentalSummary(symbol: string): Promise<FundamentalResponse<FundamentalSnapshot>>;
  getFundamentalScoreInputs(symbol: string): Promise<FundamentalResponse<ScoreInput[]>>;
}

/** Provider adapter contract. Provider payloads must be normalized before crossing this boundary. */
export interface FundamentalDataProvider {
  readonly name: string;
  getSnapshot(symbol: string): Promise<FundamentalSnapshot | null>;
}

export class FundamentalDataError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid-symbol' | 'network' | 'rate-limited' | 'unavailable' | 'source-error',
  ) {
    super(message);
    this.name = 'FundamentalDataError';
  }
}
