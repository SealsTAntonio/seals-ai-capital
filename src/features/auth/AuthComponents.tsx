import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components';
import { theme } from '@/theme';

export function AuthScreen({
  children,
  subtitle,
  title,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.brandText}>S</Text>
          </View>
          <Text style={styles.eyebrow}>SEALS AI CAPITAL</Text>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthInput({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor={theme.colors.textSubtle}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function AuthMessage({ message, success = false }: { message?: string; success?: boolean }) {
  return message ? (
    <Text
      accessibilityRole="alert"
      style={[styles.message, success ? styles.success : styles.error]}
    >
      {message}
    </Text>
  ) : null;
}

export function AuthButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <PrimaryButton disabled={loading} label={loading ? 'Please wait…' : label} onPress={onPress} />
  );
}

export function AuthLoadingState() {
  return (
    <SafeAreaView style={styles.loading}>
      <View style={styles.brand}>
        <Text style={styles.brandText}>S</Text>
      </View>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={styles.loadingText}>Securing your session…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { backgroundColor: theme.colors.background, flex: 1 },
  scroll: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.ml,
  },
  brand: {
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    width: 64,
  },
  brandText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 460,
    padding: theme.spacing.lg,
    width: '100%',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
    marginBottom: theme.spacing.sm,
  },
  field: { gap: theme.spacing.sm },
  label: { color: theme.colors.text, fontSize: theme.typography.fontSize.sm, fontWeight: '600' },
  input: {
    backgroundColor: theme.colors.backgroundElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
  },
  message: {
    borderRadius: theme.radii.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    padding: theme.spacing.sm,
  },
  error: { backgroundColor: '#2B171A', color: theme.colors.danger },
  success: { backgroundColor: '#13271F', color: theme.colors.success },
  loading: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  loadingText: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm },
});
