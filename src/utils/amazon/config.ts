export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 32, // Increased from 24 for more parallel processing
  STAGGER_DELAY: 1, // Reduced from 2ms to 1ms for faster sequential requests
  MAX_RETRIES: 1,
  BASE_RETRY_DELAY: 50, // Reduced from 100ms to 50ms
  MAX_BACKOFF_DELAY: 250, // Reduced from 500ms to 250ms
  BACKOFF_FACTOR: 1.02 // Reduced from 1.05 for gentler backoff
};