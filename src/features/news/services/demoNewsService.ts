import type {
  Catalyst,
  CompanyNewsSummary,
  NewsArticle,
  NewsQuery,
  NewsResponse,
  NewsService,
} from '../types';
import {
  isCatalyst,
  isNewsArticle,
  isValidNewsSymbol,
  matchesNewsSearch,
  normalizeNewsQuery,
  normalizeNewsSymbol,
} from '../validation';

const source = {
  id: 'sac-demo-news',
  name: 'SAC Demo Scenario Library',
  url: null,
  dataSource: 'demo' as const,
};
const articles: NewsArticle[] = [
  {
    id: 'demo-market-framework',
    symbol: null,
    companyName: null,
    headline: 'Illustrative scenario: a macro announcement changes the market risk outlook',
    summary:
      'Demo-only example showing how a future verified market headline could be presented. This is not an actual event.',
    source,
    sourceUrl: null,
    publishedAt: null,
    updatedAt: null,
    category: 'macro',
    sentiment: 'unknown',
    impact: 'high',
    catalystType: 'macro-event',
    relevanceScore: 1,
    status: 'illustrative',
    relatedSymbols: [],
    relatedCompanies: [],
    tags: ['demo', 'market'],
  },
  {
    id: 'demo-company-framework',
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    headline: 'Illustrative scenario: a company announces a product update',
    summary:
      'Demo-only UI fixture. No announcement is asserted and no real-world timestamp is supplied.',
    source,
    sourceUrl: null,
    publishedAt: null,
    updatedAt: null,
    category: 'product',
    sentiment: 'unknown',
    impact: 'unknown',
    catalystType: 'product-launch',
    relevanceScore: 1,
    status: 'illustrative',
    relatedSymbols: ['AAPL'],
    relatedCompanies: ['Apple Inc.'],
    tags: ['demo', 'company'],
  },
];
const catalysts: Catalyst[] = [
  {
    id: 'demo-catalyst-framework',
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    title: 'Illustrative catalyst slot: earnings review',
    description:
      'Demonstrates catalyst presentation only. This does not indicate that an earnings event occurred or is scheduled.',
    dateTime: null,
    updatedAt: null,
    type: 'earnings',
    importance: 'medium',
    source,
    sourceUrl: null,
    status: 'illustrative',
    relevanceScore: 1,
    relatedSymbols: ['AAPL'],
    relatedCompanies: ['Apple Inc.'],
    tags: ['demo', 'earnings'],
  },
];
const response = <T>(data: T): NewsResponse<T> => ({
  data,
  source: 'demo',
  fetchedAt: new Date().toISOString(),
  staleAfter: new Date(Date.now() + 60_000).toISOString(),
  disclaimer: 'DEMO / ILLUSTRATIVE ONLY — not live news and not a claim that any event occurred.',
});
function filterNews(query: NewsQuery = {}) {
  const q = normalizeNewsQuery(query);
  return articles
    .filter(
      (a) =>
        (!q.symbols?.length || (a.symbol && q.symbols.includes(a.symbol))) &&
        matchesNewsSearch(a, q.query ?? '', q.categories),
    )
    .slice(0, q.limit);
}
function filterCatalysts(query: NewsQuery = {}) {
  const q = normalizeNewsQuery(query);
  const text = q.query?.toLowerCase() ?? '';
  return catalysts
    .filter(
      (c) =>
        (!q.symbols?.length || (c.symbol && q.symbols.includes(c.symbol))) &&
        (!q.catalystTypes?.length || q.catalystTypes.includes(c.type)) &&
        (!text ||
          [c.symbol, c.companyName, c.title, c.type, ...c.tags]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(text)),
    )
    .slice(0, q.limit);
}
export const demoNewsService: NewsService = {
  async getNews(q) {
    const data = filterNews(q);
    if (!data.every(isNewsArticle)) throw new Error('Invalid demo news payload.');
    return response(data);
  },
  async getNewsForSymbol(symbol, q) {
    const s = normalizeNewsSymbol(symbol);
    if (!isValidNewsSymbol(s)) throw new Error('Invalid symbol.');
    return response(filterNews({ ...q, symbols: [s] }));
  },
  async getMarketNews(q) {
    return response(
      filterNews(q).filter(
        (a) => a.symbol === null || a.category === 'markets' || a.category === 'macro',
      ),
    );
  },
  async getCatalysts(q) {
    const data = filterCatalysts(q);
    if (!data.every(isCatalyst)) throw new Error('Invalid demo catalyst payload.');
    return response(data);
  },
  async getCatalystsForSymbol(symbol, q) {
    const s = normalizeNewsSymbol(symbol);
    if (!isValidNewsSymbol(s)) throw new Error('Invalid symbol.');
    return response(filterCatalysts({ ...q, symbols: [s] }));
  },
  async getCompanyNewsSummary(symbol) {
    const s = normalizeNewsSymbol(symbol);
    if (!isValidNewsSymbol(s)) throw new Error('Invalid symbol.');
    const news = filterNews({ symbols: [s] }),
      cats = filterCatalysts({ symbols: [s] });
    const data: CompanyNewsSummary = {
      symbol: s,
      companyName: news[0]?.companyName ?? cats[0]?.companyName ?? null,
      articleCount: news.length,
      catalystCount: cats.length,
      sentiment: 'unknown',
      highestImpact: news.some((n) => n.impact === 'high') ? 'high' : 'unknown',
      updatedAt: null,
      source: 'demo',
    };
    return response(data);
  },
};
