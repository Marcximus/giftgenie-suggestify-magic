import { AmazonProduct } from './types';

const MAX_CACHE_SIZE = 100;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const productCache = new Map<string, { data: AmazonProduct; timestamp: number }>();

export const clearStaleCache = () => {
  const now = Date.now();
  let deletedCount = 0;
  
  // Remove stale entries and trim cache if too large
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
  productCache.set(cacheKey, { data: product, timestamp: Date.now() });
};