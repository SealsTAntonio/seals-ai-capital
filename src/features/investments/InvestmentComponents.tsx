import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, EmptyState, PrimaryButton } from '@/components';
import {
  getMarketDataService,
  type MarketQuote,
  type SymbolSearchResult,
} from '@/features/market-data';
import { Movement, QuoteRow } from '@/features/market-data/MarketDataComponents';
import { theme } from '@/theme';

import type { EnrichedPosition, PortfolioTotals } from './types';
import { normalizeSymbol, validatePosition } from './validation';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 });
const value = (amount: number | null) => (amount === null ? 'Unavailable' : money.format(amount));

export function InvestmentState({
  kind,
  onRetry,
}: {
  kind: 'loading' | 'error';
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      {kind === 'loading' ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <Text style={styles.error}>Investment data is unavailable.</Text>
      )}
      <Text style={styles.muted}>
        {kind === 'loading'
          ? 'Loading your secure workspace…'
          : 'Check your connection and try again.'}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.link}>TRY AGAIN</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SymbolSearch({ onSelect }: { onSelect: (result: SymbolSearchResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      setError(null);
      void getMarketDataService()
        .searchSymbols(normalized)
        .then(setResults)
        .catch(() => setError('Search is unavailable.'))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <View style={styles.search}>
      <TextInput
        accessibilityLabel="Search stocks"
        autoCapitalize="characters"
        onChangeText={setQuery}
        placeholder="Search symbol or company"
        placeholderTextColor={theme.colors.textSubtle}
        style={styles.input}
        value={query}
      />
      {searching ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {results.map((result) => (
        <Pressable
          key={result.symbol}
          onPress={() => {
            onSelect(result);
            setQuery('');
            setResults([]);
          }}
          style={styles.searchRow}
        >
          <View>
            <Text style={styles.symbol}>{result.symbol}</Text>
            <Text style={styles.muted}>{result.companyName}</Text>
          </View>
          <Text style={styles.link}>SELECT</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function WatchlistButton({
  watched,
  saving,
  onPress,
}: {
  watched: boolean;
  saving: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={saving}
      onPress={onPress}
      style={[styles.smallButton, watched && styles.removeButton]}
    >
      <Text style={styles.smallButtonText}>
        {saving ? 'SAVING…' : watched ? 'REMOVE' : '+ WATCH'}
      </Text>
    </Pressable>
  );
}

export function WatchlistCard({
  quotes,
  onRemove,
}: {
  quotes: MarketQuote[];
  onRemove: (symbol: string) => void;
}) {
  return (
    <Card
      title="My Watchlist"
      description={`${quotes.length} watched symbol${quotes.length === 1 ? '' : 's'}`}
    >
      {quotes.map((quote, index) => (
        <View key={quote.symbol}>
          <QuoteRow bordered={index > 0} quote={quote} />
          <View style={styles.rowAction}>
            <Text style={styles.status}>{quote.marketStatus.toUpperCase()}</Text>
            <WatchlistButton watched saving={false} onPress={() => onRemove(quote.symbol)} />
          </View>
        </View>
      ))}
    </Card>
  );
}

export function WatchlistEmptyState() {
  return (
    <EmptyState
      symbol="★"
      title="Build your watchlist"
      message="Search for a company above to follow its market snapshot here."
    />
  );
}

export function PositionEditor({
  initial,
  saving,
  message,
  onSave,
  onCancel,
}: {
  initial?: EnrichedPosition | null;
  saving: boolean;
  message?: string | null;
  onSave: (symbol: string, quantity: number, averageCost: number) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? '');
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '');
  const [cost, setCost] = useState(initial ? String(initial.averageCost) : '');
  const [errors, setErrors] = useState<ReturnType<typeof validatePosition>['errors']>({});
  const [success, setSuccess] = useState(false);
  const submit = async () => {
    const checked = validatePosition(symbol, quantity, cost);
    setErrors(checked.errors);
    setSuccess(false);
    if (!checked.valid) return;
    if (await onSave(normalizeSymbol(symbol), checked.quantity, checked.averageCost)) {
      setSuccess(true);
      if (!initial) {
        setSymbol('');
        setQuantity('');
        setCost('');
      }
    }
  };
  return (
    <Card
      title={initial ? `Edit ${initial.symbol}` : 'Add a Position'}
      description="Track a personal or simulated current position."
    >
      <TextInput
        autoCapitalize="characters"
        editable={!initial}
        onChangeText={(text) => setSymbol(normalizeSymbol(text))}
        placeholder="Stock symbol"
        placeholderTextColor={theme.colors.textSubtle}
        style={styles.input}
        value={symbol}
      />
      {errors.symbol ? <Text style={styles.error}>{errors.symbol}</Text> : null}
      <View style={styles.formRow}>
        <View style={styles.field}>
          <Text style={styles.label}>SHARES</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.input}
            value={quantity}
          />
          {errors.quantity ? <Text style={styles.error}>{errors.quantity}</Text> : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>AVERAGE COST</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setCost}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.input}
            value={cost}
          />
          {errors.averageCost ? <Text style={styles.error}>{errors.averageCost}</Text> : null}
        </View>
      </View>
      {message ? <Text style={styles.error}>{message}</Text> : null}
      {success ? <Text style={styles.success}>Position saved.</Text> : null}
      <View style={styles.actions}>
        <PrimaryButton
          disabled={saving}
          label={saving ? 'Saving…' : 'Save Position'}
          onPress={() => void submit()}
        />
        {onCancel ? (
          <Pressable onPress={onCancel}>
            <Text style={styles.link}>CANCEL</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export function PortfolioSummary({ totals }: { totals: PortfolioTotals }) {
  const change = totals.unrealizedGainLoss;
  return (
    <Card compact title="Portfolio Summary">
      <View style={styles.summary}>
        <SummaryItem label="MARKET VALUE" content={value(totals.marketValue)} />
        <SummaryItem label="COST BASIS" content={money.format(totals.costBasis)} />
        <SummaryItem label="UNREALIZED G/L" content={value(change)} tone={change} />
        <SummaryItem
          label="RETURN"
          content={
            totals.unrealizedGainLossPercent === null
              ? '—'
              : `${totals.unrealizedGainLossPercent >= 0 ? '+' : ''}${totals.unrealizedGainLossPercent.toFixed(2)}%`
          }
          tone={totals.unrealizedGainLossPercent}
        />
      </View>
    </Card>
  );
}
function SummaryItem({
  label,
  content,
  tone,
}: {
  label: string;
  content: string;
  tone?: number | null;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          tone !== undefined && tone !== null && (tone >= 0 ? styles.success : styles.error),
        ]}
      >
        {content}
      </Text>
    </View>
  );
}

export function PortfolioRow({
  position,
  onEdit,
  onRemove,
}: {
  position: EnrichedPosition;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <Card
      compact
      title={position.symbol}
      description={position.quote?.companyName ?? 'Company name unavailable'}
    >
      <View style={styles.summary}>
        <SummaryItem label="SHARES" content={number.format(position.quantity)} />
        <SummaryItem label="AVG COST" content={money.format(position.averageCost)} />
        <SummaryItem label="CURRENT" content={value(position.quote?.currentPrice ?? null)} />
        <SummaryItem label="MARKET VALUE" content={value(position.marketValue)} />
        <SummaryItem label="COST BASIS" content={money.format(position.costBasis)} />
        <SummaryItem
          label="UNREALIZED G/L"
          content={value(position.unrealizedGainLoss)}
          tone={position.unrealizedGainLoss}
        />
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onEdit}>
          <Text style={styles.link}>EDIT</Text>
        </Pressable>
        <Pressable onPress={onRemove}>
          <Text style={styles.remove}>REMOVE</Text>
        </Pressable>
        {position.unrealizedGainLossPercent !== null ? (
          <Movement value={position.unrealizedGainLossPercent} />
        ) : null}
      </View>
    </Card>
  );
}

export function PortfolioEmptyState() {
  return (
    <EmptyState
      symbol="◒"
      title="Add your first position"
      message="Enter shares and average cost to begin tracking a personal or simulated portfolio. No brokerage or real-money trading is connected."
    />
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg },
  muted: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm },
  error: { color: theme.colors.danger, fontSize: theme.typography.fontSize.sm },
  success: { color: theme.colors.success, fontSize: theme.typography.fontSize.sm },
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  remove: { color: theme.colors.danger, fontSize: theme.typography.fontSize.xs, fontWeight: '700' },
  search: { gap: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.backgroundElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  searchRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  symbol: { color: theme.colors.text, fontWeight: '700' },
  smallButton: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  removeButton: { borderColor: theme.colors.danger, borderWidth: 1 },
  smallButtonText: { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },
  rowAction: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.sm,
  },
  status: { color: theme.colors.textSubtle, fontSize: 9, letterSpacing: 1 },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  field: { flex: 1, minWidth: 140, gap: theme.spacing.xs },
  label: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  summaryItem: { flexBasis: 120, flexGrow: 1, gap: theme.spacing.xs },
  summaryValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
  },
});
