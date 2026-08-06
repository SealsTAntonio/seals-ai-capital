import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, ScreenContainer, SectionTitle } from '@/components';
import { theme } from '@/theme';

const destinations = [
  ['/day-trading', 'Day Trading', 'Intraday plans and setups'],
  ['/congressional-intelligence', 'Congressional Intelligence', 'Public disclosure research'],
  ['/trade-journal', 'Trade Journal', 'Review and improve your process'],
] as const;

export default function SettingsScreen() {
  return (
    <ScreenContainer title="Settings">
      <SectionTitle>RESEARCH TOOLS</SectionTitle>
      <View style={styles.links}>
        {destinations.map(([href, title, description]) => (
          <Link key={href} href={href} style={styles.link}>
            <Text style={styles.linkTitle}>{title}</Text>
            <Text style={styles.linkDescription}>{description} →</Text>
          </Link>
        ))}
      </View>
      <SectionTitle>PREFERENCES</SectionTitle>
      <Card
        title="Application Preferences"
        description="Theme, notifications, data, and account preferences will be configured here."
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  links: { gap: theme.spacing.sm },
  link: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  linkTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  linkDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
});
