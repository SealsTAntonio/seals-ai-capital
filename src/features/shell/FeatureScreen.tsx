import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, ScreenContainer, SectionTitle } from '@/components';
import { theme } from '@/theme';

type FeatureCard = { title: string; description: string; symbol: string };

type FeatureScreenProps = {
  title: string;
  intro: string;
  cards: FeatureCard[];
  actionLabel?: string;
};

export function FeatureScreen({ actionLabel, cards, intro, title }: FeatureScreenProps) {
  return (
    <ScreenContainer title={title}>
      <Text style={styles.intro}>{intro}</Text>
      <SectionTitle>WORKSPACE</SectionTitle>
      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.title} style={styles.gridItem}>
            <Card
              description={card.description}
              icon={<Text style={styles.icon}>{card.symbol}</Text>}
              title={card.title}
            />
          </View>
        ))}
      </View>
      {actionLabel ? <PrimaryButton disabled label={actionLabel} /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.md, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  gridItem: { flexBasis: 280, flexGrow: 1 },
  icon: { color: theme.colors.primary, fontSize: 20, fontWeight: '700' },
});
