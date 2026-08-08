import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, ScreenContainer, SectionTitle } from '@/components';
import { AuthMessage } from '@/features/auth/AuthComponents';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileCard } from '@/features/profile/ProfileCard';
import { theme } from '@/theme';

const destinations = [
  ['/day-trading', 'Day Trading', 'Intraday plans and setups'],
  ['/congressional-intelligence', 'Congressional Intelligence', 'Public disclosure research'],
  ['/trade-journal', 'Trade Journal', 'Review and improve your process'],
] as const;

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string>();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError(undefined);
    const result = await signOut();
    setError(result.error);
    setIsSigningOut(false);
  };

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
      <SectionTitle>ACCOUNT</SectionTitle>
      <ProfileCard />
      <Card compact title="Session" description={user?.email ?? 'Signed out'}>
        <AuthMessage message={error} />
        <PrimaryButton
          disabled={isSigningOut}
          label={isSigningOut ? 'Signing Out…' : 'Sign Out'}
          onPress={() => void handleSignOut()}
        />
      </Card>
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
