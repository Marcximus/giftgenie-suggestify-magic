const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Reduced from 5
const requestLog: number[] = [];

export const isRateLimited = () => {
  const now = Date.now();
  while (requestLog.length && requestLog[0] < now - RATE_LIMIT_WINDOW) {
    requestLog.shift();
  }
  return requestLog.length >= MAX_REQUESTS_PER_WINDOW;
};

export const logRequest = () => {
  requestLog.push(Date.now());
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const calculateBackoffDelay = (
  retryCount: number,
  baseDelay = 2000,
  maxDelay = 30000
) => {
  const delay = Math.min(
    baseDelay * Math.pow(2, retryCount),
    maxDelay
  );
  console.log(`Rate limited, waiting ${delay}ms before retry`);
  return delay;
};

export const waitForRateLimit = async (retryCount = 0) => {
  if (isRateLimited()) {
    const delay = calculateBackoffDelay(retryCount);
    await sleep(delay);
    return waitForRateLimit(retryCount + 1);
  }
};