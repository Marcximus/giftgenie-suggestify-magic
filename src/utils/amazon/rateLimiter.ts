interface RateLimitConfig {
  REQUESTS_PER_MINUTE: number;
  CONCURRENT_REQUESTS: number;
  COOLING_PERIOD: number;
  WARNING_THRESHOLD: number;
}

const RATE_LIMITS: RateLimitConfig = {
  REQUESTS_PER_MINUTE: 2,      // Reduced from 4
  CONCURRENT_REQUESTS: 1,      // Reduced from 2
  COOLING_PERIOD: 5000,        // Increased from 3000
  WARNING_THRESHOLD: 2         // Reduced from 3
};

export class RateLimiter {
  private static instance: RateLimiter;
  private requestLog: number[] = [];
  private warningCount = 0;
  private activeRequests = 0;
  private lastCoolingTime = 0;
  private subscriptionErrorCount = 0;

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

    // Check if we're in a cooling period or have hit limits
    if (
      this.activeRequests >= RATE_LIMITS.CONCURRENT_REQUESTS ||
      this.requestLog.length >= RATE_LIMITS.REQUESTS_PER_MINUTE ||
      this.isInCoolingPeriod()
    ) {
      console.log('Rate limit reached, waiting...');
      return false;
    }

    // Check if we've had subscription errors
    if (this.subscriptionErrorCount > 0) {
      console.error('API subscription issues detected');
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
      console.warn(`Rate limit warning ${this.warningCount}/${RATE_LIMITS.WARNING_THRESHOLD}`);
      
      if (this.warningCount >= RATE_LIMITS.WARNING_THRESHOLD) {
        this.lastCoolingTime = Date.now();
        this.warningCount = 0;
        console.log(`Entering cooling period for ${RATE_LIMITS.COOLING_PERIOD}ms`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMITS.COOLING_PERIOD));
      }
    } else if (status === 403) {
      this.subscriptionErrorCount++;
      console.error('API subscription error detected');
      // Reset after 5 minutes
      setTimeout(() => {
        this.subscriptionErrorCount = Math.max(0, this.subscriptionErrorCount - 1);
      }, 300000);
    } else {
      this.warningCount = Math.max(0, this.warningCount - 1);
    }
  }
}

export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const waitForRateLimit = async (retryCount = 0): Promise<void> => {
  const rateLimiter = RateLimiter.getInstance();
  let attempts = 0;
  const maxAttempts = 5;

  while (!(await rateLimiter.acquireSlot())) {
    if (attempts >= maxAttempts) {
      throw new Error('Max rate limit wait attempts exceeded');
    }
    console.log(`Waiting for rate limit (attempt ${attempts + 1}/${maxAttempts})`);
    await sleep(2000 * Math.pow(2, attempts));
    attempts++;
  }
};

export const logRequest = (): void => {
  const rateLimiter = RateLimiter.getInstance();
  rateLimiter.acquireSlot().catch(console.error);
};

export const handleRateLimitResponse = async (status: number): Promise<void> => {
  const rateLimiter = RateLimiter.getInstance();
  await rateLimiter.handleResponse(status);
};