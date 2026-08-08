import type {
  MarketDataService,
  MarketQuote,
  MarketStatusSnapshot,
  SymbolSearchResult,
} from './types';

type DemoSeed = Omit<MarketQuote, 'timestamp' | 'marketStatus' | 'source'>;

const seeds: DemoSeed[] = [
  {
    symbol: 'SPY',
    companyName: 'S&P 500 ETF',
    currentPrice: 638.95,
    priceChange: 4.31,
    percentChange: 0.68,
    previousClose: 634.64,
    open: 635.2,
    dayHigh: 640.12,
    dayLow: 633.8,
    volume: 64230000,
    averageVolume: 71100000,
    marketCap: 586000000000,
    fiftyTwoWeekHigh: 640.12,
    fiftyTwoWeekLow: 481.8,
  },
  {
    symbol: 'QQQ',
    companyName: 'Nasdaq-100 ETF',
    currentPrice: 576.4,
    priceChange: 5.2,
    percentChange: 0.91,
    previousClose: 571.2,
    open: 572.1,
    dayHigh: 577.3,
    dayLow: 570.82,
    volume: 39500000,
    averageVolume: 42100000,
    marketCap: 357000000000,
    fiftyTwoWeekHigh: 577.3,
    fiftyTwoWeekLow: 402.39,
  },
  {
    symbol: 'VIX',
    companyName: 'CBOE Volatility Index',
    currentPrice: 15.42,
    priceChange: -0.19,
    percentChange: -1.24,
    previousClose: 15.61,
    open: 15.73,
    dayHigh: 15.9,
    dayLow: 15.21,
    volume: null,
    averageVolume: null,
    marketCap: null,
    fiftyTwoWeekHigh: 65.73,
    fiftyTwoWeekLow: 11.86,
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA',
    currentPrice: 184.86,
    priceChange: 4.35,
    percentChange: 2.41,
    previousClose: 180.51,
    open: 181.7,
    dayHigh: 185.4,
    dayLow: 180.9,
    volume: 181300000,
    averageVolume: 207000000,
    marketCap: 4510000000000,
    fiftyTwoWeekHigh: 185.4,
    fiftyTwoWeekLow: 86.62,
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft',
    currentPrice: 417.52,
    priceChange: 3.15,
    percentChange: 0.76,
    previousClose: 414.37,
    open: 415.02,
    dayHigh: 419.11,
    dayLow: 413.68,
    volume: 22100000,
    averageVolume: 23800000,
    marketCap: 3100000000000,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 344.77,
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon',
    currentPrice: 212.31,
    priceChange: -0.73,
    percentChange: -0.34,
    previousClose: 213.04,
    open: 213.2,
    dayHigh: 214.08,
    dayLow: 211.44,
    volume: 38100000,
    averageVolume: 42500000,
    marketCap: 2260000000000,
    fiftyTwoWeekHigh: 242.52,
    fiftyTwoWeekLow: 151.61,
  },
];

const bySymbol = new Map(seeds.map((quote) => [quote.symbol, quote]));
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function hydrate(seed: DemoSeed): MarketQuote {
  return { ...seed, marketStatus: 'closed', source: 'demo', timestamp: new Date().toISOString() };
}

/** Explicitly illustrative local adapter; it performs no network requests and never represents live data. */
export const demoMarketDataService: MarketDataService = {
  async getQuote(symbol) {
    await delay(250);
    const seed = bySymbol.get(symbol.trim().toUpperCase());
    return seed ? hydrate(seed) : null;
  },
  async getQuotes(symbols) {
    await delay(250);
    return symbols
      .map((symbol) => bySymbol.get(symbol.trim().toUpperCase()))
      .filter((seed): seed is DemoSeed => Boolean(seed))
      .map(hydrate);
  },
  async getMarketStatus(): Promise<MarketStatusSnapshot> {
    await delay(150);
    return { source: 'demo', status: 'closed', timestamp: new Date().toISOString() };
  },
  async searchSymbols(query): Promise<SymbolSearchResult[]> {
    await delay(200);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return seeds
      .filter(
        (seed) =>
          seed.symbol.toLowerCase().includes(normalized) ||
          seed.companyName?.toLowerCase().includes(normalized),
      )
      .map((seed) => ({
        assetType:
          seed.symbol === 'VIX'
            ? 'index'
            : seed.symbol === 'SPY' || seed.symbol === 'QQQ'
              ? 'etf'
              : 'stock',
        companyName: seed.companyName ?? seed.symbol,
        exchange: null,
        symbol: seed.symbol,
      }));
  },
};
