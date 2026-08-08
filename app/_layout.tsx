import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthLoadingState } from '@/features/auth/AuthComponents';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { navigationTheme, theme } from '@/theme';

export default function RootLayout() {
  return (
    <ThemeProvider value={{ ...DarkTheme, ...navigationTheme }}>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <AuthProvider>
        <AuthenticatedNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthenticatedNavigator() {
  const { isLoading, session } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/welcome');
    if (session && inAuthGroup) router.replace('/(tabs)');
  }, [isLoading, router, segments, session]);

  if (isLoading) return <AuthLoadingState />;
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
      }}
    />
  );
}
