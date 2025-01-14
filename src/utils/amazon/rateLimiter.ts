const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Reduced from 10 to 5 requests per minute
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
  config = {
    BASE_DELAY: 2000,
    BACKOFF_FACTOR: 2,
    MAX_DELAY: 30000
  }
) => {
  return Math.min(
    config.BASE_DELAY * Math.pow(config.BACKOFF_FACTOR, retryCount),
    config.MAX_DELAY
  );
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForRateLimit = async (retryCount = 0) => {
  if (isRateLimited()) {
    const delay = calculateBackoffDelay(retryCount);
    console.log(`Rate limited, waiting ${delay}ms before retry`);
    await sleep(delay);
    return waitForRateLimit(retryCount + 1);
  }
};