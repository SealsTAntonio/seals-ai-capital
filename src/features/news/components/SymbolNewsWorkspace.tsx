import { StyleSheet, Text, View } from 'react-native';

import { Card, SectionTitle } from '@/components';
import { theme } from '@/theme';

import { useCompanyNewsSummary, useSymbolCatalysts, useSymbolNews } from '../hooks';

import { CatalystCard, NewsCard, NewsState } from './NewsComponents';
export function SymbolNewsWorkspace({ symbol }: { symbol: string }) {
  const news = useSymbolNews(symbol);
  const catalysts = useSymbolCatalysts(symbol);
  const summary = useCompanyNewsSummary(symbol);
  return (
    <View style={styles.stack}>
      <Card
        title={`${symbol} News Intelligence`}
        description="Recent coverage, catalysts, earnings, analyst, SEC, and corporate developments from the configured provider."
      >
        <Text style={styles.demo}>
          {summary.meta?.disclaimer ?? 'Coverage is loading. Demo results are not live.'}
        </Text>
        <Text style={styles.body}>
          Sentiment: {summary.data?.sentiment ?? 'unavailable'} • Articles:{' '}
          {summary.data?.articleCount ?? '—'} • Catalysts: {summary.data?.catalystCount ?? '—'}
        </Text>
      </Card>
      <SectionTitle>CURRENT & RECENT HEADLINES</SectionTitle>
      <NewsState
        loading={news.loading}
        error={news.error}
        empty={!news.loading && !news.error && !news.data?.length}
        onRetry={() => void news.retry()}
      />
      {news.data?.map((a) => (
        <NewsCard key={a.id} article={a} />
      ))}
      <SectionTitle>MAJOR CATALYSTS</SectionTitle>
      <NewsState
        loading={catalysts.loading}
        error={catalysts.error}
        empty={!catalysts.loading && !catalysts.error && !catalysts.data?.length}
        onRetry={() => void catalysts.retry()}
      />
      {catalysts.data?.map((c) => (
        <CatalystCard key={c.id} catalyst={c} />
      ))}
      <Card
        title="Historical Headlines"
        description="Important historical coverage appears only when supplied by a trusted provider."
      >
        <Text style={styles.body}>Unavailable — no historical data has been invented.</Text>
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: theme.spacing.md },
  demo: { color: theme.colors.warning, fontSize: theme.typography.fontSize.xs, fontWeight: '700' },
  body: { color: theme.colors.textMuted, lineHeight: 20 },
});
