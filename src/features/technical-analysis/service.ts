import {
  adx,
  atr,
  bollingerBands,
  ema,
  macd,
  momentum,
  roc,
  rsi,
  sma,
  stochastic,
  supportResistance,
  technicalScore,
  trendDirection,
  volatility,
  volumeAnalysis,
  vwap,
} from './calculations';
import type {
  MarketDataProvider,
  ScoreComponent,
  TechnicalAnalysis,
  TechnicalAnalysisService,
  TechnicalSignal,
  Timeframe,
} from './types';
import {
  isValidCandle,
  isValidTechnicalSymbol,
  isValidTimeframe,
  normalizeTechnicalSymbol,
} from './validation';

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
          signals: [],
          explanation:
            'Technical intelligence is unavailable because historical OHLCV data is unavailable.',
          warnings: ['No values or signals were fabricated.'],
        };
      if (response.series.candles.some((candle) => !isValidCandle(candle)))
        throw new TechnicalAnalysisError(
          'The provider returned invalid historical OHLCV data.',
          'provider-error',
        );
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
      const s20 = sma(closes, 20),
        s50 = sma(closes, 50),
        e20 = ema(closes, 20),
        vw = vwap(response.series.candles),
        stoch = stochastic(response.series.candles),
        directional = adx(response.series.candles),
        rate = roc(closes);
      const indicatorStatus = (calculation: { value: unknown }) =>
        calculation.value === null ? ('unavailable' as const) : response.provenance.status;
      const current = closes.at(-1)!;
      const signals: TechnicalSignal[] = [];
      const signal = (
        id: string,
        label: string,
        direction: 'bullish' | 'bearish' | 'neutral',
        explanation: string,
      ) => signals.push({ id, label, direction, explanation });
      if (t.value)
        signal(
          'trend',
          `${t.value === 'uptrend' ? 'Bullish' : t.value === 'downtrend' ? 'Bearish' : 'Neutral'} trend`,
          t.value === 'uptrend' ? 'bullish' : t.value === 'downtrend' ? 'bearish' : 'neutral',
          'Price and 20/50-period moving-average structure determine this condition.',
        );
      if (r.value !== null && (r.value >= 70 || r.value <= 30))
        signal(
          'rsi',
          r.value >= 70 ? 'Overbought' : 'Oversold',
          r.value >= 70 ? 'bearish' : 'bullish',
          `RSI is ${r.value.toFixed(2)}; this is a condition, not a reversal prediction.`,
        );
      if (m.value !== null)
        signal(
          'momentum',
          m.value > 0 ? 'Bullish momentum' : m.value < 0 ? 'Bearish momentum' : 'Neutral momentum',
          m.value > 0 ? 'bullish' : m.value < 0 ? 'bearish' : 'neutral',
          `10-period price change is ${m.value.toFixed(2)}%.`,
        );
      if (mc.value)
        signal(
          'macd',
          mc.value.histogram > 0
            ? 'Bullish MACD condition'
            : mc.value.histogram < 0
              ? 'Bearish MACD condition'
              : 'Neutral MACD condition',
          mc.value.histogram > 0 ? 'bullish' : mc.value.histogram < 0 ? 'bearish' : 'neutral',
          'Classified from the MACD histogram sign.',
        );
      if (s20.value !== null)
        signal(
          'moving-average',
          current >= s20.value ? 'Price above SMA 20' : 'Price below SMA 20',
          current >= s20.value ? 'bullish' : 'bearish',
          `Last close is compared with the 20-period SMA.`,
        );
      if (vol.value)
        signal(
          'volume',
          vol.value.condition === 'above-average'
            ? 'Volume confirmation'
            : 'No strong volume confirmation',
          'neutral',
          `Relative volume is ${vol.value.ratio.toFixed(2)}× average; direction requires price context.`,
        );
      if (closes.length >= 40) {
        const previousBands = bollingerBands(closes.slice(0, -20));
        if (bb.value && previousBands.value) {
          const width = bb.value.upper - bb.value.lower;
          const previousWidth = previousBands.value.upper - previousBands.value.lower;
          if (previousWidth > 0)
            signal(
              'bollinger-width',
              width > previousWidth * 1.1
                ? 'Bollinger Band expansion'
                : width < previousWidth * 0.9
                  ? 'Bollinger Band contraction'
                  : 'Stable Bollinger Band width',
              'neutral',
              'Current 20-period band width is compared with the preceding 20-period window.',
            );
        }
      }
      if (closes.length >= 6 && volumes.length >= 6) {
        const priceChange = current - closes.at(-6)!;
        const volumeChange = volumes.at(-1)! - volumes.at(-6)!;
        if (priceChange * volumeChange < 0)
          signal(
            'volume-divergence',
            'Volume divergence',
            'neutral',
            'Five-period price and volume changes have opposite signs; this is context, not a prediction.',
          );
      }
      if (sr.value) {
        const span = sr.value.resistance - sr.value.support;
        if (span > 0 && (current - sr.value.support) / span <= 0.1)
          signal(
            'support',
            'Support proximity',
            'neutral',
            'Price is within the lower 10% of its 20-period range.',
          );
        if (span > 0 && (sr.value.resistance - current) / span <= 0.1)
          signal(
            'resistance',
            'Resistance proximity',
            'neutral',
            'Price is within the upper 10% of its 20-period range.',
          );
      }
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
            name: 'SMA (20)',
            status: indicatorStatus(s20),
            value: s20.value,
            detail: '20-period simple moving average.',
          },
          {
            name: 'SMA (50)',
            status: indicatorStatus(s50),
            value: s50.value,
            detail: '50-period simple moving average.',
          },
          {
            name: 'EMA (20)',
            status: indicatorStatus(e20),
            value: e20.value,
            detail: '20-period exponential moving average.',
          },
          {
            name: 'RSI (14)',
            status: indicatorStatus(r),
            value: r.value,
            detail: '14-period relative strength; 15 closes required.',
          },
          {
            name: 'MACD (12, 26, 9)',
            status: indicatorStatus(mc),
            value: mc.value?.histogram ?? null,
            detail: 'MACD histogram; 34 closes required.',
          },
          {
            name: 'ATR (14)',
            status: indicatorStatus(a),
            value: a.value,
            detail: 'Average true range; 15 candles required.',
          },
          {
            name: 'Bollinger width',
            status: indicatorStatus(bb),
            value: bb.value ? bb.value.upper - bb.value.lower : null,
            detail: 'Two-standard-deviation band width; 20 closes required.',
          },
          {
            name: 'VWAP',
            status: indicatorStatus(vw),
            value: vw.value,
            detail: 'Cumulative typical-price VWAP for the returned series.',
          },
          {
            name: 'Stochastic (14)',
            status: indicatorStatus(stoch),
            value: stoch.value?.k ?? null,
            values: stoch.value ?? undefined,
            detail: '%K with a three-value %D average; 16 candles required.',
          },
          {
            name: 'ADX / +DI / -DI (14)',
            status: indicatorStatus(directional),
            value: directional.value?.adx ?? null,
            values: directional.value ?? undefined,
            detail: 'Trend strength and directional movement; 29 candles required.',
          },
          {
            name: 'ROC (12)',
            status: indicatorStatus(rate),
            value: rate.value,
            detail: '12-period rate of change; 13 closes required.',
          },
          {
            name: 'Average volume (20)',
            status: indicatorStatus(vol),
            value: vol.value?.average ?? null,
            detail: 'Average of the 20 observations before the latest candle.',
          },
          {
            name: 'Relative volume',
            status: indicatorStatus(vol),
            value: vol.value?.ratio ?? null,
            detail: 'Latest volume divided by its 20-period average.',
          },
        ],
        signals,
        explanation: `${signals.length} validated technical conditions were derived from available OHLCV history. Conditions describe the supplied timeframe and do not predict future performance.`,
        warnings: [
          'Technical conditions are not financial advice, trade instructions, or guarantees.',
          ...(response.provenance.status === 'partial'
            ? [
                'The provider marked this historical series partial; derived intelligence may be incomplete.',
              ]
            : []),
          ...(response.provenance.status === 'demo'
            ? ['All readings are DEMO / ILLUSTRATIVE and are not live market data.']
            : []),
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
