import { AMAZON_CONFIG } from './config';

interface RequestLog {
  timestamp: number;
  endpoint: string;
}

const requestLogs: RequestLog[] = [];
const WINDOW_MS = 60000; // 1 minute window

export const isRateLimited = (endpoint: string): boolean => {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  // Clean up old requests
  const recentRequests = requestLogs.filter(req => req.timestamp > windowStart);
  requestLogs.length = 0;
  requestLogs.push(...recentRequests);
  
  // Count requests for this endpoint
  const endpointRequests = recentRequests.filter(req => req.endpoint === endpoint).length;
  
  console.log(`Rate limit check for ${endpoint}: ${endpointRequests}/${AMAZON_CONFIG.MAX_CONCURRENT_REQUESTS} requests in last minute`);
  
  return endpointRequests >= AMAZON_CONFIG.MAX_CONCURRENT_REQUESTS;
};

export const logRequest = (endpoint: string): void => {
  requestLogs.push({ 
    timestamp: Date.now(),
    endpoint 
  });
};

export const calculateBackoffDelay = (retryCount: number): number => {
  const baseDelay = AMAZON_CONFIG.BASE_RETRY_DELAY;
  const maxDelay = AMAZON_CONFIG.MAX_BACKOFF_DELAY;
  const backoffFactor = AMAZON_CONFIG.BACKOFF_FACTOR;
  
  // Calculate exponential backoff with jitter
  const delay = Math.min(
    baseDelay * Math.pow(backoffFactor, retryCount),
    maxDelay
  );
  
  // Add random jitter (±20% of delay)
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return delay + jitter;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));