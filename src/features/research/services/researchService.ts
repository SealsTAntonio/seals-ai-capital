import type { ResearchService } from '../types';

import { demoResearchService } from './demoResearchService';
let service: ResearchService = demoResearchService;
export const getResearchService = () => service;
export const setResearchService = (next: ResearchService) => {
  service = next;
};
