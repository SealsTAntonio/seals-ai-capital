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

import { Card, EmptyState, PrimaryButton, SectionTitle } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { theme } from '@/theme';

import { useResearch } from '../hooks';
import { localResearchNotesService } from '../services/researchNotesService';
import type { ResearchFundamentals, ResearchNote, ResearchTechnicalSnapshot } from '../types';
import { validateResearchNote } from '../validation';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
const metric = (value: number | null, kind: 'money' | 'number' | 'percent' = 'number') =>
  value === null
    ? 'Unavailable'
    : kind === 'money'
      ? currency.format(value)
      : kind === 'percent'
        ? `${value.toFixed(2)}%`
        : compact.format(value);
function Grid({ items }: { items: [string, string][] }) {
  return (
    <View style={styles.grid}>
      {items.map(([label, value]) => (
        <View key={label} style={styles.metric}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, value === 'Unavailable' && styles.unavailable]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}
function Fundamentals({ data }: { data: ResearchFundamentals | null }) {
  const d = data;
  return (
    <Card title="Fundamental Snapshot" description="Only adapter-supplied values are displayed.">
      <Grid
        items={[
          ['MARKET CAP', metric(d?.marketCap ?? null)],
          ['P/E RATIO', metric(d?.peRatio ?? null)],
          ['EPS', metric(d?.eps ?? null, 'money')],
          ['REVENUE', metric(d?.revenue ?? null)],
          ['REVENUE GROWTH', metric(d?.revenueGrowth ?? null, 'percent')],
          ['PROFIT MARGIN', metric(d?.profitMargin ?? null, 'percent')],
          ['GROSS MARGIN', metric(d?.grossMargin ?? null, 'percent')],
          ['OPERATING MARGIN', metric(d?.operatingMargin ?? null, 'percent')],
          ['FREE CASH FLOW', metric(d?.freeCashFlow ?? null)],
          ['DEBT', metric(d?.debt ?? null)],
          ['CASH', metric(d?.cash ?? null)],
          ['SHARES', metric(d?.sharesOutstanding ?? null)],
        ]}
      />
    </Card>
  );
}
function Technical({ data }: { data: ResearchTechnicalSnapshot | null }) {
  return (
    <Card
      title="Technical Snapshot"
      description="Unavailable means the adapter supplied no confirmed signal."
    >
      <Grid
        items={[
          ['TREND', data?.trend ?? 'Unavailable'],
          ['RELATIVE STRENGTH', data?.relativeStrength ?? 'Unavailable'],
          ['MOVING AVERAGES', data?.movingAverageStatus ?? 'Unavailable'],
          ['RSI', metric(data?.rsi ?? null)],
          ['VOLUME', data?.volumeStatus ?? 'Unavailable'],
          ['MOMENTUM', data?.momentum ?? 'Unavailable'],
          ['SUPPORT', metric(data?.support ?? null, 'money')],
          ['RESISTANCE', metric(data?.resistance ?? null, 'money')],
        ]}
      />
    </Card>
  );
}
function Notes({ symbol }: { symbol: string }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (user) setNotes(await localResearchNotesService.list(user.id, symbol));
  }, [symbol, user]);
  useEffect(() => {
    void load();
  }, [load]);
  const save = async () => {
    if (!user) return;
    const valid = validateResearchNote(body);
    if (!valid.valid) {
      setMessage(valid.error);
      return;
    }
    await localResearchNotesService.save(user.id, symbol, valid.value);
    setBody('');
    setMessage(null);
    await load();
  };
  return (
    <Card
      title="My Research Notes"
      description="Private to this signed-in user on this device; local foundation only."
    >
      <TextInput
        multiline
        onChangeText={setBody}
        placeholder="Record a question, observation, or follow-up…"
        placeholderTextColor={theme.colors.textSubtle}
        style={styles.input}
        value={body}
      />
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <PrimaryButton label="Save Note" onPress={() => void save()} />
      {notes.map((note) => (
        <View key={note.id} style={styles.note}>
          <Text style={styles.body}>{note.body}</Text>
          <Pressable
            onPress={() => void localResearchNotesService.remove(user!.id, note.id).then(load)}
          >
            <Text style={styles.remove}>REMOVE</Text>
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

export function ResearchWorkspace({ symbol }: { symbol: string }) {
  const resource = useResearch(symbol);
  if (resource.loading || resource.retrying)
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.muted}>
          {resource.retrying ? 'Retrying research…' : 'Loading research workspace…'}
        </Text>
      </View>
    );
  if (resource.error)
    return (
      <View style={styles.state}>
        <EmptyState
          symbol="!"
          title="Research unavailable"
          message="The provider could not load this workspace."
        />
        <PrimaryButton label="Try Again" onPress={() => void resource.retry()} />
      </View>
    );
  const data = resource.data;
  if (!data || data.status === 'empty')
    return (
      <View style={styles.state}>
        <EmptyState
          symbol="⌕"
          title="No research available"
          message="This symbol is valid, but the configured adapter has no research data."
        />
        <PrimaryButton label="Retry" onPress={() => void resource.retry()} />
      </View>
    );
  const q = data.quote;
  const positive = (q?.change ?? 0) >= 0;
  const performance = data.performance;
  return (
    <View style={styles.workspace}>
      <Card
        title={data.company?.name ?? data.symbol}
        description={[
          data.symbol,
          data.company?.exchange,
          data.company?.sector,
          data.company?.industry,
        ]
          .filter(Boolean)
          .join(' • ')}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.price}>{metric(q?.currentPrice ?? null, 'money')}</Text>
            <Text style={[styles.change, !positive && styles.negative]}>
              {q?.change === null || q?.change === undefined
                ? 'Daily change unavailable'
                : `${positive ? '+' : ''}${currency.format(q.change)} (${positive ? '+' : ''}${q.changePercent?.toFixed(2) ?? '—'}%)`}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {data.source === 'demo' ? 'DEMO • ILLUSTRATIVE' : data.source.toUpperCase()}
            </Text>
          </View>
        </View>
        {data.company?.description ? (
          <Text style={styles.muted}>{data.company.description}</Text>
        ) : null}
      </Card>
      <SectionTitle>PRICE & PERFORMANCE</SectionTitle>
      <Card
        title="Performance"
        description="No chart is shown because verified historical series are unavailable."
      >
        <Grid
          items={[
            ['CURRENT', metric(q?.currentPrice ?? null, 'money')],
            ['DAILY CHANGE', metric(q?.change ?? null, 'money')],
            ['1D', metric(performance?.oneDay ?? null, 'percent')],
            ['1W', metric(performance?.oneWeek ?? null, 'percent')],
            ['1M', metric(performance?.oneMonth ?? null, 'percent')],
            ['3M', metric(performance?.threeMonths ?? null, 'percent')],
            ['YTD', metric(performance?.yearToDate ?? null, 'percent')],
            ['1Y', metric(performance?.oneYear ?? null, 'percent')],
          ]}
        />
        <Text style={styles.notice}>
          Historical chart unavailable — no series has been fabricated.
        </Text>
      </Card>
      <SectionTitle>COMPANY DATA</SectionTitle>
      <Fundamentals data={data.fundamentals} />
      <Technical data={data.technical} />
      <SectionTitle>RECENT NEWS</SectionTitle>
      <Card
        title="Research News"
        description={`${data.source === 'demo' ? 'Demo headlines are illustrative, not current news.' : 'Provider-supplied coverage.'}`}
      >
        {data.news.length === 0 ? (
          <Text style={styles.unavailable}>No recent news supplied by the adapter.</Text>
        ) : (
          data.news.map((item) => (
            <View key={item.id} style={styles.news}>
              <Text style={styles.body}>{item.headline}</Text>
              <Text style={styles.label}>
                {item.sourceName} • {new Date(item.publishedAt).toLocaleDateString()} •{' '}
                {item.source.toUpperCase()}
              </Text>
              {item.summary ? <Text style={styles.muted}>{item.summary}</Text> : null}
              {item.url ? (
                <Pressable onPress={() => void Linking.openURL(item.url!)}>
                  <Text style={styles.link}>OPEN SOURCE</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </Card>
      <SectionTitle>SAC RESEARCH FRAMEWORK</SectionTitle>
      <Card
        title="Structured Thesis"
        description="Framework only. AI analysis is coming in a future sprint."
      >
        <Text style={styles.body}>{data.thesis?.thesis ?? 'Thesis unavailable.'}</Text>
        {(
          [
            ['BULL CASE', data.thesis?.bullCase],
            ['BEAR CASE', data.thesis?.bearCase],
            ['CATALYSTS', data.thesis?.catalysts],
            ['WHAT SAC SHOULD MONITOR', data.thesis?.monitor],
          ] as const
        ).map(([title, items]) => (
          <View key={title}>
            <Text style={styles.goldLabel}>{title}</Text>
            {items?.length ? (
              items.map((item) => (
                <Text key={item} style={styles.bullet}>
                  • {item}
                </Text>
              ))
            ) : (
              <Text style={styles.unavailable}>Unavailable</Text>
            )}
          </View>
        ))}
        <Text style={styles.goldLabel}>KEY RISKS</Text>
        {data.thesis?.risks.map((risk) => (
          <View key={risk.id}>
            <Text style={styles.body}>
              {risk.title} • {risk.severity.toUpperCase()}
            </Text>
            <Text style={styles.muted}>{risk.description}</Text>
          </View>
        ))}
      </Card>
      <Notes symbol={data.symbol} />
      <Text style={styles.disclaimer}>
        SAC RESEARCH STATUS: {data.status.toUpperCase()} • SOURCE: {data.source.toUpperCase()} • Not
        investment advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { gap: theme.spacing.xl },
  state: { alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing['2xl'] },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  price: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
  },
  change: { color: theme.colors.success, fontWeight: '700' },
  negative: { color: theme.colors.danger },
  badge: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { color: theme.colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  metric: { flexBasis: 130, flexGrow: 1, gap: theme.spacing.xs },
  label: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  value: { color: theme.colors.text, fontSize: theme.typography.fontSize.md, fontWeight: '600' },
  unavailable: { color: theme.colors.textSubtle, fontStyle: 'italic' },
  muted: { color: theme.colors.textMuted, lineHeight: 20 },
  notice: {
    backgroundColor: theme.colors.backgroundElevated,
    color: theme.colors.textMuted,
    padding: theme.spacing.md,
  },
  news: {
    borderTopColor: theme.colors.borderSubtle,
    borderTopWidth: 1,
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
  },
  body: { color: theme.colors.text, lineHeight: 21 },
  link: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  goldLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  bullet: { color: theme.colors.text, lineHeight: 22 },
  input: {
    backgroundColor: theme.colors.backgroundElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text,
    minHeight: 96,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
  },
  note: {
    borderTopColor: theme.colors.borderSubtle,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  remove: { color: theme.colors.danger, fontSize: 10, fontWeight: '700' },
  error: { color: theme.colors.danger },
  disclaimer: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
});
