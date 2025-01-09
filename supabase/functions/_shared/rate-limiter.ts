interface RequestLog {
  timestamp: number;
}

const requestLog: RequestLog[] = [];

export const RATE_LIMIT = {
  WINDOW_MS: 30000, // 30 seconds
  MAX_REQUESTS: 15, // Maximum requests per 30 seconds
  RETRY_AFTER: 15 // Seconds to wait before retrying
};

export function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  return recentRequests.length >= RATE_LIMIT.MAX_REQUESTS;
}

export function logRequest(): void {
  requestLog.push({ timestamp: Date.now() });
}