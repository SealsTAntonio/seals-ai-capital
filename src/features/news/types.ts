import type { MarketQuote } from '@/features/market-data';

export type NewsCategory =
  | 'company'
  | 'markets'
  | 'earnings'
  | 'analyst'
  | 'sec'
  | 'insider'
  | 'corporate-action'
  | 'product'
  | 'partnership'
  | 'ma'
  | 'regulatory'
  | 'legal'
  | 'guidance'
  | 'macro'
  | 'other';
export type NewsImpact = 'low' | 'medium' | 'high' | 'unknown';
export type NewsSentiment = 'positive' | 'neutral' | 'negative' | 'mixed' | 'unknown';
export type NewsStatus =
  'scheduled' | 'developing' | 'confirmed' | 'completed' | 'cancelled' | 'illustrative';
export type NewsDataSource = 'demo' | 'live';
export type CatalystType =
  | 'earnings'
  | 'earnings-guidance'
  | 'analyst-action'
  | 'sec-filing'
  | 'insider-activity'
  | 'ma'
  | 'partnership'
  | 'product-launch'
  | 'regulatory'
  | 'legal'
  | 'management-change'
  | 'dividend'
  | 'stock-split'
  | 'buyback'
  | 'capital-raise'
  | 'major-contract'
  | 'macro-event'
  | 'other';
export type CatalystImportance = 'low' | 'medium' | 'high' | 'critical';

export interface NewsSource {
  id: string;
  name: string;
  url: string | null;
  dataSource: NewsDataSource;
}
export interface NewsArticle {
  id: string;
  symbol: string | null;
  companyName: string | null;
  headline: string;
  summary: string | null;
  source: NewsSource;
  sourceUrl: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  category: NewsCategory;
  sentiment: NewsSentiment;
  impact: NewsImpact;
  catalystType: CatalystType | null;
  relevanceScore: number;
  status: NewsStatus;
  relatedSymbols: string[];
  relatedCompanies: string[];
  tags: string[];
}
export interface NewsEvent extends NewsArticle {
  eventAt: string | null;
}
export interface Catalyst {
  id: string;
  symbol: string | null;
  companyName: string | null;
  title: string;
  description: string;
  dateTime: string | null;
  updatedAt: string | null;
  type: CatalystType;
  importance: CatalystImportance;
  source: NewsSource;
  sourceUrl: string | null;
  status: NewsStatus;
  relevanceScore: number;
  relatedSymbols: string[];
  relatedCompanies: string[];
  tags: string[];
}
export interface CompanyNewsSummary {
  symbol: string;
  companyName: string | null;
  articleCount: number;
  catalystCount: number;
  sentiment: NewsSentiment;
  highestImpact: NewsImpact;
  updatedAt: string | null;
  source: NewsDataSource;
}
export interface NewsQuery {
  query?: string;
  symbols?: string[];
  categories?: NewsCategory[];
  catalystTypes?: CatalystType[];
  limit?: number;
}
export interface NewsResponse<T> {
  data: T;
  source: NewsDataSource;
  fetchedAt: string;
  staleAfter: string;
  disclaimer: string;
}
export interface NewsService {
  getNews(query?: NewsQuery): Promise<NewsResponse<NewsArticle[]>>;
  getNewsForSymbol(symbol: string, query?: NewsQuery): Promise<NewsResponse<NewsArticle[]>>;
  getMarketNews(query?: NewsQuery): Promise<NewsResponse<NewsArticle[]>>;
  getCatalysts(query?: NewsQuery): Promise<NewsResponse<Catalyst[]>>;
  getCatalystsForSymbol(symbol: string, query?: NewsQuery): Promise<NewsResponse<Catalyst[]>>;
  getCompanyNewsSummary(symbol: string): Promise<NewsResponse<CompanyNewsSummary>>;
}
export interface NewsArticleWithMarketContext {
  article: NewsArticle;
  quote: MarketQuote | null;
}
export interface SavedNewsNote {
  id: string;
  userId: string;
  articleId: string;
  symbol: string | null;
  headline: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
