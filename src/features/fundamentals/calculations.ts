import type { FundamentalMetric } from './types';

type Input = number | null | undefined;
export type CalculationResult = {
  value: number | null;
  status: 'available' | 'unavailable';
  reason?: 'missing-input' | 'zero-denominator';
};
const unavailable = (reason: 'missing-input' | 'zero-denominator'): CalculationResult => ({
  value: null,
  status: 'unavailable',
  reason,
});
const ratio = (numerator: Input, denominator: Input, multiplier = 1): CalculationResult => {
  if (
    numerator == null ||
    denominator == null ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator)
  )
    return unavailable('missing-input');
  if (denominator === 0) return unavailable('zero-denominator');
  const value = (numerator / denominator) * multiplier;
  return Number.isFinite(value) ? { value, status: 'available' } : unavailable('missing-input');
};
export const calculateGrowth = (current: Input, previous: Input) =>
  previous == null
    ? unavailable('missing-input')
    : ratio(current == null ? null : current - previous, Math.abs(previous), 100);
export const calculateRevenueGrowth = calculateGrowth;
export const calculateEpsGrowth = calculateGrowth;
export const calculateGrossMargin = (grossProfit: Input, revenue: Input) =>
  ratio(grossProfit, revenue, 100);
export const calculateOperatingMargin = (income: Input, revenue: Input) =>
  ratio(income, revenue, 100);
export const calculateNetMargin = (income: Input, revenue: Input) => ratio(income, revenue, 100);
export const calculateFreeCashFlowMargin = (cashFlow: Input, revenue: Input) =>
  ratio(cashFlow, revenue, 100);
export const calculateDebtToEquity = (debt: Input, equity: Input) => ratio(debt, equity);
export const calculateNetDebt = (debt: Input, cash: Input): CalculationResult =>
  debt == null || cash == null
    ? unavailable('missing-input')
    : { value: debt - cash, status: 'available' };
export const calculatePriceToEarnings = (price: Input, eps: Input) => ratio(price, eps);
export const calculatePriceToSales = (marketCap: Input, revenue: Input) =>
  ratio(marketCap, revenue);
export const calculatePriceToBook = (marketCap: Input, bookValue: Input) =>
  ratio(marketCap, bookValue);
export const calculateEvToEbitda = (enterpriseValue: Input, ebitda: Input) =>
  ratio(enterpriseValue, ebitda);
export const calculateRoe = (income: Input, equity: Input) => ratio(income, equity, 100);
export const calculateRoic = (nopat: Input, investedCapital: Input) =>
  ratio(nopat, investedCapital, 100);
export const calculateCashFlowYield = (cashFlow: Input, marketCap: Input) =>
  ratio(cashFlow, marketCap, 100);
export const calculatedMetric = (
  result: CalculationResult,
  unit: FundamentalMetric['unit'],
  source: string,
  asOf: string | null,
): FundamentalMetric => ({
  value: result.value,
  unit,
  classification: result.status === 'available' ? 'available' : 'unavailable',
  illustrative: false,
  source,
  asOf,
});
