import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card, EmptyState, PrimaryButton } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuotes } from '@/features/market-data';
import { theme } from '@/theme';

import { localSavedNewsService } from '../services/savedNewsService';
import type { Catalyst, NewsArticle, SavedNewsNote } from '../types';

const when = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'No real-world timestamp — illustrative fixture';
export function NewsState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error: Error | null;
  empty: boolean;
  onRetry: () => void;
}) {
  if (loading)
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.muted}>Loading news intelligence…</Text>
      </View>
    );
  if (error)
    return (
      <View style={styles.state}>
        <EmptyState
          symbol="!"
          title="News unavailable"
          message="The configured news service could not respond."
        />
        <PrimaryButton label="Try Again" onPress={onRetry} />
      </View>
    );
  if (empty)
    return (
      <EmptyState
        symbol="◇"
        title="No coverage available"
        message="The configured provider has no matching verified coverage."
      />
    );
  return null;
}
export function NewsCard({
  article,
  showMarket = true,
  onSaved,
}: {
  article: NewsArticle;
  showMarket?: boolean;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const quote = useQuotes(showMarket && article.symbol ? [article.symbol] : []);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const q = quote.data?.[0];
  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await localSavedNewsService.save(user.id, article, note || 'Saved for later research.');
      setNote('');
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card
      title={article.headline}
      description={`${article.source.name} • ${when(article.publishedAt)}`}
    >
      <View style={styles.tags}>
        <Tag
          text={
            article.source.dataSource === 'demo'
              ? 'DEMO • ILLUSTRATIVE'
              : article.source.dataSource.toUpperCase()
          }
        />
        <Tag text={article.category} />
        <Tag text={`${article.sentiment} sentiment`} />
        <Tag text={`${article.impact} impact`} />
        {article.catalystType ? <Tag text={article.catalystType} /> : null}
      </View>
      {article.summary ? <Text style={styles.body}>{article.summary}</Text> : null}
      {q ? (
        <Text style={styles.market}>
          {q.symbol} {q.currentPrice?.toFixed(2) ?? 'price unavailable'} •{' '}
          {q.percentChange === null
            ? 'change unavailable'
            : `${q.percentChange >= 0 ? '+' : ''}${q.percentChange.toFixed(2)}%`}{' '}
          • Vol {q.volume ?? 'unavailable'} • {q.marketStatus} • {q.source.toUpperCase()}
        </Text>
      ) : article.symbol ? (
        <Text style={styles.muted}>Market context unavailable.</Text>
      ) : null}
      {article.sourceUrl ? (
        <Pressable onPress={() => void Linking.openURL(article.sourceUrl!)}>
          <Text style={styles.link}>OPEN VERIFIED SOURCE</Text>
        </Pressable>
      ) : (
        <Text style={styles.muted}>No external source URL — demo fixture only.</Text>
      )}
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Optional private research note"
        placeholderTextColor={theme.colors.textSubtle}
        style={styles.input}
      />
      <Pressable disabled={saving} onPress={() => void save()}>
        <Text style={styles.link}>{saving ? 'SAVING…' : 'SAVE NEWS + NOTE'}</Text>
      </Pressable>
    </Card>
  );
}
export function CatalystCard({ catalyst }: { catalyst: Catalyst }) {
  return (
    <Card
      title={catalyst.title}
      description={`${catalyst.companyName ?? catalyst.symbol ?? 'Market'} • ${when(catalyst.dateTime)}`}
    >
      <View style={styles.tags}>
        <Tag
          text={
            catalyst.source.dataSource === 'demo'
              ? 'DEMO • ILLUSTRATIVE'
              : catalyst.source.dataSource.toUpperCase()
          }
        />
        <Tag text={catalyst.type} />
        <Tag text={`${catalyst.importance} importance`} />
        <Tag text={catalyst.status} />
      </View>
      <Text style={styles.body}>{catalyst.description}</Text>
    </Card>
  );
}
export function SavedNewsList() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<SavedNewsNote[]>([]);
  const load = useCallback(
    async () => setNotes(user ? await localSavedNewsService.list(user.id) : []),
    [user],
  );
  useEffect(() => {
    void load();
  }, [load]);
  if (!notes.length)
    return (
      <EmptyState
        symbol="☆"
        title="No saved news"
        message="Save an item and an optional private note to revisit it here."
      />
    );
  return (
    <View style={styles.stack}>
      {notes.map((n) => (
        <Card key={n.id} title={n.headline} description={`${n.symbol ?? 'Market'} • saved locally`}>
          <Text style={styles.body}>{n.body}</Text>
          <Pressable onPress={() => void localSavedNewsService.remove(user!.id, n.id).then(load)}>
            <Text style={styles.link}>REMOVE</Text>
          </Pressable>
        </Card>
      ))}
    </View>
  );
}
function Tag({ text }: { text: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text.toUpperCase()}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: theme.spacing.md },
  state: { alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.xl },
  muted: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.xs, lineHeight: 18 },
  body: { color: theme.colors.textMuted, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  tag: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { color: theme.colors.primary, fontSize: 9, fontWeight: '700' },
  market: { color: theme.colors.text, fontSize: theme.typography.fontSize.xs, fontWeight: '600' },
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.backgroundElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.text,
    padding: theme.spacing.sm,
  },
});
