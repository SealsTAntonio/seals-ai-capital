import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme';

import type { RankedOpportunity } from './types';

export type OpportunityView =
  'top' | 'bullish' | 'bearish' | 'confidence' | 'momentum' | 'risk' | 'conflicts' | 'incomplete';

const select = (items: RankedOpportunity[], view: OpportunityView) => {
  const copy = [...items];
  if (view === 'bullish')
    return copy.filter((item) => item.compositeScore !== null && item.compositeScore >= 75);
  if (view === 'bearish')
    return copy.filter((item) => item.classification === 'Bearish Opportunity');
  if (view === 'conflicts') return copy.filter((item) => item.conflicts.length > 0);
  if (view === 'incomplete')
    return copy.filter((item) => !item.timeframeSupported || item.confidence.score === null);
  if (view === 'confidence')
    return copy.sort((a, b) => (b.confidence.score ?? -1) - (a.confidence.score ?? -1));
  if (view === 'momentum')
    return copy.sort((a, b) => (b.momentumScore ?? -1) - (a.momentumScore ?? -1));
  if (view === 'risk') return copy.sort((a, b) => (a.riskScore ?? 101) - (b.riskScore ?? 101));
  return copy;
};

/** Shared presentation for Dashboard, Watchlist, Research, Technical, Fundamental, and Portfolio surfaces. */
export function OpportunityWorkspace({
  opportunities,
  view = 'top',
}: {
  opportunities: RankedOpportunity[];
  view?: OpportunityView;
}) {
  const visible = select(opportunities, view);
  return (
    <View>
      <SectionTitle>MARKET OPPORTUNITIES</SectionTitle>
      <Text style={styles.boundary}>
        Analytical ranking only • No brokerage connection or trade execution
      </Text>
      {visible.length === 0 ? (
        <EmptyState
          title="No supported assessments"
          message="SAC will not rank missing or unsupported timeframe data as an opportunity."
        />
      ) : (
        visible.map((item) => (
          <Card
            key={`${item.symbol}-${item.timeframe}`}
            compact
            title={`#${item.rank} ${item.symbol}`}
            description={item.companyName ?? 'Company name unavailable'}
          >
            <View style={styles.row}>
              <Text style={styles.classification}>{item.classification}</Text>
              <Text style={styles.score}>{item.compositeScore ?? '—'}/100</Text>
            </View>
            <Text style={styles.meta}>
              {item.timeframe} • confidence {item.confidence.score ?? 'unavailable'} •{' '}
              {item.dataStatus}
            </Text>
            <Text style={styles.copy}>{item.explanation}</Text>
            {item.strengths.length ? (
              <Text style={styles.positive}>Strengths: {item.strengths.join(' • ')}</Text>
            ) : null}
            {item.weaknesses.length ? (
              <Text style={styles.negative}>Weaknesses: {item.weaknesses.join(' • ')}</Text>
            ) : null}
            {item.warnings.length ? (
              <Text style={styles.warning}>Warnings: {item.warnings.join(' • ')}</Text>
            ) : null}
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  boundary: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    marginBottom: theme.spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  classification: { color: theme.colors.primary, fontWeight: '700', flex: 1 },
  score: { color: theme.colors.text, fontWeight: '700' },
  meta: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  copy: { color: theme.colors.textMuted, lineHeight: 20, marginTop: theme.spacing.sm },
  positive: { color: theme.colors.success, marginTop: theme.spacing.sm },
  negative: { color: theme.colors.danger, marginTop: theme.spacing.xs },
  warning: { color: theme.colors.warning, marginTop: theme.spacing.xs },
});
