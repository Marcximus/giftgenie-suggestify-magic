import { AmazonProduct } from './types';

const MAX_CACHE_SIZE = 500;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 500;

interface CacheEntry {
  data: AmazonProduct;
  timestamp: number;
}

// Use a Map for O(1) lookups and better performance
const productCache = new Map<string, CacheEntry>();

// Add localStorage persistence with lazy loading
let isInitialized = false;

const initializeCache = () => {
  if (isInitialized) return;
  
  try {
    const cached = localStorage.getItem('amazonProductCache');
    if (cached) {
      const entries = JSON.parse(cached);
      entries.forEach(([key, value]: [string, CacheEntry]) => {
        productCache.set(key, value);
      });
    }
    isInitialized = true;
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

// Optimized cache cleanup with batch processing
const clearStaleCache = () => {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  for (const [key, value] of productCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION || productCache.size > MAX_CACHE_SIZE) {
      entriesToDelete.push(key);
    }
  }
  
  if (entriesToDelete.length > 0) {
    entriesToDelete.forEach(key => productCache.delete(key));
    saveCacheToStorage();
    console.log(`Cleared ${entriesToDelete.length} stale cache entries`);
  }
};

export const getCachedProduct = (cacheKey: string): AmazonProduct | null => {
  initializeCache();
  clearStaleCache();
  
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Cache hit for:', cacheKey);
    return cached.data;
  }
  console.log('Cache miss for:', cacheKey);
  return null;
};

export const cacheProduct = (cacheKey: string, product: AmazonProduct) => {
  initializeCache();
  clearStaleCache();
  
  productCache.set(cacheKey, { data: product, timestamp: Date.now() });
  saveCacheToStorage();
  console.log('Cached product:', cacheKey);
};

// Optimized retry mechanism with exponential backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = RETRY_ATTEMPTS,
  initialDelay: number = RETRY_DELAY
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
      
      const backoffDelay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError || new Error('Operation failed after all retry attempts');
};