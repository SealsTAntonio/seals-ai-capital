import type { Calculation, OhlcvCandle, ScoreComponent, TechnicalScore, TrendState } from './types';

const unavailable = <T>(
  lookback: number,
  explanation = 'Insufficient valid history.',
): Calculation<T> => ({
  status: 'unavailable',
  value: null,
  requiredLookback: lookback,
  explanation,
});
const available = <T>(value: T, lookback: number): Calculation<T> => ({
  status: 'real',
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
export function vwap(candles: OhlcvCandle[]): Calculation<number> {
  if (!candles.length) return unavailable(1);
  const volume = candles.reduce((sum, candle) => sum + candle.volume, 0);
  if (!Number.isFinite(volume) || volume <= 0)
    return unavailable(1, 'Positive volume is required.');
  const value = candles.reduce(
    (sum, candle) => sum + ((candle.high + candle.low + candle.close) / 3) * candle.volume,
    0,
  );
  return Number.isFinite(value) ? available(value / volume, candles.length) : unavailable(1);
}
export function stochastic(
  candles: OhlcvCandle[],
  period = 14,
): Calculation<{ k: number; d: number }> {
  if (candles.length < period + 2) return unavailable(period + 2);
  const ks: number[] = [];
  for (let end = candles.length - 2; end < candles.length; end++) {
    const window = candles.slice(end - period + 1, end + 1);
    const high = Math.max(...window.map((c) => c.high));
    const low = Math.min(...window.map((c) => c.low));
    if (high === low) return unavailable(period + 2, 'Price range is zero.');
    ks.push(((candles[end]!.close - low) / (high - low)) * 100);
  }
  const latestWindow = candles.slice(-period);
  const high = Math.max(...latestWindow.map((c) => c.high));
  const low = Math.min(...latestWindow.map((c) => c.low));
  if (high === low) return unavailable(period + 2, 'Price range is zero.');
  const k = ((candles.at(-1)!.close - low) / (high - low)) * 100;
  return available({ k, d: (ks[0]! + ks[1]! + k) / 3 }, period + 2);
}
export function roc(values: number[], period = 12): Calculation<number> {
  if (values.length < period + 1 || !valid(values)) return unavailable(period + 1);
  const base = values.at(-(period + 1))!;
  return base === 0
    ? unavailable(period + 1, 'ROC base is zero.')
    : available(((values.at(-1)! - base) / base) * 100, period + 1);
}
export function adx(
  candles: OhlcvCandle[],
  period = 14,
): Calculation<{ adx: number; plusDi: number; minusDi: number }> {
  const needed = period * 2 + 1;
  if (candles.length < needed) return unavailable(needed);
  const tr: number[] = [],
    plus: number[] = [],
    minus: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i]!,
      previous = candles[i - 1]!;
    tr.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close),
      ),
    );
    const up = current.high - previous.high,
      down = previous.low - current.low;
    plus.push(up > down && up > 0 ? up : 0);
    minus.push(down > up && down > 0 ? down : 0);
  }
  const dx: number[] = [];
  let plusDi = 0,
    minusDi = 0;
  for (let end = period; end <= tr.length; end++) {
    const trSum = tr.slice(end - period, end).reduce((a, b) => a + b, 0);
    if (trSum === 0) return unavailable(needed, 'True range is zero.');
    plusDi = (plus.slice(end - period, end).reduce((a, b) => a + b, 0) / trSum) * 100;
    minusDi = (minus.slice(end - period, end).reduce((a, b) => a + b, 0) / trSum) * 100;
    const total = plusDi + minusDi;
    dx.push(total === 0 ? 0 : (Math.abs(plusDi - minusDi) / total) * 100);
  }
  return available(
    { adx: dx.slice(-period).reduce((a, b) => a + b, 0) / period, plusDi, minusDi },
    needed,
  );
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
    classification: value >= 60 ? 'bullish' : value <= 40 ? 'bearish' : 'neutral',
    components,
    explanation: `Weighted ${usable.length} of ${components.length} available components on a 0–100 scale. This is descriptive, not trading advice.`,
  };
}
