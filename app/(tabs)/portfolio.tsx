import { useState } from 'react';
import { RefreshControl, StyleSheet, Text } from 'react-native';

import { ScreenContainer, SectionTitle } from '@/components';
import { type EnrichedPosition, useInvestments } from '@/features/investments';
import {
  InvestmentState,
  PortfolioEmptyState,
  PortfolioRow,
  PortfolioSummary,
  PositionEditor,
} from '@/features/investments/InvestmentComponents';
import { theme } from '@/theme';

export default function PortfolioScreen() {
  const investments = useInvestments();
  const [editing, setEditing] = useState<EnrichedPosition | null>(null);
  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={investments.refreshing}
          onRefresh={() =>
            void Promise.all([investments.refresh(), investments.refreshMarketData()])
          }
          tintColor={theme.colors.primary}
        />
      }
      title="Portfolio"
    >
      <Text style={styles.intro}>
        Track current positions and derived performance without connecting a brokerage or placing
        trades.
      </Text>
      <PositionEditor
        initial={editing}
        key={editing?.id ?? 'new'}
        message={investments.mutationError}
        onCancel={editing ? () => setEditing(null) : undefined}
        onSave={async (...values) => {
          const saved = await investments.savePosition(...values);
          if (saved) setEditing(null);
          return saved;
        }}
        saving={investments.saving}
      />
      <SectionTitle>PORTFOLIO SNAPSHOT</SectionTitle>
      {investments.loading ? (
        <InvestmentState kind="loading" />
      ) : investments.error ? (
        <InvestmentState kind="error" onRetry={() => void investments.refresh()} />
      ) : investments.positions.length === 0 ? (
        <PortfolioEmptyState />
      ) : (
        <>
          <PortfolioSummary totals={investments.totals} />
          {investments.enrichedPositions.map((position) => (
            <PortfolioRow
              key={position.id}
              position={position}
              onEdit={() => setEditing(position)}
              onRemove={() => void investments.removePosition(position.symbol)}
            />
          ))}
        </>
      )}
      <Text style={styles.disclaimer}>
        Returns are unrealized estimates derived from saved cost basis and available market
        snapshots. Demo market data is illustrative, not live.
      </Text>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  intro: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.md, lineHeight: 24 },
  disclaimer: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
});
