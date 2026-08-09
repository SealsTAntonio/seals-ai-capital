import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, SectionTitle } from '@/components';
import type {
  PositionSizingInput,
  PositionSizingResult,
  RiskAssessment,
} from '@/features/risk-intelligence';
import { theme } from '@/theme';

import type { RankedOpportunity } from './types';

export type OpportunityView =
  | 'top'
  | 'bullish'
  | 'bearish'
  | 'confidence'
  | 'momentum'
  | 'risk'
  | 'conflicts'
  | 'incomplete'
  | 'upcoming-catalysts'
  | 'recent-catalysts'
  | 'catalyst-risk'
  | 'positive-catalysts'
  | 'negative-catalysts'
  | 'context-conflicts'
  | 'market-context'
  | 'sector-context';

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
  if (view === 'upcoming-catalysts')
    return copy.filter((item) => (item.context?.upcomingCatalystCount ?? 0) > 0);
  if (view === 'recent-catalysts')
    return copy.filter((item) => (item.context?.recentCatalystCount ?? 0) > 0);
  if (view === 'catalyst-risk')
    return copy.filter((item) => (item.context?.catalystRisks.length ?? 0) > 0);
  if (view === 'positive-catalysts')
    return copy.filter((item) => item.context?.catalystDirection === 'potentially-supportive');
  if (view === 'negative-catalysts')
    return copy.filter((item) => item.context?.catalystDirection === 'potentially-adverse');
  if (view === 'context-conflicts')
    return copy.filter((item) => (item.context?.contextConflicts.length ?? 0) > 0);
  if (view === 'market-context') return copy.filter((item) => item.context?.marketContext);
  if (view === 'sector-context') return copy.filter((item) => item.context?.sectorContext);
  return copy;
};

/** Shared presentation for Dashboard, Watchlist, Research, Technical, Fundamental, and Portfolio surfaces. */
export function OpportunityWorkspace({
  opportunities,
  view = 'top',
  riskIntelligence = {},
}: {
  opportunities: RankedOpportunity[];
  view?: OpportunityView;
  /** Optional Sprint 2.7 enrichment keyed by symbol; older callers require no changes. */
  riskIntelligence?: Record<
    string,
    {
      assessment: RiskAssessment;
      positionSizingInput?: PositionSizingInput;
      positionSizingResult?: PositionSizingResult;
    }
  >;
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
            {item.context ? (
              <View>
                <Text style={styles.context}>Catalysts: {item.context.catalystSummary}</Text>
                <Text style={styles.meta}>
                  Upcoming {item.context.upcomingCatalystCount} • Recent{' '}
                  {item.context.recentCatalystCount} • Context {item.context.dataStatus}
                </Text>
                {item.context.contextConflicts.length ? (
                  <Text style={styles.warning}>
                    Context conflicts: {item.context.contextConflicts.join(' • ')}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {riskIntelligence[item.symbol] ? (
              <RiskReadinessSection intelligence={riskIntelligence[item.symbol]!} />
            ) : null}
          </Card>
        ))
      )}
    </View>
  );
}

function RiskReadinessSection({
  intelligence,
}: {
  intelligence: {
    assessment: RiskAssessment;
    positionSizingInput?: PositionSizingInput;
    positionSizingResult?: PositionSizingResult;
  };
}) {
  const { assessment, positionSizingInput: sizing, positionSizingResult: result } = intelligence;
  const major = assessment.components
    .filter((component) => component.value !== null)
    .sort((a, b) => b.value! - a.value!)
    .slice(0, 3);
  return (
    <View style={styles.riskSection}>
      <Text style={styles.riskTitle}>RISK &amp; TRADE READINESS</Text>
      <Text style={styles.meta}>
        Composite {assessment.opportunity.compositeScore ?? '—'}/100 • Rank #
        {assessment.opportunity.rank} • Risk {assessment.score ?? 'unavailable'}/100
      </Text>
      <Text style={styles.classification}>
        {assessment.classification ?? 'Incomplete Risk Assessment'} •{' '}
        {assessment.relationship ?? 'Relationship unavailable'}
      </Text>
      <Text style={styles.context}>
        Catalyst: {assessment.opportunity.context?.catalystSummary ?? 'unavailable'}
      </Text>
      <Text style={styles.context}>Readiness: {assessment.tradeReadiness.state}</Text>
      {major.length ? (
        <Text style={styles.warning}>
          Major factors:{' '}
          {major.map((factor) => `${factor.category} ${factor.value}/100`).join(' • ')}
        </Text>
      ) : null}
      {assessment.conflicts.length ? (
        <Text style={styles.warning}>
          Conflicts: {assessment.conflicts.map((conflict) => conflict.code).join(' • ')}
        </Text>
      ) : null}
      {sizing ? (
        <Text style={styles.meta}>
          Sizing inputs: equity {sizing.accountEquity ?? '—'} • entry {sizing.entryPrice ?? '—'} •
          stop {sizing.stopPrice ?? '—'} • max risk {sizing.maximumRiskPercentage ?? '—'}%
        </Text>
      ) : null}
      {result ? (
        <Text style={styles.context}>
          Sizing {result.status}: max shares {result.suggestedMaximumShares ?? 'unavailable'} •
          notional {result.positionNotionalValue ?? 'unavailable'} • estimated stop loss{' '}
          {result.estimatedLossAtStop ?? 'unavailable'}
        </Text>
      ) : null}
      <Text style={styles.meta}>
        Quality {assessment.dataQuality} • confidence {assessment.confidence ?? 'unavailable'}
      </Text>
      {assessment.missingInputs.length ? (
        <Text style={styles.warning}>Missing: {assessment.missingInputs.join(' • ')}</Text>
      ) : null}
      <Text style={styles.copy}>{assessment.explanation}</Text>
      <Text style={styles.meta}>
        Provenance:{' '}
        {assessment.provenance.map((source) => `${source.provider}/${source.source}`).join(' • ') ||
          'unavailable'}
      </Text>
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
  context: { color: theme.colors.textMuted, marginTop: theme.spacing.sm },
  riskSection: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  riskTitle: { color: theme.colors.text, fontWeight: '700' },
});
