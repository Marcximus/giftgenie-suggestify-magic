import { AmazonProduct } from './types';

const MAX_CACHE_SIZE = 500; // Increased from 100
const CACHE_DURATION = 24 * 60 * 60 * 1000; // Increased to 24 hours
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 500;

interface CacheEntry {
  data: AmazonProduct;
  timestamp: number;
}

// Use a Map for O(1) lookups
const productCache = new Map<string, CacheEntry>();

// Add localStorage persistence
const loadCacheFromStorage = () => {
  try {
    const cached = localStorage.getItem('amazonProductCache');
    if (cached) {
      const entries = JSON.parse(cached);
      entries.forEach(([key, value]: [string, CacheEntry]) => {
        productCache.set(key, value);
      });
    }
  } catch (error) {
    console.warn('Failed to load cache from storage:', error);
  }
};

const saveCacheToStorage = () => {
  try {
    localStorage.setItem('amazonProductCache', 
      JSON.stringify(Array.from(productCache.entries()))
    );
  } catch (error) {
    console.warn('Failed to save cache to storage:', error);
  }
};

// Initialize cache from localStorage
loadCacheFromStorage();

export const clearStaleCache = () => {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, value] of productCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION || productCache.size - deletedCount > MAX_CACHE_SIZE) {
      productCache.delete(key);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    saveCacheToStorage();
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
  clearStaleCache();
  productCache.set(cacheKey, { data: product, timestamp: Date.now() });
  saveCacheToStorage();
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
      
      if (error.status === 404 || attempt === maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError || new Error('Operation failed after all retry attempts');
};