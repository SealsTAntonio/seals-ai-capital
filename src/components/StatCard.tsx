import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type StatCardProps = { label: string; value: string; change?: string; positive?: boolean };

export function StatCard({ change, label, positive = true, value }: StatCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {change ? (
          <Text style={[styles.change, positive ? styles.positive : styles.negative]}>
            {change}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radii.md,
    flex: 1,
    minWidth: 120,
    padding: theme.spacing.md,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  valueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  value: { color: theme.colors.text, fontSize: theme.typography.fontSize.lg, fontWeight: '700' },
  change: { fontSize: theme.typography.fontSize.xs, fontWeight: '700' },
  positive: { color: theme.colors.success },
  negative: { color: theme.colors.danger },
});
