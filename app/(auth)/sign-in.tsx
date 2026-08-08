import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthButton, AuthInput, AuthMessage, AuthScreen } from '@/features/auth/AuthComponents';
import { useAuth } from '@/features/auth/AuthProvider';
import { validateEmail, validatePassword } from '@/features/auth/validation';
import { theme } from '@/theme';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const validation = validateEmail(email) ?? validatePassword(password);
    if (validation) return setMessage(validation);
    setLoading(true);
    setMessage(undefined);
    const result = await signIn(email.trim(), password);
    setMessage(result.error);
    setLoading(false);
  };
  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to continue to your research dashboard.">
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
        autoComplete="current-password"
        onSubmitEditing={() => void submit()}
      />
      <AuthMessage message={message} />
      <AuthButton label="Sign In" loading={loading} onPress={() => void submit()} />
      <Link href="/create-account" style={styles.link}>
        Need an account? Create one
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
