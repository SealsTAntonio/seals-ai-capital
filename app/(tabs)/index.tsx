import { StyleSheet, Text, View } from 'react-native';

import { Card, ScreenContainer, SectionTitle } from '@/components';
import { theme } from '@/theme';

const dashboardCards = [
  ['Market Overview', 'Major indices, movers, and market breadth will appear here.', '↗'],
  ["Today's Watchlist", 'Track the names and catalysts that matter today.', '★'],
  ['Portfolio Snapshot', 'View allocation, performance, and risk at a glance.', '◒'],
  ['AI Insights', 'Research summaries and actionable intelligence from SAC AI.', '✦'],
  ['Market News', 'A focused feed of high-impact financial headlines.', '▤'],
  ['Congressional Activity', 'Monitor disclosed trades from members of Congress.', '⌂'],
] as const;

export default function DashboardScreen() {
  return (
    <ScreenContainer title="Dashboard">
      <View>
        <Text style={styles.greeting}>Your research command center</Text>
        <Text style={styles.subtitle}>Research first. Profit second. Protect capital always.</Text>
      </View>
      <SectionTitle>DAILY BRIEFING</SectionTitle>
      <View style={styles.grid}>
        {dashboardCards.map(([title, description, symbol]) => (
          <View key={title} style={styles.gridItem}>
            <Card
              description={description}
              icon={<Text style={styles.icon}>{symbol}</Text>}
              title={title}
            />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight['2xl'],
  },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.md, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  gridItem: { flexBasis: 280, flexGrow: 1 },
  icon: { color: theme.colors.primary, fontSize: 20, fontWeight: '700' },
});
