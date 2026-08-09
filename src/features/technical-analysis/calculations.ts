import type { Calculation, OhlcvCandle, ScoreComponent, TechnicalScore, TrendState } from './types';

const unavailable = <T>(
  lookback: number,
  explanation = 'Insufficient valid history.',
): Calculation<T> => ({
  status: 'insufficient-data',
  value: null,
  requiredLookback: lookback,
  explanation,
});
const available = <T>(value: T, lookback: number): Calculation<T> => ({
  status: 'available',
  value,
  requiredLookback: lookback,
});
const valid = (v: number[]) => v.every(Number.isFinite);
export function sma(values: number[], period: number): Calculation<number> {
  if (period < 1 || values.length < period || !valid(values)) return unavailable(period);
  const slice = values.slice(-period);
  return available(slice.reduce((a, b) => a + b, 0) / period, period);
}
export function ema(values: number[], period: number): Calculation<number> {
  if (period < 1 || values.length < period || !valid(values)) return unavailable(period);
  let result = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const k = 2 / (period + 1);
  for (const value of values.slice(period)) result = value * k + result * (1 - k);
  return available(result, period);
}
export function rsi(values: number[], period = 14): Calculation<number> {
  if (values.length < period + 1 || !valid(values)) return unavailable(period + 1);
  const window = values.slice(-(period + 1));
  const changes = window.slice(1).map((v, i) => v - window[i]!);
  const gain = changes.reduce((s, v) => s + Math.max(v, 0), 0) / period;
  const loss = changes.reduce((s, v) => s + Math.max(-v, 0), 0) / period;
  if (loss === 0) return available(gain === 0 ? 50 : 100, period + 1);
  return available(100 - 100 / (1 + gain / loss), period + 1);
}
export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): Calculation<{ macd: number; signal: number; histogram: number }> {
  const needed = slow + signal - 1;
  if (values.length < needed || !valid(values)) return unavailable(needed);
  const line: number[] = [];
  for (let i = slow; i <= values.length; i++)
    line.push(ema(values.slice(0, i), fast).value! - ema(values.slice(0, i), slow).value!);
  const signalValue = ema(line, signal).value!;
  const last = line[line.length - 1]!;
  return available({ macd: last, signal: signalValue, histogram: last - signalValue }, needed);
}
export function atr(candles: OhlcvCandle[], period = 14): Calculation<number> {
  if (candles.length < period + 1) return unavailable(period + 1);
  const c = candles.slice(-(period + 1));
  const ranges = c
    .slice(1)
    .map((v, i) =>
      Math.max(v.high - v.low, Math.abs(v.high - c[i]!.close), Math.abs(v.low - c[i]!.close)),
    );
  return valid(ranges) ? sma(ranges, period) : unavailable(period + 1);
}
export function bollingerBands(
  values: number[],
  period = 20,
  deviations = 2,
): Calculation<{ upper: number; middle: number; lower: number }> {
  const middle = sma(values, period);
  if (middle.value === null) return unavailable(period);
  const slice = values.slice(-period);
  const sd = Math.sqrt(slice.reduce((s, v) => s + (v - middle.value!) ** 2, 0) / period);
  return available(
    {
      upper: middle.value + deviations * sd,
      middle: middle.value,
      lower: middle.value - deviations * sd,
    },
    period,
  );
}
export function volumeAnalysis(
  volumes: number[],
  period = 20,
): Calculation<{
  average: number;
  ratio: number;
  condition: 'above-average' | 'below-average' | 'average';
}> {
  if (volumes.length < period + 1 || !valid(volumes) || volumes.some((v) => v < 0))
    return unavailable(period + 1);
  const average = sma(volumes.slice(0, -1), period).value!;
  if (average === 0) return unavailable(period + 1, 'Average volume is zero.');
  const ratio = volumes.at(-1)! / average;
  return available(
    {
      average,
      ratio,
      condition: ratio > 1.1 ? 'above-average' : ratio < 0.9 ? 'below-average' : 'average',
    },
    period + 1,
  );
}
export function momentum(values: number[], period = 10): Calculation<number> {
  if (values.length < period + 1 || !valid(values)) return unavailable(period + 1);
  const base = values.at(-(period + 1))!;
  return base === 0
    ? unavailable(period + 1, 'Momentum base is zero.')
    : available(((values.at(-1)! - base) / base) * 100, period + 1);
}
export function trendDirection(values: number[]): Calculation<TrendState> {
  if (values.length < 50) return unavailable(50);
  const short = sma(values, 20).value!,
    long = sma(values, 50).value!,
    price = values.at(-1)!;
  return available(
    price > short && short > long
      ? 'uptrend'
      : price < short && short < long
        ? 'downtrend'
        : 'sideways',
    50,
  );
}
export function volatility(values: number[], period = 20): Calculation<number> {
  if (values.length < period + 1 || !valid(values) || values.some((v) => v <= 0))
    return unavailable(period + 1);
  const window = values.slice(-(period + 1));
  const returns = window.slice(1).map((v, i) => Math.log(v / window[i]!));
  const mean = returns.reduce((a, b) => a + b, 0) / period;
  return available(
    Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / period) * 100,
    period + 1,
  );
}
export function supportResistance(
  values: number[],
  period = 20,
): Calculation<{ support: number; resistance: number }> {
  if (values.length < period || !valid(values)) return unavailable(period);
  const slice = values.slice(-period);
  return available({ support: Math.min(...slice), resistance: Math.max(...slice) }, period);
}
export function technicalScore(components: ScoreComponent[]): TechnicalScore {
  const usable = components.filter((c) => c.available && Number.isFinite(c.score) && c.weight > 0);
  if (!usable.length)
    return {
      value: null,
      classification: 'neutral',
      components,
      explanation: 'No score components are available; no recommendation is produced.',
    };
  const weight = usable.reduce((s, c) => s + c.weight, 0);
  const value = Math.round(usable.reduce((s, c) => s + c.score * c.weight, 0) / weight);
  return {
    value,
    classification: value >= 65 ? 'bullish' : value <= 35 ? 'bearish' : 'neutral',
    components,
    explanation: `Weighted ${usable.length} of ${components.length} available components on a 0–100 scale. This is descriptive, not trading advice.`,
  };
}
