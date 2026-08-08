import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components';
import { AuthScreen } from '@/features/auth/AuthComponents';
import { theme } from '@/theme';

export default function WelcomeScreen() {
  return (
    <AuthScreen
      title="Research with conviction"
      subtitle="Securely access your Seals AI Capital research workspace."
    >
      <Text style={styles.mission}>Research First. Profit Second. Protect Capital Always.</Text>
      <Link href="/sign-in" asChild>
        <PrimaryButton label="Sign In" />
      </Link>
      <Link href="/create-account" style={styles.link}>
        New to SAC? Create an account
      </Link>
    </AuthScreen>
  );
}
const styles = StyleSheet.create({
  mission: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 25,
    marginBottom: theme.spacing.sm,
  },
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    padding: theme.spacing.sm,
    textAlign: 'center',
  },
});
