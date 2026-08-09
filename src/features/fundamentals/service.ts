import { getFundamentalDataEnvironment } from '@/config/env';

import { demoFundamentalAnalysisService } from './demoService';
import { createSecEdgarProvider } from './secEdgarProvider';
import type {
  FundamentalAnalysisService,
  FundamentalDataProvider,
  FundamentalResponse,
  FundamentalSnapshot,
} from './types';

function providerService(provider: FundamentalDataProvider): FundamentalAnalysisService {
  const summary = async (symbol: string): Promise<FundamentalResponse<FundamentalSnapshot>> => {
    const snapshot = await provider.getSnapshot(symbol);
    const now = new Date().toISOString();
    return snapshot
      ? {
          data: snapshot,
          status: 'success',
          source: snapshot.source,
          fetchedAt: snapshot.fetchedAt,
          staleAfter: snapshot.staleAfter,
          environment: snapshot.environment,
        }
      : {
          data: null,
          status: 'empty',
          source: provider.name,
          fetchedAt: now,
          staleAfter: new Date(Date.now() + 300_000).toISOString(),
          environment: 'real',
        };
  };
  const statement = async (symbol: string) => {
    const response = await summary(symbol);
    return {
      ...response,
      data: response.data
        ? {
            company: response.data.company,
            period: response.data.period,
            metrics: response.data.metrics,
          }
        : null,
    };
  };
  const metrics = async (symbol: string) => {
    const response = await summary(symbol);
    return { ...response, data: response.data?.metrics ?? null };
  };
  return {
    getCompanyOverview: summary,
    getFundamentalSummary: summary,
    getIncomeStatement: statement,
    getBalanceSheet: statement,
    getCashFlow: statement,
    getProfitabilityMetrics: metrics,
    getGrowthMetrics: metrics,
    getValuationMetrics: metrics,
    getFinancialHealthMetrics: metrics,
    async getHistoricalFundamentals(symbol, frequency) {
      const response = await summary(symbol);
      const data = response.data?.history.filter((period) => period.frequency === frequency) ?? [];
      return { ...response, data, status: data.length ? 'success' : 'empty' };
    },
    async getFundamentalScoreInputs(symbol) {
      const response = await summary(symbol);
      const data = response.data?.scoreInputs ?? [];
      return { ...response, data, status: data.length ? 'success' : 'empty' };
    },
  };
}

let injectedService: FundamentalAnalysisService | null = null;
let configuredService: FundamentalAnalysisService | null = null;
export const getFundamentalAnalysisService = () => {
  if (injectedService) return injectedService;
  if (configuredService) return configuredService;
  const environment = getFundamentalDataEnvironment();
  configuredService =
    environment.mode === 'sec'
      ? providerService(createSecEdgarProvider(environment.secUserAgent as string))
      : demoFundamentalAnalysisService;
  return configuredService;
};
export const setFundamentalAnalysisService = (next: FundamentalAnalysisService) => {
  injectedService = next;
};

export { providerService as createFundamentalDataService };
