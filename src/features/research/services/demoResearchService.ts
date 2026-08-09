import { getMarketDataService } from '@/features/market-data';

import type {
  ResearchCompany,
  ResearchFundamentals,
  ResearchService,
  ResearchTechnicalSnapshot,
  ResearchThesis,
} from '../types';
import { isValidResearchSymbol, normalizeResearchSymbol } from '../validation';

const profiles: Record<string, Omit<ResearchCompany, 'symbol'>> = {
  NVDA: {
    name: 'NVIDIA',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Semiconductors',
    description: 'Illustrative company profile for research workspace development.',
  },
  MSFT: {
    name: 'Microsoft',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Software',
    description: 'Illustrative company profile for research workspace development.',
  },
  AMZN: {
    name: 'Amazon',
    exchange: 'NASDAQ',
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
    description: 'Illustrative company profile for research workspace development.',
  },
};
const emptyFundamentals = (marketCap: number | null): ResearchFundamentals => ({
  marketCap,
  peRatio: null,
  eps: null,
  revenue: null,
  revenueGrowth: null,
  profitMargin: null,
  grossMargin: null,
  operatingMargin: null,
  freeCashFlow: null,
  debt: null,
  cash: null,
  sharesOutstanding: null,
});
const unavailableTechnical: ResearchTechnicalSnapshot = {
  trend: null,
  relativeStrength: null,
  movingAverageStatus: null,
  rsi: null,
  volumeStatus: null,
  momentum: null,
  support: null,
  resistance: null,
};
const framework: ResearchThesis = {
  thesis:
    'Assess durable growth, competitive position, valuation discipline, and downside protection before forming a conviction.',
  bullCase: ['Execution and durable demand could support long-term compounding.'],
  bearCase: ['Valuation or slowing demand could compress expected returns.'],
  risks: [
    {
      id: 'framework-risk',
      title: 'Research incomplete',
      description: 'Illustrative inputs are not sufficient for an investment decision.',
      severity: 'unknown',
    },
  ],
  catalysts: ['Earnings quality and forward guidance'],
  monitor: ['Revenue durability', 'Margins and free cash flow', 'Valuation versus growth'],
};

export const demoResearchService: ResearchService = {
  async getCompany(symbol) {
    const normalized = normalizeResearchSymbol(symbol);
    const quote = await getMarketDataService().getQuote(normalized);
    const profile = profiles[normalized];
    return quote || profile
      ? {
          symbol: normalized,
          name: profile?.name ?? quote?.companyName ?? normalized,
          exchange: profile?.exchange ?? null,
          sector: profile?.sector ?? null,
          industry: profile?.industry ?? null,
          description: profile?.description ?? null,
        }
      : null;
  },
  async getQuote(symbol) {
    const quote = await getMarketDataService().getQuote(normalizeResearchSymbol(symbol));
    return quote
      ? {
          currentPrice: quote.currentPrice,
          change: quote.priceChange,
          changePercent: quote.percentChange,
          asOf: quote.timestamp,
        }
      : null;
  },
  async getFundamentals(symbol) {
    const quote = await getMarketDataService().getQuote(normalizeResearchSymbol(symbol));
    return quote ? emptyFundamentals(quote.marketCap) : null;
  },
  async getTechnicalSnapshot(symbol) {
    return isValidResearchSymbol(symbol) ? unavailableTechnical : null;
  },
  async getRecentNews(symbol) {
    if (!profiles[normalizeResearchSymbol(symbol)]) return [];
    return [
      {
        id: `${normalizeResearchSymbol(symbol)}-demo-news`,
        headline: 'Illustrative research-news placeholder',
        sourceName: 'SAC demo adapter',
        publishedAt: '2026-08-08T12:00:00.000Z',
        summary: 'Demo content validates the news presentation and is not a current report.',
        url: null,
        source: 'demo',
      },
    ];
  },
  async getResearch(symbol) {
    const normalized = normalizeResearchSymbol(symbol);
    if (!isValidResearchSymbol(normalized)) return null;
    const [company, quote, fundamentals, technical, news] = await Promise.all([
      this.getCompany(normalized),
      this.getQuote(normalized),
      this.getFundamentals(normalized),
      this.getTechnicalSnapshot(normalized),
      this.getRecentNews(normalized),
    ]);
    if (!company && !quote)
      return {
        symbol: normalized,
        company: null,
        quote: null,
        performance: null,
        fundamentals: null,
        technical: null,
        news: [],
        thesis: null,
        status: 'empty',
        source: 'unavailable',
        updatedAt: null,
      };
    return {
      symbol: normalized,
      company,
      quote,
      performance: {
        oneDay: quote?.changePercent ?? null,
        oneWeek: null,
        oneMonth: null,
        threeMonths: null,
        yearToDate: null,
        oneYear: null,
      },
      fundamentals,
      technical,
      news,
      thesis: framework,
      status: 'partial',
      source: 'demo',
      updatedAt: quote?.asOf ?? new Date().toISOString(),
    };
  },
};
