import type { Theme } from '@react-navigation/native';

import { colors } from './colors';
import { radii, spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  radii,
  typography,
} as const;

export const navigationTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
  fonts: {
    regular: { fontFamily: typography.fontFamily.regular, fontWeight: '400' },
    medium: { fontFamily: typography.fontFamily.medium, fontWeight: '500' },
    bold: { fontFamily: typography.fontFamily.bold, fontWeight: '700' },
    heavy: { fontFamily: typography.fontFamily.bold, fontWeight: '700' },
  },
};

export type AppTheme = typeof theme;
export { colors, radii, spacing, typography };
