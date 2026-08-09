import { useCallback } from 'react';

import { getResearchService } from '../services/researchService';
import { normalizeResearchSymbol } from '../validation';

import { useResearchResource } from './useResearchResource';
const missing = <T>(value: T | null) => value === null;
export function useResearch(symbol: string) {
  const normalized = normalizeResearchSymbol(symbol);
  const load = useCallback(() => getResearchService().getResearch(normalized), [normalized]);
  return useResearchResource(normalized ? `research:${normalized}` : null, load, missing);
}
export function useCompanyResearch(symbol: string) {
  const normalized = normalizeResearchSymbol(symbol);
  const load = useCallback(() => getResearchService().getCompany(normalized), [normalized]);
  return useResearchResource(normalized ? `research-company:${normalized}` : null, load, missing);
}
export function useResearchQuote(symbol: string) {
  const normalized = normalizeResearchSymbol(symbol);
  const load = useCallback(() => getResearchService().getQuote(normalized), [normalized]);
  return useResearchResource(normalized ? `research-quote:${normalized}` : null, load, missing);
}
export function useResearchNews(symbol: string) {
  const normalized = normalizeResearchSymbol(symbol);
  const load = useCallback(() => getResearchService().getRecentNews(normalized), [normalized]);
  return useResearchResource(
    normalized ? `research-news:${normalized}` : null,
    load,
    (items) => items.length === 0,
  );
}
