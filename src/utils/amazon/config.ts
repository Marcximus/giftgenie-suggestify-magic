export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 8, // Increased from 5 to 8
  STAGGER_DELAY: 50, // Decreased from 200ms to 50ms
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY: 500, // Decreased from 1000ms to 500ms
  MAX_BACKOFF_DELAY: 3000, // Decreased from 5000ms to 3000ms
  BACKOFF_FACTOR: 2
};