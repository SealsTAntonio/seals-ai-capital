import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type HeaderProps = {
  title: string;
  eyebrow?: string;
};

export function Header({ title, eyebrow = 'SEALS AI CAPITAL' }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandMark} accessibilityElementsHidden>
        <Text style={styles.brandMarkText}>S</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={styles.status}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>MARKETS OPEN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  brandMarkText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  copy: { flex: 1 },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.xl,
  },
  status: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.full,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDot: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.radii.full,
    height: 6,
    width: 6,
  },
  statusText: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
});
