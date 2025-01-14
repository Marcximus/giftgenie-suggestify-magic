import { RateLimitConfig } from './types';
import { AMAZON_CONFIG } from './config';

export const calculateBackoffDelay = (
  retryCount: number,
  config: RateLimitConfig = {
    MAX_RETRIES: AMAZON_CONFIG.MAX_RETRIES,
    BASE_DELAY: AMAZON_CONFIG.BASE_RETRY_DELAY,
    BACKOFF_FACTOR: AMAZON_CONFIG.BACKOFF_FACTOR
  }
) => {
  return Math.min(
    config.BASE_DELAY * Math.pow(config.BACKOFF_FACTOR, retryCount),
    AMAZON_CONFIG.MAX_BACKOFF_DELAY
  );
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));