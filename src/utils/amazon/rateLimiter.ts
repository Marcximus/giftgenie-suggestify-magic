export const calculateBackoffDelay = (attempt: number, baseDelay = 1000, maxDelay = 10000): number => {
  const delay = Math.min(
    baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
    maxDelay
  );
  return delay;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const requestLog: { timestamp: number }[] = [];
const RATE_LIMIT = {
  MAX_REQUESTS: 25,
  WINDOW_MS: 60000,
  RETRY_AFTER: 30
};

export const isRateLimited = () => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  requestLog.splice(0, requestLog.findIndex(req => req.timestamp > windowStart));
  return requestLog.length >= RATE_LIMIT.MAX_REQUESTS;
};

export const logRequest = () => {
  requestLog.push({ timestamp: Date.now() });
};

export const getRemainingRequests = () => {
  return RATE_LIMIT.MAX_REQUESTS - requestLog.length;
};