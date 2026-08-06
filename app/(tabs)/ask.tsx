import { FeatureScreen } from '@/features/shell/FeatureScreen';

export default function AskScreen() {
  return (
    <FeatureScreen
      actionLabel="Start a conversation — coming soon"
      cards={[
        {
          title: 'Research Assistant',
          description: 'Ask questions about companies, sectors, and market themes.',
          symbol: '✦',
        },
        {
          title: 'Saved Research',
          description: 'Your saved conversations and research reports will live here.',
          symbol: '▤',
        },
      ]}
      intro="Turn complex market information into clear, disciplined investment research."
      title="Ask SAC AI"
    />
  );
}
