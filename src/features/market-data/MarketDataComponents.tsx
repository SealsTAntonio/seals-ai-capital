import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

import type { MarketQuote, MarketStatus, MarketStatusSnapshot } from './types';

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

export function MarketState({
  kind,
  onRetry,
}: {
  kind: 'loading' | 'error' | 'empty';
  onRetry?: () => void;
}) {
  if (kind === 'loading')
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.muted}>Loading market data…</Text>
      </View>
    );
  return (
    <View style={styles.state}>
      <Text style={styles.stateTitle}>
        {kind === 'error' ? 'Market data unavailable' : 'No market data'}
      </Text>
      <Text style={styles.muted}>
        {kind === 'error'
          ? 'Check your connection and try again.'
          : 'No results are available for these symbols.'}
      </Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <Text style={styles.retry}>TRY AGAIN</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Movement({ value }: { value: number | null }) {
  if (value === null) return <Text style={styles.muted}>—</Text>;
  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  return (
    <Text
      style={[
        styles.change,
        direction === 'positive'
          ? styles.positive
          : direction === 'negative'
            ? styles.negative
            : styles.neutral,
      ]}
    >
      {value > 0 ? '+' : ''}
      {value.toFixed(2)}%
    </Text>
  );
}

export function QuoteRow({ quote, bordered = false }: { quote: MarketQuote; bordered?: boolean }) {
  return (
    <View style={[styles.row, bordered && styles.border]}>
      <View style={styles.symbol}>
        <Text style={styles.symbolText}>{quote.symbol}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{quote.companyName ?? 'Company name unavailable'}</Text>
        <Text style={styles.muted}>
          {quote.currentPrice === null ? 'Price unavailable' : currency.format(quote.currentPrice)}
        </Text>
      </View>
      <Movement value={quote.percentChange} />
    </View>
  );
}

const statusLabels: Record<MarketStatus, string> = {
  open: 'Market Open',
  'pre-market': 'Pre-Market',
  'after-hours': 'After-Hours',
  closed: 'Market Closed',
  unknown: 'Status Unknown',
};

export function MarketStatusBadge({
  snapshot,
  loading,
  error,
}: {
  snapshot: MarketStatusSnapshot | null;
  loading: boolean;
  error: Error | null;
}) {
  const status = error ? 'unknown' : (snapshot?.status ?? 'unknown');
  const label = loading ? 'Checking Market' : statusLabels[status];
  return (
    <View style={styles.badge}>
      <View
        style={[
          styles.dot,
          status === 'open' && styles.dotOpen,
          status === 'unknown' && styles.dotUnknown,
        ]}
      />
      <Text style={styles.badgeText}>{label}</Text>
      {snapshot?.source === 'demo' ? <Text style={styles.demo}>DEMO</Text> : null}
    </View>
  );
}

export function MarketPulseCard({ quote }: { quote: MarketQuote }) {
  return (
    <View style={styles.pulse}>
      <Text style={styles.pulseLabel}>{quote.companyName ?? quote.symbol}</Text>
      <View style={styles.pulseValues}>
        <Text style={styles.pulsePrice}>
          {quote.currentPrice === null
            ? '—'
            : quote.currentPrice.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
        </Text>
        <Movement value={quote.percentChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 120,
    padding: theme.spacing.md,
  },
  stateTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
  },
  muted: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.xs },
  retry: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    padding: theme.spacing.sm,
  },
  change: { fontSize: theme.typography.fontSize.xs, fontWeight: '700' },
  positive: { color: theme.colors.success },
  negative: { color: theme.colors.danger },
  neutral: { color: theme.colors.textMuted },
  row: { alignItems: 'center', flexDirection: 'row', paddingVertical: 8 },
  border: { borderTopColor: theme.colors.borderSubtle, borderTopWidth: 1 },
  symbol: {
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radii.sm,
    height: 34,
    justifyContent: 'center',
    width: 48,
  },
  symbolText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
  },
  copy: { flex: 1, paddingHorizontal: theme.spacing.sm },
  name: { color: theme.colors.text, fontSize: theme.typography.fontSize.sm, fontWeight: '600' },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.full,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dot: { backgroundColor: theme.colors.textSubtle, borderRadius: 4, height: 7, width: 7 },
  dotOpen: { backgroundColor: theme.colors.success },
  dotUnknown: { backgroundColor: theme.colors.warning },
  badgeText: { color: theme.colors.text, fontSize: 10, fontWeight: '700' },
  demo: { color: theme.colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  pulse: {
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radii.md,
    flex: 1,
    minWidth: 120,
    padding: theme.spacing.md,
  },
  pulseLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  pulseValues: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  pulsePrice: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
  },
});
