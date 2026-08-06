import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { NavIcon } from '@/components/NavIcon';
import { theme } from '@/theme';

const icons: Record<string, string> = {
  index: '◆',
  ask: '✦',
  watchlist: '★',
  portfolio: '◒',
  settings: '⚙',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => (
          <NavIcon color={color} size={size} symbol={icons[route.name] ?? '•'} />
        ),
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask AI' }} />
      <Tabs.Screen name="watchlist" options={{ title: 'Watchlist' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Tabs.Screen name="settings" options={{ title: 'More' }} />
      <Tabs.Screen name="day-trading" options={{ href: null }} />
      <Tabs.Screen name="congressional-intelligence" options={{ href: null }} />
      <Tabs.Screen name="trade-journal" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: theme.colors.background },
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: Platform.select({ ios: 84, default: 68 }),
    paddingBottom: Platform.select({ ios: 24, default: 8 }),
    paddingTop: 8,
  },
  label: { fontSize: 11, fontWeight: theme.typography.fontWeight.semibold },
});
