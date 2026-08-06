import { FeatureScreen } from '@/features/shell/FeatureScreen';

export default function CongressionalIntelligenceScreen() {
  return (
    <FeatureScreen
      title="Congressional Intelligence"
      intro="Research public congressional disclosures and meaningful trading patterns."
      cards={[
        {
          title: 'Recent Disclosures',
          description: 'Newly reported transactions will appear here.',
          symbol: '⌂',
        },
        {
          title: 'Activity Trends',
          description: 'Sector and representative activity will be summarized here.',
          symbol: '▥',
        },
      ]}
    />
  );
}
