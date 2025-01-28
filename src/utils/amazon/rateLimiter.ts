interface RequestLog {
  timestamp: number;
  endpoint: string;
}

const requestLog: RequestLog[] = [];

export const AMAZON_CONFIG = {
  BASE_RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  BATCH_SIZE: 4,
  STAGGER_DELAY: 200
};

export const isRateLimited = (endpoint: string): boolean => {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  // Clean up old requests
  const recentRequests = requestLog.filter(req => 
    req.timestamp > windowStart && req.endpoint === endpoint
  );
  
  // Update request log
  const activeRequests = requestLog.filter(req => 
    !(req.timestamp <= windowStart && req.endpoint === endpoint)
  );
  requestLog.length = 0;
  requestLog.push(...activeRequests);
  
  return recentRequests.length >= 30; // 30 requests per minute limit
};

export const logRequest = (endpoint: string): void => {
  requestLog.push({ 
    timestamp: Date.now(),
    endpoint 
  });
};

export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));