import { FeatureScreen } from '@/features/shell/FeatureScreen';

export default function PortfolioScreen() {
  return (
    <FeatureScreen
      title="Portfolio"
      intro="Understand performance, allocation, and exposure across your holdings."
      cards={[
        {
          title: 'Holdings',
          description: 'Positions and cost basis will be summarized here.',
          symbol: '◒',
        },
        {
          title: 'Performance',
          description: 'Portfolio returns and benchmarks will appear here.',
          symbol: '↗',
        },
        {
          title: 'Risk Overview',
          description: 'Concentration and portfolio risk intelligence.',
          symbol: '◇',
        },
      ]}
    />
  );
}
