import { RateLimitInfo } from './types.ts';

const requestLog: RateLimitInfo[] = [];
const RATE_LIMIT = {
  MAX_REQUESTS: 5,
  WINDOW_MS: 10000, // 10 seconds
};

export function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  return recentRequests.length >= RATE_LIMIT.MAX_REQUESTS;
}

export function logRequest() {
  requestLog.push({ timestamp: Date.now(), count: 1 });
}