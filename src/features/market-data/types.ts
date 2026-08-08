export type MarketStatus = 'open' | 'pre-market' | 'after-hours' | 'closed' | 'unknown';

export type MarketDataSource = 'demo' | 'live';

/** Provider-neutral snapshot. Nullable fields allow honest handling of incomplete feeds. */
export interface MarketQuote {
  symbol: string;
  companyName: string | null;
  currentPrice: number | null;
  priceChange: number | null;
  percentChange: number | null;
  previousClose: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  averageVolume: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  timestamp: string;
  marketStatus: MarketStatus;
  source: MarketDataSource;
}

export interface MarketStatusSnapshot {
  status: MarketStatus;
  timestamp: string;
  source: MarketDataSource;
}

export interface SymbolSearchResult {
  symbol: string;
  companyName: string;
  exchange: string | null;
  assetType: 'stock' | 'etf' | 'index' | 'unknown';
}

export interface MarketDataService {
  getQuote(symbol: string): Promise<MarketQuote | null>;
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
  getMarketStatus(): Promise<MarketStatusSnapshot>;
  searchSymbols(query: string): Promise<SymbolSearchResult[]>;
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid-symbol' | 'network' | 'unavailable' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'MarketDataError';
  }
}
