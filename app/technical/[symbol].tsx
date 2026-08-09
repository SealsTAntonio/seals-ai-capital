import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components';
import {
  isValidTechnicalSymbol,
  normalizeTechnicalSymbol,
  TechnicalWorkspace,
} from '@/features/technical-analysis';
import { theme } from '@/theme';
export default function TechnicalScreen() {
  const router = useRouter(),
    params = useLocalSearchParams<{ symbol?: string | string[] }>(),
    raw = (Array.isArray(params.symbol) ? params.symbol[0] : params.symbol) ?? '',
    symbol = normalizeTechnicalSymbol(raw);
  return (
    <ScreenContainer
      eyebrow="TECHNICAL ANALYSIS"
      title={isValidTechnicalSymbol(symbol) ? `${symbol} Technicals` : 'Technical Analysis'}
    >
      {isValidTechnicalSymbol(symbol) ? (
        <>
          <Pressable style={styles.link} onPress={() => router.push(`/research/${symbol}`)}>
            <Text style={styles.text}>OPEN COMPLETE RESEARCH →</Text>
          </Pressable>
          <TechnicalWorkspace symbol={symbol} />
        </>
      ) : (
        <Text style={styles.invalid}>
          Select a valid ticker from Watchlist, Portfolio, Research, or Dashboard.
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
