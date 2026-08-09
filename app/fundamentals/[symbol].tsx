import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components';
import { FundamentalWorkspace } from '@/features/fundamentals';
import { isValidResearchSymbol, normalizeResearchSymbol } from '@/features/research';
import { theme } from '@/theme';
export default function FundamentalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string | string[] }>();
  const raw = (Array.isArray(params.symbol) ? params.symbol[0] : params.symbol) ?? '';
  const symbol = normalizeResearchSymbol(raw);
  return (
    <ScreenContainer
      eyebrow="FUNDAMENTAL ANALYSIS"
      title={isValidResearchSymbol(symbol) ? `${symbol} Fundamentals` : 'Fundamental Analysis'}
    >
      {isValidResearchSymbol(symbol) ? (
        <>
          <Pressable style={styles.link} onPress={() => router.push(`/research/${symbol}`)}>
            <Text style={styles.text}>OPEN COMPLETE RESEARCH →</Text>
          </Pressable>
          <FundamentalWorkspace symbol={symbol} />
        </>
      ) : (
        <Text style={styles.invalid}>
          Select a valid ticker from Watchlist, Portfolio, Dashboard, or Research.
        </Text>
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  text: { color: theme.colors.primary, fontSize: theme.typography.fontSize.xs, fontWeight: '700' },
  invalid: { color: theme.colors.textMuted },
});
