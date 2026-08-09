import type { Catalyst, NewsArticle, NewsCategory, NewsQuery } from './types';

export const normalizeNewsSymbol = (value: string) => value.trim().toUpperCase();
export const isValidNewsSymbol = (value: string) =>
  /^[A-Z][A-Z0-9.-]{0,9}$/.test(normalizeNewsSymbol(value));
const validDate = (value: string | null) => value === null || !Number.isNaN(Date.parse(value));
const validUrl = (value: string | null) => value === null || /^https:\/\//i.test(value);
export function isNewsArticle(value: unknown): value is NewsArticle {
  if (!value || typeof value !== 'object') return false;
  const v = value as NewsArticle;
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.headline === 'string' &&
    v.headline.trim().length > 0 &&
    (v.symbol === null || isValidNewsSymbol(v.symbol)) &&
    validDate(v.publishedAt) &&
    validDate(v.updatedAt) &&
    validUrl(v.sourceUrl) &&
    Number.isFinite(v.relevanceScore) &&
    v.relevanceScore >= 0 &&
    v.relevanceScore <= 1 &&
    Array.isArray(v.relatedSymbols) &&
    Array.isArray(v.tags) &&
    typeof v.source?.name === 'string' &&
    (v.source.dataSource === 'demo' || v.source.dataSource === 'live')
  );
}
export function isCatalyst(value: unknown): value is Catalyst {
  if (!value || typeof value !== 'object') return false;
  const v = value as Catalyst;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    v.title.trim().length > 0 &&
    typeof v.description === 'string' &&
    (v.symbol === null || isValidNewsSymbol(v.symbol)) &&
    validDate(v.dateTime) &&
    validDate(v.updatedAt) &&
    validUrl(v.sourceUrl) &&
    Number.isFinite(v.relevanceScore) &&
    v.relevanceScore >= 0 &&
    v.relevanceScore <= 1
  );
}
export function normalizeNewsQuery(query: NewsQuery = {}): NewsQuery {
  const limit =
    query.limit === undefined ? 50 : Math.max(1, Math.min(100, Math.floor(query.limit)));
  return {
    ...query,
    query: query.query?.trim().slice(0, 120),
    symbols: query.symbols?.map(normalizeNewsSymbol).filter(isValidNewsSymbol),
    limit,
  };
}
export const matchesNewsSearch = (
  article: NewsArticle,
  text: string,
  categories?: NewsCategory[],
) => {
  const q = text.trim().toLowerCase();
  const haystack = [
    article.symbol,
    article.companyName,
    article.headline,
    article.category,
    article.catalystType,
    ...article.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return (
    (!q || haystack.includes(q)) && (!categories?.length || categories.includes(article.category))
  );
};
export function validateNewsNote(body: string) {
  const value = body.trim();
  return {
    value,
    valid: value.length > 0 && value.length <= 4000,
    error: !value
      ? 'Enter a note.'
      : value.length > 4000
        ? 'Notes must be 4,000 characters or fewer.'
        : null,
  };
}
