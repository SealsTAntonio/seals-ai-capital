import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/Header';
import { theme } from '@/theme';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
}>;

export function ScreenContainer({ children, eyebrow, title }: ScreenContainerProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Header eyebrow={eyebrow} title={title} />
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: theme.colors.background, flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    alignSelf: 'center',
    gap: theme.spacing.xl,
    maxWidth: 1080,
    paddingHorizontal: theme.spacing.ml,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing['2xl'],
    width: '100%',
  },
});
