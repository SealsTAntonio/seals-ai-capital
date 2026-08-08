import { StyleSheet, Text, View } from 'react-native';

import { DashboardCard, ScreenContainer, SectionTitle, StatCard } from '@/components';
import { theme } from '@/theme';

const watchlist = [
  ['NVDA', 'NVIDIA', '$184.86', '+2.41%'],
  ['MSFT', 'Microsoft', '$417.52', '+0.76%'],
  ['AMZN', 'Amazon', '$212.31', '−0.34%'],
] as const;

const news = [
  ['Markets weigh rate outlook as technology leads', '12 MIN AGO'],
  ['Semiconductor demand remains resilient into Q3', '38 MIN AGO'],
] as const;

function GoldIcon({ children }: { children: string }) {
  return <Text style={styles.icon}>{children}</Text>;
}

export default function DashboardScreen() {
  return (
    <ScreenContainer title="Dashboard">
      <View style={styles.hero}>
        <Text style={styles.kicker}>FRIDAY, AUGUST 7</Text>
        <Text style={styles.greeting}>Good morning, Investor.</Text>
        <Text style={styles.subtitle}>Your disciplined research briefing is ready.</Text>
      </View>
      <SectionTitle>MARKET PULSE</SectionTitle>
      <View style={styles.stats}>
        <StatCard change="+0.68%" label="S&P 500" value="6,389.45" />
        <StatCard change="+0.91%" label="NASDAQ" value="21,242.70" />
        <StatCard change="−1.24%" label="VIX" positive={false} value="15.42" />
      </View>
      <SectionTitle>DAILY INTELLIGENCE</SectionTitle>
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <DashboardCard icon={<GoldIcon>↗</GoldIcon>} title="Market Overview">
            <View style={styles.breadth}>
              <Text style={styles.bigValue}>72%</Text>
              <View>
                <Text style={styles.detailTitle}>Positive breadth</Text>
                <Text style={styles.detail}>8 of 11 sectors advancing</Text>
              </View>
            </View>
            <View style={styles.meter}>
              <View style={styles.meterFill} />
            </View>
          </DashboardCard>
        </View>
        <View style={styles.gridItem}>
          <DashboardCard icon={<GoldIcon>★</GoldIcon>} title="Today's Watchlist">
            {watchlist.map(([ticker, name, price, change], index) => (
              <View key={ticker} style={[styles.row, index > 0 && styles.rowBorder]}>
                <View style={styles.ticker}>
                  <Text style={styles.tickerText}>{ticker}</Text>
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{name}</Text>
                  <Text style={styles.rowCaption}>{price}</Text>
                </View>
                <Text style={[styles.change, change.startsWith('−') && styles.negative]}>
                  {change}
                </Text>
              </View>
            ))}
          </DashboardCard>
        </View>
        <View style={styles.gridItem}>
          <DashboardCard icon={<GoldIcon>◒</GoldIcon>} title="Portfolio Snapshot">
            <Text style={styles.caption}>TOTAL VALUE</Text>
            <Text style={styles.portfolioValue}>$248,620.40</Text>
            <Text style={styles.change}>+$3,184.20 (+1.30%) today</Text>
            <View style={styles.allocation}>
              <View style={[styles.allocationPart, { flex: 6 }]} />
              <View style={[styles.allocationPart, styles.allocationSecondary, { flex: 3 }]} />
              <View style={[styles.allocationPart, styles.allocationCash, { flex: 1 }]} />
            </View>
          </DashboardCard>
        </View>
        <View style={styles.gridItem}>
          <DashboardCard action="EXPLORE" icon={<GoldIcon>✦</GoldIcon>} title="AI Insights">
            <View style={styles.insight}>
              <Text style={styles.insightLabel}>DAILY SIGNAL</Text>
              <Text style={styles.insightTitle}>Momentum remains constructive</Text>
              <Text style={styles.detail}>
                Large-cap technology leadership is broadening, while volatility continues to ease.
              </Text>
              <Text style={styles.confidence}>HIGH CONFIDENCE • Updated 8:42 AM</Text>
            </View>
          </DashboardCard>
        </View>
        <View style={styles.gridItem}>
          <DashboardCard icon={<GoldIcon>⌂</GoldIcon>} title="Congressional Activity">
            <Text style={styles.caption}>LATEST DISCLOSURE</Text>
            <Text style={styles.insightTitle}>Representative reported MSFT purchase</Text>
            <Text style={styles.detail}>Transaction range: $15,001–$50,000</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>TECHNOLOGY • 2 DAYS AGO</Text>
            </View>
          </DashboardCard>
        </View>
        <View style={styles.gridItem}>
          <DashboardCard icon={<GoldIcon>▤</GoldIcon>} title="Market News">
            {news.map(([headline, time], index) => (
              <View key={headline} style={[styles.newsRow, index > 0 && styles.rowBorder]}>
                <View style={styles.newsDot} />
                <View style={styles.rowCopy}>
                  <Text style={styles.newsTitle}>{headline}</Text>
                  <Text style={styles.caption}>{time}</Text>
                </View>
              </View>
            ))}
          </DashboardCard>
        </View>
      </View>
      <Text style={styles.disclaimer}>
        Illustrative market data for product demonstration only.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { gap: theme.spacing.xs },
  kicker: { color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  greeting: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.md },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  gridItem: { flexBasis: 310, flexGrow: 1 },
  icon: { color: theme.colors.primary, fontSize: 17, fontWeight: '700' },
  breadth: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.md },
  bigValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
  },
  detailTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  detail: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    marginTop: 3,
  },
  meter: {
    backgroundColor: theme.colors.borderSubtle,
    borderRadius: 4,
    height: 6,
    marginTop: theme.spacing.lg,
    overflow: 'hidden',
  },
  meterFill: { backgroundColor: theme.colors.success, height: '100%', width: '72%' },
  row: { alignItems: 'center', flexDirection: 'row', paddingVertical: 8 },
  rowBorder: { borderTopColor: theme.colors.borderSubtle, borderTopWidth: 1 },
  ticker: {
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radii.sm,
    height: 34,
    justifyContent: 'center',
    width: 48,
  },
  tickerText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
  },
  rowCopy: { flex: 1, paddingHorizontal: theme.spacing.sm },
  rowTitle: { color: theme.colors.text, fontSize: theme.typography.fontSize.sm, fontWeight: '600' },
  rowCaption: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  change: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
  },
  negative: { color: theme.colors.danger },
  caption: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  portfolioValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    marginVertical: 5,
  },
  allocation: { flexDirection: 'row', gap: 3, height: 7, marginTop: theme.spacing.lg },
  allocationPart: { backgroundColor: theme.colors.primary, borderRadius: 4 },
  allocationSecondary: { backgroundColor: theme.colors.info },
  allocationCash: { backgroundColor: theme.colors.textSubtle },
  insight: {
    backgroundColor: theme.colors.backgroundElevated,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 2,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
  },
  insightLabel: { color: theme.colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  insightTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    lineHeight: 22,
    marginVertical: theme.spacing.sm,
  },
  confidence: {
    color: theme.colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: theme.spacing.md,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.full,
    marginTop: theme.spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: { color: theme.colors.primary, fontSize: 9, fontWeight: '700' },
  newsRow: { alignItems: 'flex-start', flexDirection: 'row', paddingVertical: theme.spacing.sm },
  newsDot: {
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
    height: 5,
    marginTop: 7,
    width: 5,
  },
  newsTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    lineHeight: 19,
  },
  disclaimer: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
});
