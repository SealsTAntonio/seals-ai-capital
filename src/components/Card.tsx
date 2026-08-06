import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type CardProps = PropsWithChildren<{
  title: string;
  description?: string;
  icon?: ReactNode;
}>;

export function Card({ children, description, icon, title }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.headingRow}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </View>
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
    gap: theme.spacing.md,
    minHeight: 142,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  accent: {
    backgroundColor: theme.colors.primary,
    height: 2,
    left: theme.spacing.lg,
    position: 'absolute',
    top: 0,
    width: 36,
  },
  headingRow: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.md },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  copy: { flex: 1 },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    marginTop: theme.spacing.xs,
  },
});
