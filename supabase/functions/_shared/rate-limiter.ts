interface RequestLog {
  timestamp: number;
}

const requestLog: RequestLog[] = [];

export const RATE_LIMIT = {
  WINDOW_MS: 60000, // 60 seconds
  MAX_REQUESTS: 30, // Maximum requests per minute
  RETRY_AFTER: 30 // Seconds to wait before retrying
};

export function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  
  // Clean up old requests
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  console.log(`Current request count: ${recentRequests.length}/${RATE_LIMIT.MAX_REQUESTS}`);
  
  return recentRequests.length >= RATE_LIMIT.MAX_REQUESTS;
}

export function logRequest(): void {
  requestLog.push({ timestamp: Date.now() });
}