import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionTitle } from '@/components';
import { useInvestments } from '@/features/investments';
import { theme } from '@/theme';

import { useCatalysts, useNews } from '../hooks';

import { CatalystCard, NewsCard, NewsState, SavedNewsList } from './NewsComponents';
type ViewName =
  | 'Market News'
  | 'My Watchlist News'
  | 'Portfolio News'
  | 'Company News'
  | 'Catalysts'
  | 'Saved News';
const views: ViewName[] = [
  'Market News',
  'My Watchlist News',
  'Portfolio News',
  'Company News',
  'Catalysts',
  'Saved News',
];
export function NewsWorkspace() {
  const [view, setView] = useState<ViewName>('Market News');
  const [query, setQuery] = useState('');
  const investments = useInvestments();
  const symbols = useMemo(
    () =>
      view === 'My Watchlist News'
        ? investments.watchlist.map((i) => i.symbol)
        : view === 'Portfolio News'
          ? investments.positions.map((i) => i.symbol)
          : undefined,
    [investments.positions, investments.watchlist, view],
  );
  const news = useNews({ query, symbols });
  const catalysts = useCatalysts({ query, symbols });
  const items =
    view === 'Market News'
      ? news.data?.filter((n) => !n.symbol || n.category === 'markets' || n.category === 'macro')
      : news.data;
  const isCatalyst = view === 'Catalysts';
  return (
    <View style={styles.stack}>
      <View style={styles.tabs}>
        {views.map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            style={[styles.tab, view === v && styles.active]}
          >
            <Text style={[styles.tabText, view === v && styles.activeText]}>{v}</Text>
          </Pressable>
        ))}
      </View>
      {view !== 'Saved News' ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search symbol, company, headline, category, or catalyst"
          placeholderTextColor={theme.colors.textSubtle}
          style={styles.search}
        />
      ) : null}
      <Text style={styles.notice}>
        DEMO / ILLUSTRATIVE CONTENT — NOT LIVE NEWS. No fixture asserts that an event occurred.
      </Text>
      <SectionTitle>{view.toUpperCase()}</SectionTitle>
      {view === 'Saved News' ? (
        <SavedNewsList />
      ) : isCatalyst ? (
        <>
          <NewsState
            loading={catalysts.loading}
            error={catalysts.error}
            empty={!catalysts.loading && !catalysts.error && !catalysts.data?.length}
            onRetry={() => void catalysts.retry()}
          />
          {catalysts.data?.map((c) => (
            <CatalystCard key={c.id} catalyst={c} />
          ))}
        </>
      ) : (
        <>
          <NewsState
            loading={news.loading}
            error={news.error}
            empty={!news.loading && !news.error && !items?.length}
            onRetry={() => void news.retry()}
          />
          {items?.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: theme.spacing.md },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  tab: {
    borderColor: theme.colors.border,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  active: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  activeText: { color: theme.colors.primary },
  search: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text,
    padding: theme.spacing.md,
  },
  notice: {
    color: theme.colors.warning,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    lineHeight: 18,
  },
});
