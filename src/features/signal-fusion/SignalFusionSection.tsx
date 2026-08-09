import { StyleSheet, Text, View } from 'react-native';

import { Card, SectionTitle } from '@/components';
import { theme } from '@/theme';

import type { SignalFusionAssessment } from './types';

export function SignalFusionSection({ assessment }: { assessment: SignalFusionAssessment }) {
  const impact = (name: 'RISK' | 'PORTFOLIO_FIT' | 'CATALYST') =>
    assessment.components.find((component) => component.name === name)?.direction ?? 'UNAVAILABLE';
  return (
    <View>
      <SectionTitle>SIGNAL FUSION &amp; DECISION INTELLIGENCE</SectionTitle>
      <Text style={styles.boundary}>
        Research classification only • Never an order, recommendation, or executable instruction
      </Text>
      <Card
        title={assessment.classification}
        description={`${assessment.timeframe} • ${assessment.alignment}`}
      >
        <Text style={styles.primary}>
          Confidence {assessment.confidence.score ?? 'unavailable'} ({assessment.confidence.level})
        </Text>
        <Text style={styles.meta}>Readiness: {assessment.readiness.state}</Text>
        <Text style={styles.copy}>{assessment.explanation}</Text>
        <Text style={styles.positive}>
          Supporting: {assessment.dominantSupportingFactors.join(' • ') || 'none supplied'}
        </Text>
        <Text style={styles.warning}>
          Opposing: {assessment.dominantOpposingFactors.join(' • ') || 'none detected'}
        </Text>
        <Text style={styles.meta}>
          Risk {impact('RISK')} • Portfolio {impact('PORTFOLIO_FIT')} • Catalyst{' '}
          {impact('CATALYST')}
        </Text>
        <Text style={styles.meta}>
          Quality {assessment.dataQuality.overall} • stale{' '}
          {assessment.dataQuality.staleComponents.join(', ') || 'none'}
        </Text>
        <Text style={styles.warning}>
          Conflicts:{' '}
          {assessment.conflicts
            .map((conflict) => `${conflict.severity} ${conflict.code}`)
            .join(' • ') || 'none detected'}
        </Text>
        <Text style={styles.meta}>
          Provenance:{' '}
          {assessment.provenance.map((item) => `${item.provider}/${item.source}`).join(' • ') ||
            'unavailable'}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  boundary: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    marginBottom: theme.spacing.md,
  },
  primary: { color: theme.colors.primary, fontWeight: '700' },
  copy: { color: theme.colors.textMuted, lineHeight: 20, marginTop: theme.spacing.sm },
  positive: { color: theme.colors.success, marginTop: theme.spacing.sm },
  warning: { color: theme.colors.warning, marginTop: theme.spacing.sm },
  meta: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.sm,
    textTransform: 'uppercase',
  },
});
