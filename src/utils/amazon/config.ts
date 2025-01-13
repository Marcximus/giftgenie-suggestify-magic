export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 5, // Reduced from 10 to 5
  STAGGER_DELAY: 200, // Increased from 50ms to 200ms
  MAX_RETRIES: 3, // Increased from 1 to 3
  BASE_RETRY_DELAY: 1000, // Increased from 10ms to 1000ms
  MAX_BACKOFF_DELAY: 5000, // Increased from 100ms to 5000ms
  BACKOFF_FACTOR: 2 // Increased from 1.01 to 2
};