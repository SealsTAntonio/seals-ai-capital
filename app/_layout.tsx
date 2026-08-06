import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { navigationTheme, theme } from '@/theme';

export default function RootLayout() {
  return (
    <ThemeProvider value={{ ...DarkTheme, ...navigationTheme }}>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false,
        }}
      />
    </ThemeProvider>
  );
}
