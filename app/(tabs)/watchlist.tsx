import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Card, ScreenContainer, SectionTitle } from '@/components';
import { useInvestments } from '@/features/investments';
import {
  InvestmentState,
  SymbolSearch,
  WatchlistButton,
  WatchlistCard,
  WatchlistEmptyState,
} from '@/features/investments/InvestmentComponents';
import { theme } from '@/theme';

export default function WatchlistScreen() {
  const investments = useInvestments();
  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={investments.refreshing}
          onRefresh={() =>
            void Promise.all([investments.refresh(), investments.refreshMarketData()])
          }
          tintColor={theme.colors.primary}
        />
      }
      title="Watchlist"
    >
      <Text style={styles.intro}>
        Your highest-conviction ideas, enriched through the centralized market-data service.
      </Text>
      <SectionTitle>FIND A STOCK</SectionTitle>
      <Card
        compact
        title="Symbol Search"
        description="Select a result to add it to your personal watchlist."
      >
        <SymbolSearch
          onSelect={(result) => {
            if (!investments.isWatched(result.symbol))
              void investments.addToWatchlist(result.symbol, result.companyName);
          }}
        />
        {investments.mutationError ? (
          <Text style={styles.error}>{investments.mutationError}</Text>
        ) : null}
      </Card>
      <SectionTitle>MY WATCHLIST</SectionTitle>
      {investments.loading ? (
        <InvestmentState kind="loading" />
      ) : investments.error ? (
        <InvestmentState kind="error" onRetry={() => void investments.refresh()} />
      ) : investments.watchlist.length === 0 ? (
        <WatchlistEmptyState />
      ) : investments.watchlistQuotes && investments.watchlistQuotes.length > 0 ? (
        <WatchlistCard
          quotes={investments.watchlistQuotes}
          onRemove={(symbol) => void investments.removeFromWatchlist(symbol)}
        />
      ) : (
        <Card
          title="Saved Symbols"
          description="Market snapshots are unavailable for these saved symbols."
        >
          {investments.watchlist.map((item) => (
            <View key={item.id} style={styles.saved}>
              <View>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.name}>{item.displayName ?? 'Company name unavailable'}</Text>
              </View>
              <WatchlistButton
                watched
                saving={investments.saving}
                onPress={() => void investments.removeFromWatchlist(item.symbol)}
              />
            </View>
          ))}
        </Card>
      )}
      <Text style={styles.disclaimer}>
        Market values retain their provider source label. Demo mode is illustrative and not live.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.md, lineHeight: 24 },
  error: { color: theme.colors.danger, fontSize: theme.typography.fontSize.sm },
  saved: {
    alignItems: 'center',
    borderBottomColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  symbol: { color: theme.colors.text, fontWeight: '700' },
  name: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm },
  disclaimer: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
});
