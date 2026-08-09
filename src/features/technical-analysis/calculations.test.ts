// eslint-disable-next-line import/no-unresolved
import { describe, expect, it } from 'vitest';

import {
  atr,
  bollingerBands,
  ema,
  macd,
  momentum,
  rsi,
  sma,
  supportResistance,
  technicalScore,
  trendDirection,
  volatility,
  volumeAnalysis,
} from './calculations';
import type { OhlcvCandle } from './types';
const values = Array.from({ length: 60 }, (_, i) => 100 + i);
const candles: OhlcvCandle[] = values.map((close, i) => ({
  timestamp: new Date(2026, 0, i + 1).toISOString(),
  open: close - 1,
  high: close + 2,
  low: close - 2,
  close,
  volume: 1000 + i * 10,
}));
describe('technical calculations', () => {
  it('calculates SMA and EMA deterministically', () => {
    expect(sma([1, 2, 3, 4], 3).value).toBe(3);
    expect(ema([1, 2, 3, 4], 3).value).toBe(3);
  });
  it('calculates RSI and MACD without non-finite output', () => {
    expect(rsi(values).value).toBe(100);
    expect(Number.isFinite(macd(values).value!.histogram)).toBe(true);
  });
  it('calculates ATR and Bollinger bands', () => {
    expect(atr(candles).value).toBe(4);
    expect(bollingerBands(values).value!.upper).toBeGreaterThan(
      bollingerBands(values).value!.lower,
    );
  });
  it('calculates volume, momentum, trend, volatility and range', () => {
    expect(volumeAnalysis(candles.map((c) => c.volume)).status).toBe('available');
    expect(momentum(values).value).toBeGreaterThan(0);
    expect(trendDirection(values).value).toBe('uptrend');
    expect(volatility(values).value).toBeGreaterThan(0);
    expect(supportResistance(values).value).toEqual({ support: 140, resistance: 159 });
  });
  it('returns explicit insufficient states for empty or missing history', () => {
    [
      sma([], 20),
      ema([1], 20),
      rsi([]),
      macd([]),
      atr([]),
      bollingerBands([]),
      volumeAnalysis([]),
      momentum([]),
      trendDirection([]),
      volatility([]),
      supportResistance([]),
    ].forEach((result) => {
      expect(result.value).toBeNull();
      expect(result.status).toBe('insufficient-data');
    });
  });
  it('makes scoring transparent and ignores missing components', () => {
    const score = technicalScore([
      { name: 'trend', score: 80, weight: 1, available: true, reason: 'test' },
      { name: 'momentum', score: 0, weight: 1, available: false, reason: 'missing' },
    ]);
    expect(score.value).toBe(80);
    expect(score.components).toHaveLength(2);
  });
});
