interface RequestLog {
  timestamp: number;
}

const requestLog: RequestLog[] = [];

export const RATE_LIMIT = {
  WINDOW_MS: 60000, // 60 seconds
  MAX_REQUESTS: 15, // Reduced from 20 to be more conservative
  RETRY_AFTER: 30, // Seconds to wait before retrying
  BACKOFF_MS: 1000, // Base backoff delay in milliseconds
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

export function getBackoffDelay(attempt: number): number {
  return Math.min(
    RATE_LIMIT.BACKOFF_MS * Math.pow(2, attempt),
    RATE_LIMIT.WINDOW_MS
  );
}