import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components';
import {
  ResearchWorkspace,
  isValidResearchSymbol,
  normalizeResearchSymbol,
} from '@/features/research';
import { theme } from '@/theme';
export default function ResearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string | string[] }>();
  const raw = (Array.isArray(params.symbol) ? params.symbol[0] : params.symbol) ?? '';
  const symbol = normalizeResearchSymbol(raw);
  return (
    <ScreenContainer
      eyebrow="INVESTMENT INTELLIGENCE"
      title={isValidResearchSymbol(symbol) ? `${symbol} Research` : 'Stock Research'}
    >
      {isValidResearchSymbol(symbol) ? (
        <>
          <Pressable style={styles.newsLink} onPress={() => router.push(`/news/${symbol}`)}>
            <Text style={styles.newsText}>OPEN {symbol} NEWS & CATALYSTS →</Text>
          </Pressable>
          <ResearchWorkspace symbol={symbol} />
        </>
      ) : null}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  newsLink: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newsText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
  },
});
