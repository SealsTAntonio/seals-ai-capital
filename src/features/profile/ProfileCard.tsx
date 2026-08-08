import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, PrimaryButton } from '@/components';
import { AuthMessage } from '@/features/auth/AuthComponents';
import { useAuth } from '@/features/auth/AuthProvider';
import { theme } from '@/theme';

import { useProfile } from './ProfileProvider';

export function ProfileCard() {
  const { user } = useAuth();
  const { error, profile, retry, save, status } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  useEffect(() => setDisplayName(profile?.displayName ?? ''), [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(undefined);
    setSuccess(undefined);
    const result = await save(displayName);
    setSaveError(result.error);
    if (!result.error) setSuccess('Profile saved successfully.');
    setIsSaving(false);
  };

  if (status === 'signed-out' || !user) {
    return (
      <Card
        compact
        title="Account unavailable"
        description="Sign in to view your account profile."
      />
    );
  }

  if (status === 'loading' || status === 'missing') {
    return (
      <Card
        compact
        title="Preparing your profile"
        description="Setting up your secure SAC account profile…"
      >
        <ActivityIndicator accessibilityLabel="Loading profile" color={theme.colors.primary} />
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card compact title="Profile unavailable" description={error ?? undefined}>
        <PrimaryButton label="Try Again" onPress={() => void retry()} />
      </Card>
    );
  }

  return (
    <Card compact title="Account profile" description="Your identity within Seals AI Capital.">
      <View style={styles.field}>
        <Text style={styles.label}>EMAIL</Text>
        <Text style={styles.email}>{user.email ?? 'No email available'}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>DISPLAY NAME</Text>
        <TextInput
          accessibilityLabel="Display name"
          autoCapitalize="words"
          editable={!isSaving}
          maxLength={80}
          onChangeText={setDisplayName}
          placeholder="Add your name"
          placeholderTextColor={theme.colors.textSubtle}
          style={styles.input}
          value={displayName}
        />
      </View>
      <AuthMessage message={saveError} />
      {success ? (
        <Text accessibilityRole="alert" style={styles.success}>
          {success}
        </Text>
      ) : null}
      <PrimaryButton
        disabled={isSaving}
        label={isSaving ? 'Saving…' : 'Save Profile'}
        onPress={() => void handleSave()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  field: { gap: theme.spacing.xs },
  label: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
  },
  email: { color: theme.colors.text, fontSize: theme.typography.fontSize.md },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  success: { color: theme.colors.success, fontSize: theme.typography.fontSize.sm },
});
