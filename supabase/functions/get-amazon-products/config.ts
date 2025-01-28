export const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

export const API_CONFIG = {
  TIMEOUT: 5000, // Reduced from 8000 to 5000ms
  MAX_RETRIES: 3,
  BATCH_SIZE: 4,
  RATE_LIMIT_WINDOW: 60000, // 1 minute in milliseconds
  MAX_REQUESTS_PER_WINDOW: 50,
  STAGGER_DELAY: 250,
  BASE_RETRY_DELAY: 1000,
  MAX_BACKOFF_DELAY: 10000
};