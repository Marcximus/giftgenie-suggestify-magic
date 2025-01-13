const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 10000; // 10 seconds
const JITTER = 0.1; // 10% random jitter

export function calculateBackoffDelay(attempt: number): number {
  // Exponential backoff with jitter
  const exponentialDelay = Math.min(
    BASE_DELAY * Math.pow(2, attempt),
    MAX_DELAY
  );
  
  // Add random jitter
  const jitterAmount = exponentialDelay * JITTER;
  const jitter = Math.random() * jitterAmount;
  
  return Math.floor(exponentialDelay + jitter);
}