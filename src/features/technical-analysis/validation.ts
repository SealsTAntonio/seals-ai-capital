import { TECHNICAL_TIMEFRAMES, type OhlcvCandle, type Timeframe } from './types';

export const normalizeTechnicalSymbol = (value: string) => value.trim().toUpperCase();
export const isValidTechnicalSymbol = (value: string) =>
  /^[A-Z][A-Z0-9.-]{0,9}$/.test(normalizeTechnicalSymbol(value));
export const isValidTimeframe = (value: string): value is Timeframe =>
  (TECHNICAL_TIMEFRAMES as readonly string[]).includes(value);
export const isValidCandle = (c: OhlcvCandle) =>
  Boolean(c.timestamp && !Number.isNaN(Date.parse(c.timestamp))) &&
  [c.open, c.high, c.low, c.close, c.volume].every(Number.isFinite) &&
  c.open >= 0 &&
  c.low >= 0 &&
  c.close >= 0 &&
  c.volume >= 0 &&
  c.high >= Math.max(c.open, c.close, c.low) &&
  c.low <= Math.min(c.open, c.close, c.high);
