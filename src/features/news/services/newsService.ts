import type { NewsService } from '../types';

import { demoNewsService } from './demoNewsService';
let service: NewsService = demoNewsService;
export const getNewsService = () => service;
export const setNewsService = (next: NewsService) => {
  service = next;
};
