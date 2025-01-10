export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 8, // Increased from 4 to 8
  STAGGER_DELAY: 0, // Keep at 0 for maximum speed
  MAX_RETRIES: 1,
  BASE_RETRY_DELAY: 25, // Keep at 25ms
  MAX_BACKOFF_DELAY: 100,
  BACKOFF_FACTOR: 1.01
};