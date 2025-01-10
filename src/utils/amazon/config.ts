export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 48, // Increased from 32
  STAGGER_DELAY: 0, // Removed delay between requests
  MAX_RETRIES: 1,
  BASE_RETRY_DELAY: 25, // Reduced from 50ms
  MAX_BACKOFF_DELAY: 100, // Reduced from 250ms
  BACKOFF_FACTOR: 1.01 // Reduced from 1.02
};