import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

/**
 * Empty application entry point. Feature routes are intentionally deferred to
 * later sprints; this keeps Expo Router bootable while the foundation evolves.
 */
export default function IndexRoute() {
  return <View accessibilityLabel="Seals AI Capital" style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
