import { demoFundamentalAnalysisService } from './demoService';
import type { FundamentalAnalysisService } from './types';
let service: FundamentalAnalysisService = demoFundamentalAnalysisService;
export const getFundamentalAnalysisService = () => service;
export const setFundamentalAnalysisService = (next: FundamentalAnalysisService) => {
  service = next;
};
