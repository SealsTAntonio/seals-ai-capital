import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NewsArticle, SavedNewsNote } from '../types';
import { validateNewsNote } from '../validation';
const key = (userId: string) => `sac:saved-news:v1:${userId}`;
async function list(userId: string): Promise<SavedNewsNote[]> {
  if (!userId) return [];
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((n): n is SavedNewsNote =>
          Boolean(n && typeof n === 'object' && (n as SavedNewsNote).userId === userId),
        )
      : [];
  } catch {
    return [];
  }
}
export const localSavedNewsService = {
  list,
  async save(userId: string, article: NewsArticle, body: string) {
    const note = validateNewsNote(body);
    if (!userId || !note.valid) throw new Error(note.error ?? 'Invalid saved news note.');
    const now = new Date().toISOString();
    const current = await list(userId);
    const existing = current.find((n) => n.articleId === article.id);
    const value: SavedNewsNote = {
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId,
      articleId: article.id,
      symbol: article.symbol,
      headline: article.headline,
      body: note.value,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await AsyncStorage.setItem(
      key(userId),
      JSON.stringify([value, ...current.filter((n) => n.articleId !== article.id)]),
    );
    return value;
  },
  async remove(userId: string, id: string) {
    await AsyncStorage.setItem(
      key(userId),
      JSON.stringify((await list(userId)).filter((n) => n.id !== id)),
    );
  },
};
