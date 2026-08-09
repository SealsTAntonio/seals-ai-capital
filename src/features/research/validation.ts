import type { ResearchNewsItem, ResearchNote } from './types';

export const normalizeResearchSymbol = (value: string) => value.trim().toUpperCase();
export const isValidResearchSymbol = (value: string) =>
  /^[A-Z][A-Z0-9.-]{0,9}$/.test(normalizeResearchSymbol(value));
export const isFinancialMetric = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value));
export const isTechnicalMetric = isFinancialMetric;
export function isResearchNewsItem(value: unknown): value is ResearchNewsItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ResearchNewsItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.headline === 'string' &&
    item.headline.trim().length > 0 &&
    typeof item.sourceName === 'string' &&
    !Number.isNaN(Date.parse(item.publishedAt ?? ''))
  );
}
export function validateResearchNote(body: string) {
  const normalized = body.trim();
  return {
    valid: normalized.length > 0 && normalized.length <= 4000,
    value: normalized,
    error:
      normalized.length === 0
        ? 'Enter a research note.'
        : normalized.length > 4000
          ? 'Notes must be 4,000 characters or fewer.'
          : null,
  };
}
export function isResearchNote(value: unknown): value is ResearchNote {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<ResearchNote>;
  return (
    typeof note.id === 'string' &&
    typeof note.userId === 'string' &&
    isValidResearchSymbol(note.symbol ?? '') &&
    typeof note.body === 'string' &&
    validateResearchNote(note.body).valid
  );
}
