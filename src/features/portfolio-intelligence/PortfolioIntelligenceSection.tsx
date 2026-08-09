import { StyleSheet, Text, View } from 'react-native';

import { Card, SectionTitle } from '@/components';
import { theme } from '@/theme';

import type { PortfolioAssessment } from './types';

export function PortfolioIntelligenceSection({ assessment }: { assessment: PortfolioAssessment }) {
  const { exposure, concentration, diversification, riskBudget, allocation } = assessment;
  return (
    <View>
      <SectionTitle>PORTFOLIO INTELLIGENCE</SectionTitle>
      <Text style={styles.boundary}>
        Analytical only • No brokerage, orders, accounts, or automated trading
      </Text>
      <Card
        title="Portfolio Snapshot"
        description={`${assessment.snapshot.holdings.length} supplied holdings • ${assessment.dataQuality}`}
      >
        <Text style={styles.copy}>
          Gross {exposure.gross.value ?? 'unavailable'} • Net {exposure.net.value ?? 'unavailable'}{' '}
          • Long {exposure.long.value ?? 'unavailable'} • Short{' '}
          {exposure.short.value ?? 'unavailable'}
        </Text>
        <Text style={styles.meta}>
          Values label supplied, derived, and unavailable inputs in the domain result.
        </Text>
      </Card>
      <Card
        title="Concentration & Diversification"
        description={`${concentration.overall} • ${diversification.classification}`}
      >
        <Text style={styles.copy}>{concentration.explanation.join(' ')}</Text>
        <Text style={styles.meta}>Correlation: {diversification.correlationStatus}</Text>
      </Card>
      <Card
        title="Risk Budget & Allocation"
        description={`${riskBudget.status} • allocation ${allocation.comparisonStatus}`}
      >
        <Text style={styles.copy}>
          Aggregate risk {riskBudget.aggregateRisk ?? 'unavailable'} • utilization{' '}
          {riskBudget.utilization ?? 'unavailable'} • remaining{' '}
          {riskBudget.remainingCapacity ?? 'unavailable'}
        </Text>
      </Card>
      <Card title="Portfolio Conflicts" description={`${assessment.conflicts.length} detected`}>
        <Text style={styles.warning}>
          {assessment.conflicts
            .map((c) => `${c.severity}: ${c.code} (${c.resolution})`)
            .join(' • ') || 'No deterministic conflicts detected.'}
        </Text>
      </Card>
      <Card
        title="Opportunity-to-Portfolio Fit"
        description={`${assessment.opportunities.length} assessments`}
      >
        <Text style={styles.copy}>
          {assessment.opportunities.map((o) => `${o.symbol}: ${o.fit}`).join(' • ') ||
            'No ranked opportunities supplied.'}
        </Text>
      </Card>
      <Card title="Portfolio Readiness" description={assessment.readiness.state}>
        <Text style={styles.copy}>{assessment.readiness.reasons.join(' ')}</Text>
        <Text style={styles.meta}>
          Missing: {assessment.missingInputs.join(' • ') || 'none'} • Provenance:{' '}
          {assessment.provenance.map((p) => `${p.provider}/${p.source}`).join(' • ') ||
            'unavailable'}
        </Text>
        <Text style={styles.copy}>{assessment.explanation}</Text>
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
  copy: { color: theme.colors.textMuted, lineHeight: 20 },
  meta: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.sm,
  },
  warning: { color: theme.colors.warning },
});
