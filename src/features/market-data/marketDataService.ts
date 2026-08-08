import { getMarketDataEnvironment } from '@/config/env';

import { demoMarketDataService } from './demoMarketDataService';
import { MarketDataError, type MarketDataService } from './types';

// A production adapter must call the trusted backend, which owns provider credentials.
let service: MarketDataService = demoMarketDataService;
let hasInjectedService = false;

export function getMarketDataService(): MarketDataService {
  if (getMarketDataEnvironment().mode === 'backend' && !hasInjectedService) {
    throw new MarketDataError(
      'The trusted-backend market data adapter has not been installed.',
      'unavailable',
    );
  }
  return service;
}

/** Dependency-injection seam for a backend adapter and deterministic tests. */
export function setMarketDataService(nextService: MarketDataService): void {
  service = nextService;
  hasInjectedService = true;
}
