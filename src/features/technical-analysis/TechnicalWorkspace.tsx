import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme';

import { useTechnicalAnalysis } from './hooks';
import { TECHNICAL_TIMEFRAMES, type Timeframe } from './types';

const shown = (value: number | null, suffix = '') =>
  value === null ? 'Unavailable' : `${value.toFixed(2)}${suffix}`;
export function TechnicalWorkspace({ symbol }: { symbol: string }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const resource = useTechnicalAnalysis(symbol, timeframe);
  return (
    <View style={styles.root}>
      <Text style={styles.label}>TIMEFRAME</Text>
      <View style={styles.timeframes}>
        {TECHNICAL_TIMEFRAMES.map((item) => (
          <Pressable
            key={item}
            onPress={() => setTimeframe(item)}
            style={[styles.pill, timeframe === item && styles.active]}
          >
            <Text style={[styles.pillText, timeframe === item && styles.activeText]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {resource.loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.muted}>Loading historical market data…</Text>
        </View>
      ) : resource.error ? (
        <View>
          <EmptyState
            symbol="!"
            title="Technical analysis error"
            message={resource.error.message}
          />
          <Pressable onPress={() => void resource.retry()}>
            <Text style={styles.link}>TRY AGAIN</Text>
          </Pressable>
        </View>
      ) : resource.data ? (
        <Analysis data={resource.data} />
      ) : null}
    </View>
  );
}
function Analysis({
  data,
}: {
  data: NonNullable<ReturnType<typeof useTechnicalAnalysis>['data']>;
}) {
  const p = data.provenance;
  return (
    <>
      <View
        style={[
          styles.banner,
          p.status === 'real' && styles.real,
          p.status === 'error' && styles.error,
        ]}
      >
        <Text style={styles.bannerTitle}>
          {p.status.toUpperCase()}
          {p.status === 'demo' ? ' / ILLUSTRATIVE — NOT LIVE' : ''}
        </Text>
        <Text style={styles.muted}>
          {p.status === 'unavailable'
            ? 'No trusted historical candle provider is configured. No candles or signals were fabricated.'
            : `${p.provider} • ${p.source}`}
        </Text>
      </View>
      {!data.series ? (
        <EmptyState
          symbol="—"
          title="Historical data unavailable"
          message="Connect an approved trusted-backend market-data adapter to calculate technical indicators."
        />
      ) : (
        <>
          <Card
            title={`${p.symbol} • ${p.timeframe}`}
            description="Descriptive technical context only — not a profit guarantee or Buy/Sell recommendation."
          >
            <View style={styles.grid}>
              <Fact label="STATUS" value={p.status.toUpperCase()} />
              <Fact label="FRESHNESS" value={p.freshness.toUpperCase()} />
              <Fact label="RETRIEVED" value={new Date(p.retrievedAt).toLocaleString()} />
              <Fact label="CANDLES" value={String(data.series.candles.length)} />
            </View>
          </Card>
          <SectionTitle>TECHNICAL OVERVIEW</SectionTitle>
          <Card
            title={`${data.trend.toUpperCase()} • ${shown(data.series.candles.at(-1)?.close ?? null)}`}
            description={data.explanation}
          >
            {data.warnings.map((warning) => (
              <Text key={warning} style={styles.warning}>
                • {warning}
              </Text>
            ))}
          </Card>
          <SectionTitle>TECHNICAL SCORE</SectionTitle>
          <Card
            title={
              data.score.value === null
                ? 'Unavailable'
                : `${data.score.value} / 100 • ${data.score.classification.toUpperCase()}`
            }
            description={data.score.explanation}
          >
            {data.score.components.map((c) => (
              <View key={c.name} style={styles.row}>
                <Text style={styles.value}>{c.name}</Text>
                <Text style={styles.muted}>
                  {c.available ? `${c.score}/100` : 'Unavailable'} • {c.reason}
                </Text>
              </View>
            ))}
          </Card>
          <SectionTitle>TREND</SectionTitle>
          <Card title="Trend direction">
            <View style={styles.grid}>
              <Fact label="TREND" value={data.trend} />
            </View>
          </Card>
          <SectionTitle>MOMENTUM • VOLATILITY • VOLUME</SectionTitle>
          <Card title="Validated market conditions">
            <View style={styles.grid}>
              <Fact label="MOMENTUM" value={shown(data.momentum, '%')} />
              <Fact label="VOLATILITY" value={shown(data.volatility, '%')} />
              <Fact label="VOLUME" value={data.volumeCondition} />
            </View>
          </Card>
          <SectionTitle>SUPPORT &amp; RESISTANCE</SectionTitle>
          <Card title="20-period observed range">
            <View style={styles.grid}>
              <Fact label="SUPPORT" value={shown(data.support)} />
              <Fact label="RESISTANCE" value={shown(data.resistance)} />
            </View>
          </Card>
          <SectionTitle>MOVING AVERAGES &amp; OSCILLATORS</SectionTitle>
          {data.indicators.map((i) => (
            <Card compact key={i.name} title={i.name} description={i.detail}>
              <Text style={i.value === null ? styles.muted : styles.value}>
                {shown(i.value)} • {i.status.toUpperCase()}
              </Text>
            </Card>
          ))}
          <SectionTitle>SIGNAL BREAKDOWN</SectionTitle>
          <Card
            title={`${data.signals.length} technical conditions`}
            description="Signals describe current technical context; they are not trade instructions."
          >
            {data.signals.length ? (
              data.signals.map((signal) => (
                <View key={signal.id} style={styles.row}>
                  <Text style={styles.value}>
                    {signal.label} • {signal.direction.toUpperCase()}
                  </Text>
                  <Text style={styles.muted}>{signal.explanation}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>No validated signals are available.</Text>
            )}
          </Card>
        </>
      )}
    </>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.label}>{label}</Text>
      <Text style={value === 'Unavailable' ? styles.muted : styles.value}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: theme.spacing.md },
  state: { alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.xl },
  muted: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm },
  label: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
  },
  value: { color: theme.colors.text, fontWeight: '700' },
  warning: { color: theme.colors.warning, fontSize: theme.typography.fontSize.sm },
  link: { color: theme.colors.primary, fontWeight: '700', textAlign: 'center' },
  timeframes: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  pill: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  active: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  pillText: { color: theme.colors.textMuted },
  activeText: { color: theme.colors.primary, fontWeight: '700' },
  banner: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  real: { borderColor: theme.colors.success },
  error: { borderColor: theme.colors.danger },
  bannerTitle: { color: theme.colors.primary, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  fact: { minWidth: '43%', gap: 4 },
  row: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: 4,
    paddingVertical: theme.spacing.sm,
  },
});
