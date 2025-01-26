interface CacheItem<T> {
  value: T;
  timestamp: number;
  context: string;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;
const MEMORY_CACHE = new Map<string, CacheItem<any>>();

// Initialize cache from localStorage
const initializeCache = () => {
  try {
    const localStorageCache = localStorage.getItem('amazonProductCache');
    if (localStorageCache) {
      const entries = JSON.parse(localStorageCache);
      entries.forEach(([key, value]: [string, CacheItem<any>]) => {
        if (Date.now() - value.timestamp <= CACHE_EXPIRY) {
          MEMORY_CACHE.set(key, value);
        }
      });
    }
    console.log('Cache initialized with', MEMORY_CACHE.size, 'entries');
  } catch (error) {
    console.warn('Failed to load cache from storage:', error);
  }
};

// Save cache to localStorage
const saveCacheToStorage = () => {
  try {
    localStorage.setItem('amazonProductCache', 
      JSON.stringify(Array.from(MEMORY_CACHE.entries()))
    );
  } catch (error) {
    console.warn('Failed to save cache to storage:', error);
    clearStaleCache(); // Try to free up space
  }
};

// Optimized cache cleanup
const clearStaleCache = () => {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  for (const [key, value] of MEMORY_CACHE.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY || MEMORY_CACHE.size > MAX_CACHE_SIZE) {
      entriesToDelete.push(key);
    }
  }
  
  if (entriesToDelete.length > 0) {
    entriesToDelete.forEach(key => MEMORY_CACHE.delete(key));
    saveCacheToStorage();
    console.log(`Cleared ${entriesToDelete.length} stale cache entries`);
  }
};

// Get cached product with localStorage fallback and context filtering
export const getCachedProduct = <T>(key: string, context: string = 'gift'): T | null => {
  // Initialize cache if needed
  if (MEMORY_CACHE.size === 0) {
    initializeCache();
  }
  
  // Clean up stale entries
  clearStaleCache();
  
  // Check memory cache first
  const cached = MEMORY_CACHE.get(key);
  if (cached && 
      Date.now() - cached.timestamp < CACHE_EXPIRY && 
      cached.context === context) {
    console.log('Memory cache hit for:', key, 'with context:', context);
    return cached.value;
  }
  
  console.log('Cache miss for:', key, 'with context:', context);
  return null;
};

// Cache product in both memory and localStorage with context
export const cacheProduct = <T>(key: string, value: T, context: string = 'gift'): void => {
  if (MEMORY_CACHE.size === 0) {
    initializeCache();
  }
  
  clearStaleCache();
  
  const cacheEntry: CacheItem<T> = {
    value,
    timestamp: Date.now(),
    context
  };

  MEMORY_CACHE.set(key, cacheEntry);
  saveCacheToStorage();
  console.log('Cached product:', key, 'with context:', context);
};

// Initialize cache when module loads
initializeCache();

// Clean up expired items periodically
setInterval(clearStaleCache, 60 * 60 * 1000); // Every hour