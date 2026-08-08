import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export function EmptyState({
  message,
  symbol = '◇',
  title,
}: {
  title: string;
  message: string;
  symbol?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.symbol}>{symbol}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg },
  symbol: { color: theme.colors.primary, fontSize: 24 },
  title: { color: theme.colors.text, fontSize: theme.typography.fontSize.md, fontWeight: '700' },
  message: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
