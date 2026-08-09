import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ResearchNote, ResearchNotesService } from '../types';
import { isResearchNote, normalizeResearchSymbol, validateResearchNote } from '../validation';

const key = (userId: string) => `sac:research-notes:${userId}`;
async function read(userId: string) {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data)
      ? data.filter(isResearchNote).filter((note) => note.userId === userId)
      : [];
  } catch {
    return [];
  }
}
export const localResearchNotesService: ResearchNotesService = {
  async list(userId, symbol) {
    return (await read(userId))
      .filter((note) => note.symbol === normalizeResearchSymbol(symbol))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async save(userId, symbol, body) {
    const checked = validateResearchNote(body);
    if (!checked.valid) throw new Error(checked.error ?? 'Invalid note.');
    const now = new Date().toISOString();
    const note: ResearchNote = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      userId,
      symbol: normalizeResearchSymbol(symbol),
      body: checked.value,
      createdAt: now,
      updatedAt: now,
    };
    const current = await read(userId);
    await AsyncStorage.setItem(key(userId), JSON.stringify([note, ...current]));
    return note;
  },
  async remove(userId, noteId) {
    const current = await read(userId);
    await AsyncStorage.setItem(
      key(userId),
      JSON.stringify(current.filter((note) => note.id !== noteId)),
    );
  },
};
