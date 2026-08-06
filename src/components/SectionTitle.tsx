import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rule} />
      <Text style={styles.title}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
  rule: { backgroundColor: theme.colors.primary, height: 16, width: 3 },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
});
