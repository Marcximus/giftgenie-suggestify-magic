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
  const delay = Math.min(
    config.BASE_DELAY * Math.pow(config.BACKOFF_FACTOR, retryCount),
    AMAZON_CONFIG.MAX_BACKOFF_DELAY
  );
  console.log(`Calculated backoff delay: ${delay}ms for retry ${retryCount}`);
  return delay;
};

export const sleep = async (ms: number) => {
  console.log(`Sleeping for ${ms}ms`);
  return new Promise(resolve => setTimeout(resolve, ms));
};