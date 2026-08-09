import {
  calculateCashFlowYield,
  calculateDebtToEquity,
  calculateFreeCashFlowMargin,
  calculateGrossMargin,
  calculateGrowth,
  calculateNetDebt,
  calculateNetMargin,
  calculateOperatingMargin,
  calculateRoe,
  calculatedMetric,
} from './calculations';
import type {
  FundamentalDataProvider,
  FundamentalMetric,
  FundamentalMetricKey,
  FundamentalMetrics,
  FundamentalSnapshot,
  HistoricalFundamentals,
} from './types';
import { FundamentalDataError } from './types';

const SEC_ORIGIN = 'https://data.sec.gov';
const COMPANY_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const CACHE_MS = 15 * 60 * 1000;
const TICKER_CACHE_MS = 24 * 60 * 60 * 1000;

type SecTicker = { cik_str: number; ticker: string; title: string };
type SecFact = {
  end?: string;
  filed?: string;
  form?: string;
  fp?: string;
  frame?: string;
  fy?: number;
  start?: string;
  val?: number;
};
type SecConcept = { units?: Record<string, SecFact[]> };
type SecCompanyFacts = {
  cik: number;
  entityName: string;
  facts?: { 'us-gaap'?: Record<string, SecConcept>; dei?: Record<string, SecConcept> };
};

type FilingValue = { value: number; fact: SecFact };
type PeriodValues = {
  end: string;
  start: string | null;
  fiscalYear: number;
  fiscalQuarter: 1 | 2 | 3 | 4 | null;
  filingDate: string;
  formType: string;
  values: Partial<Record<RawKey, number>>;
};

type RawKey =
  | 'revenue'
  | 'grossProfit'
  | 'operatingIncome'
  | 'netIncome'
  | 'eps'
  | 'assets'
  | 'liabilities'
  | 'equity'
  | 'cash'
  | 'debt'
  | 'operatingCashFlow'
  | 'capitalExpenditures'
  | 'shares';

const concepts: Record<RawKey, { names: string[]; units: string[] }> = {
  revenue: {
    names: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet'],
    units: ['USD'],
  },
  grossProfit: { names: ['GrossProfit'], units: ['USD'] },
  operatingIncome: { names: ['OperatingIncomeLoss'], units: ['USD'] },
  netIncome: { names: ['NetIncomeLoss', 'ProfitLoss'], units: ['USD'] },
  eps: { names: ['EarningsPerShareDiluted', 'EarningsPerShareBasic'], units: ['USD/shares'] },
  assets: { names: ['Assets'], units: ['USD'] },
  liabilities: { names: ['Liabilities'], units: ['USD'] },
  equity: {
    names: [
      'StockholdersEquity',
      'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
    ],
    units: ['USD'],
  },
  cash: {
    names: [
      'CashAndCashEquivalentsAtCarryingValue',
      'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents',
    ],
    units: ['USD'],
  },
  debt: {
    names: ['LongTermDebt', 'LongTermDebtAndFinanceLeaseObligations', 'LongTermDebtNoncurrent'],
    units: ['USD'],
  },
  operatingCashFlow: { names: ['NetCashProvidedByUsedInOperatingActivities'], units: ['USD'] },
  capitalExpenditures: {
    names: [
      'PaymentsToAcquirePropertyPlantAndEquipment',
      'PaymentsForAdditionsToPropertyPlantAndEquipment',
    ],
    units: ['USD'],
  },
  shares: { names: ['CommonStockSharesOutstanding'], units: ['shares'] },
};

let tickerCache: { expires: number; values: Map<string, SecTicker> } | null = null;

async function secJson<T>(url: string, userAgent: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': userAgent },
    });
  } catch {
    throw new FundamentalDataError('SEC EDGAR could not be reached.', 'network');
  }
  if (response.status === 429)
    throw new FundamentalDataError(
      'SEC EDGAR rate limit reached. Please retry later.',
      'rate-limited',
    );
  if (!response.ok)
    throw new FundamentalDataError(
      `SEC EDGAR request failed (${response.status}).`,
      'source-error',
    );
  return (await response.json()) as T;
}

async function resolveTicker(symbol: string, userAgent: string): Promise<SecTicker | null> {
  if (!tickerCache || tickerCache.expires <= Date.now()) {
    const payload = await secJson<Record<string, SecTicker>>(COMPANY_TICKERS_URL, userAgent);
    tickerCache = {
      expires: Date.now() + TICKER_CACHE_MS,
      values: new Map(Object.values(payload).map((item) => [item.ticker.toUpperCase(), item])),
    };
  }
  return tickerCache.values.get(symbol) ?? null;
}

function factsFor(company: SecCompanyFacts, key: RawKey): SecFact[] {
  const gaap = company.facts?.['us-gaap'] ?? {};
  for (const name of concepts[key].names) {
    const concept = gaap[name];
    if (!concept?.units) continue;
    for (const unit of concepts[key].units) {
      if (concept.units[unit]?.length) return concept.units[unit];
    }
  }
  return [];
}

function latestForPeriod(
  facts: SecFact[],
  end: string,
  form: string,
  frame?: string,
): FilingValue | null {
  const candidates = facts
    .filter(
      (fact) =>
        fact.end === end &&
        fact.form === form &&
        (!frame || fact.frame === frame) &&
        Number.isFinite(fact.val),
    )
    .sort((a, b) => (b.filed ?? '').localeCompare(a.filed ?? ''));
  const fact = candidates[0];
  return fact?.val == null ? null : { value: fact.val, fact };
}

function buildPeriods(company: SecCompanyFacts, form: '10-K' | '10-Q'): PeriodValues[] {
  const anchors = factsFor(company, 'revenue')
    .filter((fact) =>
      form === '10-Q'
        ? fact.form === form && /^CY\d{4}Q[1-3]$/.test(fact.frame ?? '')
        : fact.form === form && fact.end && fact.filed && fact.fy && Number.isFinite(fact.val),
    )
    .sort((a, b) => (b.filed ?? '').localeCompare(a.filed ?? ''));
  const ends = [...new Set(anchors.map((fact) => fact.end as string))];
  return ends
    .map((end): PeriodValues | null => {
      const anchor = latestForPeriod(anchors, end, form)?.fact;
      if (!anchor?.filed || !anchor.fy) return null;
      const values: PeriodValues['values'] = {};
      (Object.keys(concepts) as RawKey[]).forEach((key) => {
        const selected = latestForPeriod(
          factsFor(company, key),
          end,
          form,
          form === '10-Q' &&
            [
              'revenue',
              'grossProfit',
              'operatingIncome',
              'netIncome',
              'eps',
              'operatingCashFlow',
              'capitalExpenditures',
            ].includes(key)
            ? anchor.frame
            : undefined,
        );
        if (selected) values[key] = selected.value;
      });
      return {
        end,
        start: anchor.start ?? null,
        fiscalYear: anchor.fy,
        fiscalQuarter:
          form === '10-Q' && /^Q[1-3]$/.test(anchor.fp ?? '')
            ? (Number(anchor.fp?.slice(1)) as 1 | 2 | 3)
            : null,
        filingDate: anchor.filed,
        formType: form,
        values,
      };
    })
    .filter((period): period is PeriodValues => period !== null)
    .sort((a, b) => b.end.localeCompare(a.end));
}

const metricUnits: Partial<Record<FundamentalMetricKey, FundamentalMetric['unit']>> = {
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
const allKeys = [
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
  'capitalExpenditures',
  'totalCash',
  'totalAssets',
  'totalLiabilities',
  'shareholdersEquity',
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
] as FundamentalMetricKey[];

function normalize(company: SecCompanyFacts, ticker: SecTicker): FundamentalSnapshot | null {
  const periods = buildPeriods(company, '10-K');
  const current = periods[0];
  if (!current) return null;
  const previous = periods[1];
  const source = 'SEC EDGAR Company Facts';
  const raw = current.values;
  const previousRaw = previous?.values;
  const fcf =
    raw.operatingCashFlow == null || raw.capitalExpenditures == null
      ? null
      : raw.operatingCashFlow - Math.abs(raw.capitalExpenditures);
  const previousFcf =
    previousRaw?.operatingCashFlow == null || previousRaw.capitalExpenditures == null
      ? null
      : previousRaw.operatingCashFlow - Math.abs(previousRaw.capitalExpenditures);
  const unavailableMetric = (key: FundamentalMetricKey): FundamentalMetric => ({
    value: null,
    unit: metricUnits[key] ?? 'currency',
    classification: 'unavailable',
    illustrative: false,
    source,
    asOf: current.end,
  });
  const metrics = Object.fromEntries(
    allKeys.map((key) => [key, unavailableMetric(key)]),
  ) as FundamentalMetrics;
  const direct = (key: FundamentalMetricKey, value: number | null | undefined) => {
    if (value != null && Number.isFinite(value))
      metrics[key] = { ...metrics[key], value, classification: 'historical' };
  };
  direct('revenue', raw.revenue);
  direct('grossProfit', raw.grossProfit);
  direct('operatingIncome', raw.operatingIncome);
  direct('netIncome', raw.netIncome);
  direct('eps', raw.eps);
  direct('operatingCashFlow', raw.operatingCashFlow);
  direct('capitalExpenditures', raw.capitalExpenditures);
  direct('freeCashFlow', fcf);
  direct('totalCash', raw.cash);
  direct('totalAssets', raw.assets);
  direct('totalLiabilities', raw.liabilities);
  direct('shareholdersEquity', raw.equity);
  direct('totalDebt', raw.debt);
  direct('sharesOutstanding', raw.shares);
  direct('bookValue', raw.equity);
  metrics.revenueGrowth = calculatedMetric(
    calculateGrowth(raw.revenue, previousRaw?.revenue),
    'percent',
    source,
    current.end,
  );
  metrics.epsGrowth = calculatedMetric(
    calculateGrowth(raw.eps, previousRaw?.eps),
    'percent',
    source,
    current.end,
  );
  metrics.freeCashFlowGrowth = calculatedMetric(
    calculateGrowth(fcf, previousFcf),
    'percent',
    source,
    current.end,
  );
  metrics.grossMargin = calculatedMetric(
    calculateGrossMargin(raw.grossProfit, raw.revenue),
    'percent',
    source,
    current.end,
  );
  metrics.operatingMargin = calculatedMetric(
    calculateOperatingMargin(raw.operatingIncome, raw.revenue),
    'percent',
    source,
    current.end,
  );
  metrics.netProfitMargin = calculatedMetric(
    calculateNetMargin(raw.netIncome, raw.revenue),
    'percent',
    source,
    current.end,
  );
  metrics.freeCashFlowMargin = calculatedMetric(
    calculateFreeCashFlowMargin(fcf, raw.revenue),
    'percent',
    source,
    current.end,
  );
  metrics.netDebt = calculatedMetric(
    calculateNetDebt(raw.debt, raw.cash),
    'currency',
    source,
    current.end,
  );
  metrics.debtToEquity = calculatedMetric(
    calculateDebtToEquity(raw.debt, raw.equity),
    'ratio',
    source,
    current.end,
  );
  metrics.returnOnEquity = calculatedMetric(
    calculateRoe(raw.netIncome, raw.equity),
    'percent',
    source,
    current.end,
  );
  // Market capitalization belongs to the separate market-data service. Without it, yield stays unavailable.
  metrics.cashFlowYield = calculatedMetric(
    calculateCashFlowYield(fcf, null),
    'percent',
    source,
    current.end,
  );
  const historyFor = (
    sourcePeriods: PeriodValues[],
    frequency: 'annual' | 'quarterly',
    limit: number,
  ): HistoricalFundamentals[] =>
    sourcePeriods.slice(0, limit).map((period, index) => {
      const v = period.values;
      const periodFcf =
        v.operatingCashFlow == null || v.capitalExpenditures == null
          ? null
          : v.operatingCashFlow - Math.abs(v.capitalExpenditures);
      const historical = (
        key: FundamentalMetricKey,
        value: number | null | undefined,
        unit = metricUnits[key] ?? 'currency',
      ): FundamentalMetric =>
        value == null
          ? { ...unavailableMetric(key), asOf: period.end, unit }
          : {
              value,
              unit,
              classification: 'historical',
              illustrative: false,
              source,
              asOf: period.end,
            };
      return {
        fiscalYear: period.fiscalYear,
        fiscalQuarter: period.fiscalQuarter,
        frequency,
        reportingPeriodStart: period.start,
        reportingPeriodEnd: period.end,
        metrics: {
          revenue: historical('revenue', v.revenue),
          eps: historical('eps', v.eps),
          grossMargin: calculatedMetric(
            calculateGrossMargin(v.grossProfit, v.revenue),
            'percent',
            source,
            period.end,
          ),
          operatingMargin: calculatedMetric(
            calculateOperatingMargin(v.operatingIncome, v.revenue),
            'percent',
            source,
            period.end,
          ),
          netProfitMargin: calculatedMetric(
            calculateNetMargin(v.netIncome, v.revenue),
            'percent',
            source,
            period.end,
          ),
          freeCashFlow: historical('freeCashFlow', periodFcf),
          totalDebt: historical('totalDebt', v.debt),
          totalCash: historical('totalCash', v.cash),
        },
        yearOverYearAvailable: Boolean(sourcePeriods[index + (frequency === 'quarterly' ? 4 : 1)]),
        sequentialComparisonAvailable:
          frequency === 'quarterly' && Boolean(sourcePeriods[index + 1]),
      };
    });
  const history = [
    ...historyFor(periods, 'annual', 8),
    ...historyFor(buildPeriods(company, '10-Q'), 'quarterly', 12),
  ];
  const availability = Object.fromEntries(
    allKeys.map((key) => [key, metrics[key].value !== null]),
  ) as Record<FundamentalMetricKey, boolean>;
  const availableCount = Object.values(availability).filter(Boolean).length;
  const fetchedAt = new Date().toISOString();
  const cik = String(ticker.cik_str).padStart(10, '0');
  return {
    company: {
      name: company.entityName || ticker.title,
      ticker: ticker.ticker.toUpperCase(),
      cik,
      exchange: null,
      sector: null,
      industry: null,
    },
    period: {
      fiscalYear: current.fiscalYear,
      fiscalQuarter: null,
      frequency: 'annual',
      reportingPeriodStart: current.start,
      reportingPeriodEnd: current.end,
    },
    metrics,
    history,
    scoreInputs: [],
    source,
    environment: 'real',
    dataStatus:
      availableCount === 0 ? 'empty' : availableCount === allKeys.length ? 'populated' : 'partial',
    sourceUrl: `${SEC_ORIGIN}/api/xbrl/companyfacts/CIK${cik}.json`,
    providerName: 'U.S. Securities and Exchange Commission',
    filingDate: current.filingDate,
    formType: current.formType,
    fetchedAt,
    staleAfter: new Date(Date.now() + CACHE_MS).toISOString(),
    disclaimer:
      'Real filed financial data retrieved from SEC EDGAR. Missing fields remain unavailable.',
    availability,
  };
}

export function createSecEdgarProvider(userAgent: string): FundamentalDataProvider {
  const cache = new Map<
    string,
    {
      expires: number;
      value?: FundamentalSnapshot | null;
      promise?: Promise<FundamentalSnapshot | null>;
    }
  >();
  return {
    name: 'SEC EDGAR',
    async getSnapshot(input) {
      const symbol = input.trim().toUpperCase();
      if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))
        throw new FundamentalDataError('Enter a valid U.S. ticker symbol.', 'invalid-symbol');
      const existing = cache.get(symbol);
      if (existing?.promise) return existing.promise;
      if (existing && existing.expires > Date.now() && 'value' in existing)
        return existing.value ?? null;
      const promise = (async () => {
        const ticker = await resolveTicker(symbol, userAgent);
        if (!ticker) return null;
        const cik = String(ticker.cik_str).padStart(10, '0');
        const company = await secJson<SecCompanyFacts>(
          `${SEC_ORIGIN}/api/xbrl/companyfacts/CIK${cik}.json`,
          userAgent,
        );
        return normalize(company, ticker);
      })();
      cache.set(symbol, { expires: 0, promise });
      try {
        const value = await promise;
        cache.set(symbol, { expires: Date.now() + CACHE_MS, value });
        return value;
      } catch (error) {
        cache.delete(symbol);
        throw error;
      }
    },
  };
}

export const secEdgarInternals = { normalize };
