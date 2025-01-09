export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 24, // Doubled from 12 to process more requests in parallel
  STAGGER_DELAY: 2, // Reduced from 5ms to 2ms for faster sequential requests
  MAX_RETRIES: 1,
  BASE_RETRY_DELAY: 100, // Reduced from 250ms to 100ms
  MAX_BACKOFF_DELAY: 500, // Reduced from 1000ms to 500ms
  BACKOFF_FACTOR: 1.05 // Reduced from 1.1 to 1.05 for gentler backoff
};