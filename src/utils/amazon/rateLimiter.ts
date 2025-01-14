interface RateLimitConfig {
  REQUESTS_PER_MINUTE: number;
  CONCURRENT_REQUESTS: number;
  COOLING_PERIOD: number;
  WARNING_THRESHOLD: number;
}

const RATE_LIMITS: RateLimitConfig = {
  REQUESTS_PER_MINUTE: 4,      // Allow 4 requests per minute
  CONCURRENT_REQUESTS: 2,      // 2 concurrent requests
  COOLING_PERIOD: 3000,        // 3 second cooling after warnings
  WARNING_THRESHOLD: 3         // Start cooling after 3 429s
};

export class RateLimiter {
  private requestLog: number[] = [];
  private warningCount = 0;
  private activeRequests = 0;
  private lastCoolingTime = 0;
  private static instance: RateLimiter;

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private isInCoolingPeriod(): boolean {
    return Date.now() - this.lastCoolingTime < RATE_LIMITS.COOLING_PERIOD;
  }

  async acquireSlot(): Promise<boolean> {
    // Clean old requests
    const now = Date.now();
    this.requestLog = this.requestLog.filter(time => 
      now - time < 60000
    );

    // Check if we can make a request
    if (
      this.activeRequests >= RATE_LIMITS.CONCURRENT_REQUESTS ||
      this.requestLog.length >= RATE_LIMITS.REQUESTS_PER_MINUTE ||
      this.isInCoolingPeriod()
    ) {
      return false;
    }

    this.activeRequests++;
    this.requestLog.push(now);
    return true;
  }

  releaseSlot(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  async handleResponse(status: number): Promise<void> {
    if (status === 429) {
      this.warningCount++;
      if (this.warningCount >= RATE_LIMITS.WARNING_THRESHOLD) {
        this.lastCoolingTime = Date.now();
        this.warningCount = 0;
        await new Promise(resolve => setTimeout(resolve, RATE_LIMITS.COOLING_PERIOD));
      }
    } else {
      this.warningCount = Math.max(0, this.warningCount - 1);
    }
  }
}

// Helper functions that use the singleton instance
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForRateLimit = async (retryCount = 0): Promise<void> => {
  const rateLimiter = RateLimiter.getInstance();
  while (!(await rateLimiter.acquireSlot())) {
    await sleep(1000);
  }
};

export const logRequest = (): void => {
  const rateLimiter = RateLimiter.getInstance();
  rateLimiter.acquireSlot();
};

export const handleRateLimitResponse = async (status: number): Promise<void> => {
  const rateLimiter = RateLimiter.getInstance();
  await rateLimiter.handleResponse(status);
};