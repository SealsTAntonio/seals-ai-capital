import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthButton, AuthInput, AuthMessage, AuthScreen } from '@/features/auth/AuthComponents';
import { useAuth } from '@/features/auth/AuthProvider';
import { validateEmail, validatePassword } from '@/features/auth/validation';
import { theme } from '@/theme';

export default function CreateAccountScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const validation =
      validateEmail(email) ??
      validatePassword(password) ??
      (!confirm ? 'Confirm your password.' : undefined) ??
      (password !== confirm ? 'Passwords do not match.' : undefined);
    if (validation) {
      setSuccess(false);
      return setMessage(validation);
    }
    setLoading(true);
    setMessage(undefined);
    const result = await signUp(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setSuccess(false);
      return setMessage(result.error);
    }
    if (result.confirmationRequired) {
      setSuccess(true);
      setMessage('Account created. Check your email to confirm your account, then sign in.');
    } else router.replace('/(tabs)');
  };
  return (
    <AuthScreen
      title="Create your account"
      subtitle="Start building a disciplined investment research process."
    >
      <AuthInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />
      <AuthInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
      <AuthInput
        label="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        onSubmitEditing={() => void submit()}
      />
      <AuthMessage message={message} success={success} />
      <AuthButton label="Create Account" loading={loading} onPress={() => void submit()} />
      <Link href="/sign-in" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </AuthScreen>
  );
}
const styles = StyleSheet.create({
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    padding: theme.spacing.sm,
    textAlign: 'center',
  },
});
