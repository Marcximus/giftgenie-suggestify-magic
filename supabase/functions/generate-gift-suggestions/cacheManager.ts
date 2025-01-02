export interface CachedResponse {
  data: any;
  timestamp: number;
}

export class CacheManager {
  private static cache = new Map<string, Array<CachedResponse>>();
  private static MAX_CACHE_SETS = 3;
  private static CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes

  static getCachedResponse(key: string): any {
    const cachedSets = this.cache.get(key);
    if (!cachedSets) return null;

    // Remove expired cache entries
    const validSets = cachedSets.filter(set => 
      Date.now() - set.timestamp < this.CACHE_EXPIRATION
    );
    
    if (validSets.length === 0) {
      this.cache.delete(key);
      return null;
    }

    // Return a random set from valid cached responses
    return validSets[Math.floor(Math.random() * validSets.length)].data;
  }

  static setCachedResponse(key: string, data: any) {
    const existingSets = this.cache.get(key) || [];
    const newCacheEntry = {
      data,
      timestamp: Date.now()
    };

    // Add new set and maintain maximum cache size
    const updatedSets = [newCacheEntry, ...existingSets].slice(0, this.MAX_CACHE_SETS);
    this.cache.set(key, updatedSets);
  }
}