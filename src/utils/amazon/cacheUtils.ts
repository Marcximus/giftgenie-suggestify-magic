import { AmazonProduct } from './types';

const MAX_CACHE_SIZE = 100;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

interface CacheEntry {
  data: AmazonProduct;
  timestamp: number;
}

const productCache = new Map<string, CacheEntry>();

export const clearStaleCache = () => {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, value] of productCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION || productCache.size - deletedCount > MAX_CACHE_SIZE) {
      productCache.delete(key);
      deletedCount++;
    }
  }
};

export const getCachedProduct = (cacheKey: string): AmazonProduct | null => {
  clearStaleCache();
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Cache hit for:', cacheKey);
    return cached.data;
  }
  return null;
};

export const cacheProduct = (cacheKey: string, product: AmazonProduct) => {
  clearStaleCache(); // Ensure we clear stale entries before adding new ones
  productCache.set(cacheKey, { data: product, timestamp: Date.now() });
  console.log('Cached product:', cacheKey);
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      // Don't retry on 404s or if it's the last attempt
      if (error.status === 404 || attempt === maxAttempts) {
        throw error;
      }
      
      // Wait before retrying, with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError || new Error('Operation failed after all retry attempts');
};