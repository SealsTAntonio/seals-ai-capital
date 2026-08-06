import { FeatureScreen } from '@/features/shell/FeatureScreen';

export default function TradeJournalScreen() {
  return (
    <FeatureScreen
      title="Trade Journal"
      intro="Document decisions, review outcomes, and improve your process."
      cards={[
        {
          title: 'Recent Trades',
          description: 'Your latest journal entries will appear here.',
          symbol: '▤',
        },
        {
          title: 'Performance Review',
          description: 'Patterns, statistics, and lessons from past trades.',
          symbol: '↗',
        },
      ]}
    />
  );
}
