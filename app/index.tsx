import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/theme';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { duration: 900, toValue: 1, useNativeDriver: true }),
      Animated.timing(translateY, { duration: 900, toValue: 0, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => router.replace('/(tabs)'), 2200);
    return () => clearTimeout(timer);
  }, [opacity, translateY]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.glow} />
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.name}>SEALS AI CAPITAL</Text>
        <View style={styles.rule} />
        <Text style={styles.mission}>
          Research First.{`\n`}Profit Second.{`\n`}Protect Capital Always.
        </Text>
      </Animated.View>
      <Text style={styles.footer}>INTELLIGENT INVESTMENT RESEARCH</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 260,
    height: 520,
    opacity: 0.35,
    position: 'absolute',
    width: 520,
  },
  content: { alignItems: 'center', padding: theme.spacing.xl },
  logo: {
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.24,
    shadowRadius: 26,
    width: 88,
  },
  logoText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700',
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    letterSpacing: 4,
  },
  rule: {
    backgroundColor: theme.colors.primary,
    height: 1,
    marginVertical: theme.spacing.lg,
    width: 48,
  },
  mission: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 27,
    textAlign: 'center',
  },
  footer: {
    bottom: theme.spacing.xl,
    color: theme.colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    position: 'absolute',
  },
});
