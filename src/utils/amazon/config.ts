export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 10, // Increased from 8 to 10
  STAGGER_DELAY: 50, // Reduced from 100ms to 50ms
  MAX_RETRIES: 1,
  BASE_RETRY_DELAY: 10, // Reduced from 25ms to 10ms
  MAX_BACKOFF_DELAY: 100,
  BACKOFF_FACTOR: 1.01
};