interface RateLimitConfig {
  MAX_RETRIES: number;
  BASE_DELAY: number;
  BACKOFF_FACTOR: number;
}

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestLog: number[] = [];

export const isRateLimited = () => {
  const now = Date.now();
  // Remove requests older than the window
  while (requestLog.length && requestLog[0] < now - RATE_LIMIT_WINDOW) {
    requestLog.shift();
  }
  return requestLog.length >= MAX_REQUESTS_PER_WINDOW;
};

export const logRequest = () => {
  requestLog.push(Date.now());
};

export const calculateBackoffDelay = (
  retryCount: number,
  config: RateLimitConfig = {
    MAX_RETRIES: 3,
    BASE_DELAY: 2000,
    BACKOFF_FACTOR: 2
  }
) => {
  return Math.min(
    config.BASE_DELAY * Math.pow(config.BACKOFF_FACTOR, retryCount),
    30000 // Max delay of 30 seconds
  );
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));