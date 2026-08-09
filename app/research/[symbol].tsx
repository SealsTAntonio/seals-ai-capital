import { useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components';
import {
  ResearchWorkspace,
  isValidResearchSymbol,
  normalizeResearchSymbol,
} from '@/features/research';
export default function ResearchScreen() {
  const params = useLocalSearchParams<{ symbol?: string | string[] }>();
  const raw = (Array.isArray(params.symbol) ? params.symbol[0] : params.symbol) ?? '';
  const symbol = normalizeResearchSymbol(raw);
  return (
    <ScreenContainer
      eyebrow="INVESTMENT INTELLIGENCE"
      title={isValidResearchSymbol(symbol) ? `${symbol} Research` : 'Stock Research'}
    >
      {isValidResearchSymbol(symbol) ? <ResearchWorkspace symbol={symbol} /> : null}
    </ScreenContainer>
  );
}
