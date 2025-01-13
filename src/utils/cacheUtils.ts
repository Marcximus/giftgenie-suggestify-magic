interface CacheItem<T> {
  value: T;
  timestamp: number;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MEMORY_CACHE = new Map<string, CacheItem<any>>();

export const getProductCache = async <T>(key: string): Promise<T | null> => {
  // Check memory cache first
  const memoryItem = MEMORY_CACHE.get(key);
  if (memoryItem && Date.now() - memoryItem.timestamp < CACHE_EXPIRY) {
    return memoryItem.value;
  }

  // Check localStorage
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item) as CacheItem<T>;
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
        // Update memory cache
        MEMORY_CACHE.set(key, parsed);
        return parsed.value;
      }
      // Remove expired item
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }

  return null;
};

export const setProductCache = async <T>(key: string, value: T): Promise<void> => {
  const item: CacheItem<T> = {
    value,
    timestamp: Date.now()
  };

  // Update memory cache
  MEMORY_CACHE.set(key, item);

  // Update localStorage
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Cache write error:', error);
    // If localStorage is full, clear old items
    try {
      clearOldCache();
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error('Failed to write to cache even after cleanup:', e);
    }
  }
};

const clearOldCache = () => {
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('product_')) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '');
        if (now - item.timestamp > CACHE_EXPIRY) {
          localStorage.removeItem(key);
          MEMORY_CACHE.delete(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
        MEMORY_CACHE.delete(key);
      }
    }
  }
};

// Clean up expired items periodically
setInterval(clearOldCache, 60 * 60 * 1000); // Every hour