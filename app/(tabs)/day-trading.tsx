import { FeatureScreen } from '@/features/shell/FeatureScreen';

export default function DayTradingScreen() {
  return (
    <FeatureScreen
      title="Day Trading"
      intro="A disciplined workspace for intraday setups and market context."
      cards={[
        {
          title: 'Trading Plan',
          description: 'Plan entry, target, invalidation, and position size.',
          symbol: '↗',
        },
        {
          title: 'Live Setups',
          description: 'Qualified intraday opportunities will appear here.',
          symbol: '◎',
        },
      ]}
    />
  );
}
