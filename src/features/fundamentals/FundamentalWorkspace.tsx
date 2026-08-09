import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme';

import { useFundamentals, useHistoricalFundamentals } from './hooks';
import type { FundamentalMetricKey, FundamentalMetrics } from './types';
const sections: { title: string; items: [FundamentalMetricKey, string][] }[] = [
  {
    title: 'GROWTH',
    items: [
      ['revenueGrowth', 'Revenue growth'],
      ['epsGrowth', 'EPS growth'],
      ['freeCashFlowGrowth', 'Free cash flow growth'],
    ],
  },
  {
    title: 'PROFITABILITY',
    items: [
      ['grossMargin', 'Gross margin'],
      ['operatingMargin', 'Operating margin'],
      ['netProfitMargin', 'Net margin'],
      ['returnOnEquity', 'ROE'],
      ['returnOnInvestedCapital', 'ROIC'],
    ],
  },
  {
    title: 'FINANCIAL HEALTH',
    items: [
      ['totalCash', 'Cash'],
      ['totalDebt', 'Debt'],
      ['netDebt', 'Net debt'],
      ['debtToEquity', 'Debt / equity'],
      ['currentRatio', 'Current ratio'],
      ['operatingCashFlow', 'Operating cash flow'],
      ['freeCashFlow', 'Free cash flow'],
    ],
  },
  {
    title: 'VALUATION',
    items: [
      ['priceToEarnings', 'P/E'],
      ['forwardPriceToEarnings', 'Forward P/E'],
      ['priceToSales', 'P/S'],
      ['priceToBook', 'P/B'],
      ['enterpriseValueToEbitda', 'EV / EBITDA'],
      ['enterpriseValue', 'Enterprise value'],
    ],
  },
];
const format = (metrics: FundamentalMetrics, key: FundamentalMetricKey) => {
  const m = metrics[key];
  if (m.value === null) return 'Unavailable';
  if (m.unit === 'percent') return `${m.value.toFixed(1)}%`;
  if (m.unit === 'currency')
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(m.value);
  return (
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(m.value) +
    (m.unit === 'multiple' ? '×' : '')
  );
};
export function FundamentalWorkspace({ symbol }: { symbol: string }) {
  const resource = useFundamentals(symbol),
    history = useHistoricalFundamentals(symbol, 'annual');
  if (resource.loading)
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.muted}>Loading fundamental framework…</Text>
      </View>
    );
  if (resource.error)
    return (
      <View>
        <EmptyState
          symbol="!"
          title="Fundamentals unavailable"
          message="The fundamental service could not respond."
        />
        <Pressable onPress={() => void resource.retry()}>
          <Text style={styles.link}>TRY AGAIN</Text>
        </Pressable>
      </View>
    );
  if (!resource.data)
    return (
      <EmptyState
        symbol="—"
        title="No fundamentals supplied"
        message="No company fundamentals are available for this symbol."
      />
    );
  const d = resource.data;
  return (
    <View style={styles.root}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>DEMO / ILLUSTRATIVE FOUNDATION</Text>
        <Text style={styles.muted}>{d.disclaimer}</Text>
      </View>
      <Card
        title={d.company.name}
        description={`${d.company.ticker} • ${d.company.exchange ?? 'Exchange unavailable'}`}
      >
        <View style={styles.grid}>
          <Fact label="Sector" value={d.company.sector} />
          <Fact label="Industry" value={d.company.industry} />
          <Fact label="Market cap" value={format(d.metrics, 'marketCapitalization')} />
          <Fact label="Source" value={d.source} />
          <Fact label="Status" value={d.dataStatus} />
          <Fact label="Freshness" value={resource.stale ? 'STALE' : 'Current demo snapshot'} />
        </View>
      </Card>
      {sections.map((section) => (
        <View key={section.title}>
          <SectionTitle>{section.title}</SectionTitle>
          <Card compact title={section.title}>
            {section.items.map(([key, label]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <View>
                  <Text style={[styles.value, d.metrics[key].value === null && styles.unavailable]}>
                    {format(d.metrics, key)}
                  </Text>
                  <Text style={styles.classification}>
                    {d.metrics[key].classification.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ))}
      <SectionTitle>FUNDAMENTAL SCORE FOUNDATION</SectionTitle>
      <Card
        description="Configurable categories only — no Buy/Sell recommendation."
        title="SAC Score Inputs"
      >
        {d.scoreInputs.map((item) => (
          <View key={item.category} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.unavailable}>UNAVAILABLE • FOUNDATION</Text>
          </View>
        ))}
      </Card>
      <SectionTitle>HISTORICAL FUNDAMENTALS</SectionTitle>
      {history.loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : history.error ? (
        <Pressable onPress={() => void history.retry()}>
          <Text style={styles.link}>HISTORY ERROR • RETRY</Text>
        </Pressable>
      ) : history.empty ? (
        <EmptyState
          symbol="↺"
          title="Historical series unavailable"
          message="No annual history was supplied. Values are not fabricated."
        />
      ) : (
        <Text style={styles.muted}>{history.data?.length} annual periods available.</Text>
      )}
    </View>
  );
}
function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.classification}>{label.toUpperCase()}</Text>
      <Text style={value ? styles.value : styles.unavailable}>{value ?? 'Unavailable'}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: theme.spacing.md },
  state: { alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.xl },
  banner: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  bannerTitle: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.typography.fontSize.sm,
  },
  muted: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  fact: { minWidth: 140, flex: 1 },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  label: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm },
  value: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  unavailable: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    textAlign: 'right',
  },
  classification: {
    color: theme.colors.textSubtle,
    fontSize: 9,
    letterSpacing: 0.6,
    textAlign: 'right',
  },
  link: { color: theme.colors.primary, fontSize: theme.typography.fontSize.xs, fontWeight: '700' },
});
