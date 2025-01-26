import { RateLimitConfig } from './types';
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

export const calculateBackoffDelay = (
  retryCount: number,
  config: RateLimitConfig = {
    MAX_RETRIES: AMAZON_CONFIG.MAX_RETRIES,
    BASE_DELAY: AMAZON_CONFIG.BASE_RETRY_DELAY,
    BACKOFF_FACTOR: AMAZON_CONFIG.BACKOFF_FACTOR
  }
): number => {
  const delay = Math.min(
    config.BASE_DELAY * Math.pow(config.BACKOFF_FACTOR, retryCount),
    AMAZON_CONFIG.MAX_BACKOFF_DELAY
  );
  
  // Add jitter to prevent thundering herd
  return delay + (Math.random() * 200);
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));