import {
  atr,
  bollingerBands,
  macd,
  momentum,
  rsi,
  supportResistance,
  technicalScore,
  trendDirection,
  volatility,
  volumeAnalysis,
} from './calculations';
import type {
  MarketDataProvider,
  ScoreComponent,
  TechnicalAnalysis,
  TechnicalAnalysisService,
  Timeframe,
} from './types';
import { isValidTechnicalSymbol, isValidTimeframe, normalizeTechnicalSymbol } from './validation';

export class TechnicalAnalysisError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid-symbol' | 'invalid-timeframe' | 'provider-error',
  ) {
    super(message);
    this.name = 'TechnicalAnalysisError';
  }
}
const unavailableProvider: MarketDataProvider = {
  name: 'No historical market-data provider configured',
  async getHistoricalSeries(symbol, timeframe) {
    const now = new Date().toISOString();
    return {
      series: null,
      provenance: {
        status: 'unavailable',
        provider: this.name,
        source: 'none',
        retrievedAt: now,
        freshness: 'unknown',
        symbol,
        timeframe,
        error: null,
      },
    };
  },
};
const emptyScore = () =>
  technicalScore(
    ['trend', 'momentum', 'volume', 'volatility', 'supportResistance'].map((name) => ({
      name,
      score: 50,
      weight: 1,
      available: false,
      reason: 'Required history unavailable.',
    })) as ScoreComponent[],
  );
export function createTechnicalAnalysisService(
  provider: MarketDataProvider,
): TechnicalAnalysisService {
  return {
    async analyze(rawSymbol, timeframe) {
      const symbol = normalizeTechnicalSymbol(rawSymbol);
      if (!isValidTechnicalSymbol(symbol))
        throw new TechnicalAnalysisError('Enter a valid ticker symbol.', 'invalid-symbol');
      if (!isValidTimeframe(timeframe))
        throw new TechnicalAnalysisError('Select a supported timeframe.', 'invalid-timeframe');
      let response: Awaited<ReturnType<MarketDataProvider['getHistoricalSeries']>>;
      try {
        response = await provider.getHistoricalSeries(symbol, timeframe);
      } catch (error) {
        throw new TechnicalAnalysisError(
          error instanceof Error ? error.message : 'Market-data provider failed.',
          'provider-error',
        );
      }
      if (!response.series?.candles.length)
        return {
          series: response.series,
          provenance: response.provenance,
          trend: 'unavailable',
          momentum: null,
          volatility: null,
          volumeCondition: 'unavailable',
          support: null,
          resistance: null,
          indicators: [],
          score: emptyScore(),
        };
      const closes = response.series.candles.map((c) => c.close),
        volumes = response.series.candles.map((c) => c.volume);
      const t = trendDirection(closes),
        m = momentum(closes),
        v = volatility(closes),
        vol = volumeAnalysis(volumes),
        sr = supportResistance(closes),
        r = rsi(closes),
        mc = macd(closes),
        a = atr(response.series.candles),
        bb = bollingerBands(closes);
      const components: ScoreComponent[] = [
        {
          name: 'trend',
          score: t.value === 'uptrend' ? 75 : t.value === 'downtrend' ? 25 : 50,
          weight: 0.3,
          available: t.value !== null,
          reason: t.value ? `20/50-period structure: ${t.value}.` : '50 closes required.',
        },
        {
          name: 'momentum',
          score: m.value === null ? 50 : Math.max(0, Math.min(100, 50 + m.value * 2)),
          weight: 0.25,
          available: m.value !== null,
          reason:
            m.value === null
              ? '11 closes required.'
              : `10-period price momentum is ${m.value.toFixed(2)}%.`,
        },
        {
          name: 'volume',
          score:
            vol.value?.condition === 'above-average'
              ? 60
              : vol.value?.condition === 'below-average'
                ? 40
                : 50,
          weight: 0.15,
          available: vol.value !== null,
          reason: vol.value
            ? `Latest volume is ${vol.value.ratio.toFixed(2)}× its 20-period average.`
            : '21 volume observations required.',
        },
        {
          name: 'volatility',
          score: 50,
          weight: 0.1,
          available: v.value !== null,
          reason:
            v.value === null
              ? '21 positive closes required.'
              : `20-period return volatility is ${v.value.toFixed(2)}%; volatility is contextual, not directional.`,
        },
        {
          name: 'supportResistance',
          score:
            sr.value && closes.at(-1)! > (sr.value.support + sr.value.resistance) / 2 ? 60 : 40,
          weight: 0.2,
          available: sr.value !== null,
          reason: sr.value
            ? 'Latest close is compared with the midpoint of the 20-period range.'
            : '20 closes required.',
        },
      ];
      return {
        series: response.series,
        provenance: response.provenance,
        trend: t.value ?? 'unavailable',
        momentum: m.value,
        volatility: v.value,
        volumeCondition: vol.value?.condition ?? 'unavailable',
        support: sr.value?.support ?? null,
        resistance: sr.value?.resistance ?? null,
        score: technicalScore(components),
        indicators: [
          {
            name: 'RSI (14)',
            status: r.status,
            value: r.value,
            detail: '14-period relative strength; 15 closes required.',
          },
          {
            name: 'MACD (12, 26, 9)',
            status: mc.status,
            value: mc.value?.histogram ?? null,
            detail: 'MACD histogram; 34 closes required.',
          },
          {
            name: 'ATR (14)',
            status: a.status,
            value: a.value,
            detail: 'Average true range; 15 candles required.',
          },
          {
            name: 'Bollinger width',
            status: bb.status,
            value: bb.value ? bb.value.upper - bb.value.lower : null,
            detail: 'Two-standard-deviation band width; 20 closes required.',
          },
        ],
      };
    },
  };
}
let provider: MarketDataProvider = unavailableProvider;
let service = createTechnicalAnalysisService(provider);
export const getTechnicalAnalysisService = () => service;
export const setTechnicalMarketDataProvider = (next: MarketDataProvider) => {
  provider = next;
  service = createTechnicalAnalysisService(provider);
  clearTechnicalCache();
};

type CacheEntry = {
  value?: TechnicalAnalysis;
  promise?: Promise<TechnicalAnalysis>;
  storedAt?: number;
};
const cache = new Map<string, CacheEntry>();
export const clearTechnicalCache = () => cache.clear();
export function requestTechnicalAnalysis(
  symbol: string,
  timeframe: Timeframe,
  force = false,
  ttl = 60_000,
) {
  const key = `${normalizeTechnicalSymbol(symbol)}:${timeframe}`,
    old = cache.get(key) ?? {};
  if (old.promise) return old.promise;
  if (!force && old.value && Date.now() - (old.storedAt ?? 0) < ttl)
    return Promise.resolve(old.value);
  const promise = service
    .analyze(symbol, timeframe)
    .then((value) => {
      cache.set(key, { value, storedAt: Date.now() });
      return value;
    })
    .finally(() => {
      const current = cache.get(key);
      if (current?.promise) cache.set(key, { ...current, promise: undefined });
    });
  cache.set(key, { ...old, promise });
  return promise;
}
