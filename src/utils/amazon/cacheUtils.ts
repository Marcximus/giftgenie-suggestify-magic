import { AmazonProduct } from './types';

const MAX_CACHE_SIZE = 500;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 500;

interface CacheEntry {
  data: AmazonProduct;
  timestamp: number;
}

// Use both memory and localStorage for caching
const productCache = new Map<string, CacheEntry>();

// Initialize cache from localStorage
const initializeCache = () => {
  try {
    const localStorageCache = localStorage.getItem('amazonProductCache');
    if (localStorageCache) {
      const entries = JSON.parse(localStorageCache);
      entries.forEach(([key, value]: [string, CacheEntry]) => {
        if (Date.now() - value.timestamp <= CACHE_DURATION) {
          productCache.set(key, value);
        }
      });
    }
    console.log('Cache initialized with', productCache.size, 'entries');
  } catch (error) {
    console.warn('Failed to load cache from storage:', error);
  }
};

// Save cache to localStorage
const saveCacheToStorage = () => {
  try {
    localStorage.setItem('amazonProductCache', 
      JSON.stringify(Array.from(productCache.entries()))
    );
  } catch (error) {
    console.warn('Failed to save cache to storage:', error);
  }
};

// Optimized cache cleanup
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

// Get cached product with localStorage fallback
export const getCachedProduct = (cacheKey: string): AmazonProduct | null => {
  // Initialize cache if needed
  if (productCache.size === 0) {
    initializeCache();
  }
  
  // Clean up stale entries
  clearStaleCache();
  
  // Check memory cache first
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Memory cache hit for:', cacheKey);
    return cached.data;
  }
  
  console.log('Cache miss for:', cacheKey);
  return null;
};

// Cache product in both memory and localStorage
export const cacheProduct = (cacheKey: string, product: AmazonProduct) => {
  if (productCache.size === 0) {
    initializeCache();
  }
  
  clearStaleCache();
  
  const cacheEntry = { data: product, timestamp: Date.now() };
  productCache.set(cacheKey, cacheEntry);
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