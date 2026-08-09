import { StyleSheet, Text, View } from 'react-native';

import { Card, SectionTitle } from '@/components';
import type { FundamentalSnapshot } from '@/features/fundamentals';
import type { TechnicalAnalysis } from '@/features/technical-analysis';
import { theme } from '@/theme';

import { assessQuantitativeSignals } from './service';

export function QuantitativeScoreCard({
  symbol,
  fundamental = null,
  technical = null,
}: {
  symbol: string;
  fundamental?: FundamentalSnapshot | null;
  technical?: TechnicalAnalysis | null;
}) {
  const assessment = assessQuantitativeSignals({ symbol, fundamental, technical });
  return (
    <View style={styles.root}>
      <SectionTitle>QUANTITATIVE INTELLIGENCE</SectionTitle>
      <Card
        title={
          assessment.score === null
            ? 'SAC Composite Score • Unavailable'
            : `SAC Composite Score • ${assessment.score}/100`
        }
        description={`${assessment.classification} quantitative classification • ${assessment.dataStatus.toUpperCase()} • ${assessment.confidence}% confidence. Analytical and descriptive; not a performance guarantee.`}
      >
        {assessment.components.map((component) => (
          <View key={component.name} style={styles.row}>
            <Text style={styles.value}>{component.name.toUpperCase()}</Text>
            <Text style={styles.muted}>
              {component.score === null ? 'Unavailable' : `${component.score}/100`} • weight{' '}
              {(component.weight * 100).toFixed(0)}% • contribution{' '}
              {component.contribution === null ? 'Unavailable' : component.contribution.toFixed(1)}
            </Text>
          </View>
        ))}
        <Text style={styles.heading}>BULLISH FACTORS</Text>
        <Text style={styles.muted}>
          {assessment.bullishFactors.map((item) => item.label).join(' • ') || 'None available'}
        </Text>
        <Text style={styles.heading}>BEARISH / RISK FACTORS</Text>
        <Text style={styles.muted}>
          {assessment.bearishFactors.map((item) => item.label).join(' • ') || 'None available'}
        </Text>
        <Text style={styles.heading}>CONFLICTING SIGNALS</Text>
        <Text style={assessment.conflicts.length ? styles.warning : styles.muted}>
          {assessment.conflicts.map((item) => item.explanation).join(' • ') || 'None detected'}
        </Text>
        {assessment.incomplete ? (
          <Text style={styles.warning}>
            INCOMPLETE MODEL • Missing evidence was not converted to zero.
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: theme.spacing.sm },
  row: { gap: 3, paddingVertical: theme.spacing.xs },
  value: { color: theme.colors.text, fontWeight: '700' },
  muted: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm },
  heading: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  warning: { color: theme.colors.warning, fontSize: theme.typography.fontSize.sm },
});
