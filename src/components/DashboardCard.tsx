import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type DashboardCardProps = PropsWithChildren<{ title: string; icon: ReactNode; action?: string }>;

export function DashboardCard({ action = 'VIEW ALL', children, icon, title }: DashboardCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.action}>{action} ›</Text>
      </View>
      <View style={styles.divider} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    minHeight: 210,
    padding: theme.spacing.ml,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.sm,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
  },
  action: { color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  divider: {
    backgroundColor: theme.colors.borderSubtle,
    height: 1,
    marginVertical: theme.spacing.md,
  },
});
