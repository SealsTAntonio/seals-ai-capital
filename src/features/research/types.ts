export type ResearchStatus =
  'idle' | 'loading' | 'ready' | 'partial' | 'empty' | 'error' | 'retrying';
export type ResearchDataSource = 'demo' | 'live' | 'unavailable';

export interface ResearchCompany {
  symbol: string;
  name: string;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  description: string | null;
}
export interface ResearchQuote {
  currentPrice: number | null;
  change: number | null;
  changePercent: number | null;
  asOf: string | null;
}
export interface ResearchPerformance {
  oneDay: number | null;
  oneWeek: number | null;
  oneMonth: number | null;
  threeMonths: number | null;
  yearToDate: number | null;
  oneYear: number | null;
}
export interface ResearchFundamentals {
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  revenue: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  freeCashFlow: number | null;
  debt: number | null;
  cash: number | null;
  sharesOutstanding: number | null;
}
export interface ResearchTechnicalSnapshot {
  trend: string | null;
  relativeStrength: string | null;
  movingAverageStatus: string | null;
  rsi: number | null;
  volumeStatus: string | null;
  momentum: string | null;
  support: number | null;
  resistance: number | null;
}
export interface ResearchNewsItem {
  id: string;
  headline: string;
  sourceName: string;
  publishedAt: string;
  summary: string | null;
  url: string | null;
  source: ResearchDataSource;
}
export interface ResearchRisk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'unknown';
}
export interface ResearchThesis {
  thesis: string | null;
  bullCase: string[];
  bearCase: string[];
  risks: ResearchRisk[];
  catalysts: string[];
  monitor: string[];
}
export interface ResearchSnapshot {
  symbol: string;
  company: ResearchCompany | null;
  quote: ResearchQuote | null;
  performance: ResearchPerformance | null;
  fundamentals: ResearchFundamentals | null;
  technical: ResearchTechnicalSnapshot | null;
  news: ResearchNewsItem[];
  thesis: ResearchThesis | null;
  status: Exclude<ResearchStatus, 'idle' | 'loading' | 'retrying' | 'error'>;
  source: ResearchDataSource;
  updatedAt: string | null;
}
export interface ResearchNote {
  id: string;
  userId: string;
  symbol: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
export interface ResearchService {
  getCompany(symbol: string): Promise<ResearchCompany | null>;
  getQuote(symbol: string): Promise<ResearchQuote | null>;
  getFundamentals(symbol: string): Promise<ResearchFundamentals | null>;
  getTechnicalSnapshot(symbol: string): Promise<ResearchTechnicalSnapshot | null>;
  getRecentNews(symbol: string): Promise<ResearchNewsItem[]>;
  getResearch(symbol: string): Promise<ResearchSnapshot | null>;
}
export interface ResearchNotesService {
  list(userId: string, symbol: string): Promise<ResearchNote[]>;
  save(userId: string, symbol: string, body: string): Promise<ResearchNote>;
  remove(userId: string, noteId: string): Promise<void>;
}
