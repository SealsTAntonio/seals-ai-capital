import type {
  FundamentalAnalysisService,
  FundamentalMetric,
  FundamentalMetricKey,
  FundamentalMetrics,
  FundamentalResponse,
  FundamentalSnapshot,
} from './types';

const keys: FundamentalMetricKey[] = [
  'marketCapitalization',
  'revenue',
  'revenueGrowth',
  'grossProfit',
  'grossMargin',
  'operatingIncome',
  'operatingMargin',
  'netIncome',
  'netProfitMargin',
  'eps',
  'epsGrowth',
  'freeCashFlow',
  'freeCashFlowGrowth',
  'freeCashFlowMargin',
  'operatingCashFlow',
  'totalCash',
  'totalDebt',
  'netDebt',
  'debtToEquity',
  'currentRatio',
  'returnOnEquity',
  'returnOnInvestedCapital',
  'sharesOutstanding',
  'dilutedShares',
  'bookValue',
  'bookValuePerShare',
  'cashFlowPerShare',
  'priceToEarnings',
  'forwardPriceToEarnings',
  'priceToSales',
  'priceToBook',
  'enterpriseValueToEbitda',
  'enterpriseValue',
  'dividendPerShare',
  'dividendYield',
  'cashFlowYield',
];
const units: Partial<Record<FundamentalMetricKey, FundamentalMetric['unit']>> = {
  revenueGrowth: 'percent',
  grossMargin: 'percent',
  operatingMargin: 'percent',
  netProfitMargin: 'percent',
  epsGrowth: 'percent',
  freeCashFlowGrowth: 'percent',
  freeCashFlowMargin: 'percent',
  returnOnEquity: 'percent',
  returnOnInvestedCapital: 'percent',
  dividendYield: 'percent',
  cashFlowYield: 'percent',
  eps: 'per-share',
  bookValuePerShare: 'per-share',
  cashFlowPerShare: 'per-share',
  dividendPerShare: 'per-share',
  sharesOutstanding: 'shares',
  dilutedShares: 'shares',
  debtToEquity: 'ratio',
  currentRatio: 'ratio',
  priceToEarnings: 'multiple',
  forwardPriceToEarnings: 'multiple',
  priceToSales: 'multiple',
  priceToBook: 'multiple',
  enterpriseValueToEbitda: 'multiple',
};
const metric = (key: FundamentalMetricKey): FundamentalMetric => ({
  value: null,
  unit: units[key] ?? 'currency',
  classification: 'unavailable',
  illustrative: true,
  source: 'SAC Demo Scenario',
  asOf: null,
});
const build = (symbol: string): FundamentalSnapshot => {
  const metrics = Object.fromEntries(keys.map((key) => [key, metric(key)])) as FundamentalMetrics;
  const fetchedAt = new Date().toISOString();
  return {
    company: {
      name: `${symbol} illustrative company`,
      ticker: symbol,
      exchange: null,
      sector: null,
      industry: null,
    },
    period: {
      fiscalYear: new Date().getUTCFullYear(),
      fiscalQuarter: null,
      frequency: 'annual',
      reportingPeriodStart: null,
      reportingPeriodEnd: null,
    },
    metrics,
    history: [],
    scoreInputs: [
      ['growth', ['revenueGrowth', 'epsGrowth', 'freeCashFlowGrowth']],
      [
        'profitability',
        [
          'grossMargin',
          'operatingMargin',
          'netProfitMargin',
          'returnOnEquity',
          'returnOnInvestedCapital',
        ],
      ],
      ['cashFlow', ['operatingCashFlow', 'freeCashFlow', 'cashFlowYield']],
      [
        'balanceSheetStrength',
        ['totalCash', 'totalDebt', 'netDebt', 'debtToEquity', 'currentRatio'],
      ],
      ['valuation', ['priceToEarnings', 'priceToSales', 'priceToBook', 'enterpriseValueToEbitda']],
      ['shareholderReturns', ['dividendYield', 'epsGrowth']],
    ].map(([category, metricKeys]) => ({
      category,
      label: String(category),
      weight: 1 / 6,
      metricKeys: metricKeys as FundamentalMetricKey[],
      value: null,
      status: 'unavailable',
    })) as FundamentalSnapshot['scoreInputs'],
    source: 'SAC Demo Scenario — no financial provider',
    environment: 'demo',
    dataStatus: 'unavailable',
    fetchedAt,
    staleAfter: new Date(Date.now() + 300000).toISOString(),
    disclaimer:
      'DEMO / ILLUSTRATIVE FOUNDATION. No live or actual company financial data is supplied.',
    availability: Object.fromEntries(keys.map((key) => [key, false])) as Record<
      FundamentalMetricKey,
      boolean
    >,
  };
};
const response = <T>(data: T): FundamentalResponse<T> => ({
  data,
  status: 'success',
  source: 'SAC Demo Scenario',
  environment: 'demo',
  fetchedAt: new Date().toISOString(),
  staleAfter: new Date(Date.now() + 300000).toISOString(),
});
const summary = async (symbol: string) => response(build(symbol.trim().toUpperCase()));
export const demoFundamentalAnalysisService: FundamentalAnalysisService = {
  getCompanyOverview: summary,
  getFundamentalSummary: summary,
  async getIncomeStatement(s) {
    const x = build(s);
    return response({ company: x.company, period: x.period, metrics: x.metrics });
  },
  async getBalanceSheet(s) {
    const x = build(s);
    return response({ company: x.company, period: x.period, metrics: x.metrics });
  },
  async getCashFlow(s) {
    const x = build(s);
    return response({ company: x.company, period: x.period, metrics: x.metrics });
  },
  async getProfitabilityMetrics(s) {
    return response(build(s).metrics);
  },
  async getGrowthMetrics(s) {
    return response(build(s).metrics);
  },
  async getValuationMetrics(s) {
    return response(build(s).metrics);
  },
  async getFinancialHealthMetrics(s) {
    return response(build(s).metrics);
  },
  async getHistoricalFundamentals() {
    return response([]);
  },
  async getFundamentalScoreInputs(s) {
    return response(build(s).scoreInputs);
  },
};
