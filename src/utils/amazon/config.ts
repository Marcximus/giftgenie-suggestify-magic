export const AMAZON_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 3, // Reduced from 8
  STAGGER_DELAY: 500, // Increased from 50
  MAX_RETRIES: 5,
  BASE_RETRY_DELAY: 2000, // Increased from 500
  MAX_BACKOFF_DELAY: 30000,
  BACKOFF_FACTOR: 2,
  API_KEY: 'b02e14f147msh4e5ea1d0ce31f8dp1f5f5djsn4e7a814ecc16',
  RAPID_API_HOST: 'real-time-amazon-data.p.rapidapi.com'
};