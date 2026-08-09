import { useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components';
import { isValidNewsSymbol, normalizeNewsSymbol, SymbolNewsWorkspace } from '@/features/news';
export default function SymbolNewsScreen() {
  const p = useLocalSearchParams<{ symbol?: string | string[] }>();
  const s = normalizeNewsSymbol((Array.isArray(p.symbol) ? p.symbol[0] : p.symbol) ?? '');
  return (
    <ScreenContainer
      eyebrow="NEWS & CATALYST INTELLIGENCE"
      title={isValidNewsSymbol(s) ? `${s} News` : 'Company News'}
    >
      {isValidNewsSymbol(s) ? <SymbolNewsWorkspace symbol={s} /> : null}
    </ScreenContainer>
  );
}
