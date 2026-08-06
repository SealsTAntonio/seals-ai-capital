import { FeatureScreen } from '@/features/shell/FeatureScreen';

export default function WatchlistScreen() {
  return (
    <FeatureScreen
      title="Watchlist"
      intro="Keep your highest-conviction ideas organized and ready for review."
      cards={[
        {
          title: 'My Watchlist',
          description: 'Symbols, prices, and daily changes will appear here.',
          symbol: '★',
        },
        {
          title: 'Upcoming Catalysts',
          description: 'Earnings, events, and alerts for followed companies.',
          symbol: '◷',
        },
      ]}
    />
  );
}
