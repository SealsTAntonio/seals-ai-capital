import { StyleSheet, Text } from 'react-native';

type NavIconProps = { color: string; symbol: string; size?: number };

export function NavIcon({ color, size = 20, symbol }: NavIconProps) {
  return <Text style={[styles.icon, { color, fontSize: size }]}>{symbol}</Text>;
}

const styles = StyleSheet.create({
  icon: { fontWeight: '700', lineHeight: 24, textAlign: 'center' },
});
