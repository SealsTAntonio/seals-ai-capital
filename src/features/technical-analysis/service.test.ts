// eslint-disable-next-line import/no-unresolved
import { describe, expect, it, vi } from 'vitest';

import {
  clearTechnicalCache,
  createTechnicalAnalysisService,
  requestTechnicalAnalysis,
  setTechnicalMarketDataProvider,
  TechnicalAnalysisError,
} from './service';
import type { MarketDataProvider } from './types';
const provider = (
  status: 'real' | 'partial' | 'demo' | 'unavailable' | 'error' = 'unavailable',
): MarketDataProvider => ({
  name: 'test',
  async getHistoricalSeries(symbol, timeframe) {
    return {
      series: null,
      provenance: {
        status,
        provider: 'test',
        source: 'fixture',
        retrievedAt: new Date().toISOString(),
        freshness: 'unknown',
        symbol,
        timeframe,
        error: status === 'error' ? { code: 'upstream', message: 'failed' } : null,
      },
    };
  },
});
describe('technical service', () => {
  it.each(['real', 'partial', 'demo', 'unavailable', 'error'] as const)(
    'preserves %s provenance',
    async (status) => {
      expect(
        (await createTechnicalAnalysisService(provider(status)).analyze('AAPL', '1D')).provenance
          .status,
      ).toBe(status);
    },
  );
  it('rejects invalid symbols and timeframes', async () => {
    await expect(
      createTechnicalAnalysisService(provider()).analyze('$BAD', '1D'),
    ).rejects.toBeInstanceOf(TechnicalAnalysisError);
    await expect(
      createTechnicalAnalysisService(provider()).analyze('AAPL', '2h' as never),
    ).rejects.toMatchObject({ code: 'invalid-timeframe' });
  });
  it('preserves provider errors without demo fallback', async () => {
    const bad: MarketDataProvider = {
      name: 'bad',
      getHistoricalSeries: async () => {
        throw new Error('upstream failed');
      },
    };
    await expect(createTechnicalAnalysisService(bad).analyze('AAPL', '1D')).rejects.toMatchObject({
      code: 'provider-error',
    });
  });
  it('deduplicates in-flight requests and keys by timeframe', async () => {
    clearTechnicalCache();
    const p = provider(),
      spy = vi.spyOn(p, 'getHistoricalSeries');
    setTechnicalMarketDataProvider(p);
    const [a, b] = await Promise.all([
      requestTechnicalAnalysis('AAPL', '1D'),
      requestTechnicalAnalysis('AAPL', '1D'),
    ]);
    expect(a).toBe(b);
    expect(spy).toHaveBeenCalledTimes(1);
    await requestTechnicalAnalysis('AAPL', '1W');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
