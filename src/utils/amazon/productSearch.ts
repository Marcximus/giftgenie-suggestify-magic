import { RateLimiter } from './rateLimiter';
import { toast } from "@/components/ui/use-toast";

interface SearchConfig {
  maxRetries: number;
  cacheDuration: number;
  minRelevanceScore: number;
}

const SEARCH_CONFIG: SearchConfig = {
  maxRetries: 2,
  cacheDuration: 6 * 60 * 60 * 1000, // 6 hours
  minRelevanceScore: 0.7
};

export class ProductSearchService {
  private rateLimiter: RateLimiter;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor() {
    this.rateLimiter = RateLimiter.getInstance();
    this.cache = new Map();
  }

  private getCacheKey(term: string): string {
    return term.toLowerCase().trim();
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < SEARCH_CONFIG.cacheDuration;
  }

  async searchProduct(term: string, apiKey: string, rapidApiHost: string): Promise<any> {
    // Check cache first
    const cacheKey = this.getCacheKey(term);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('Cache hit for:', term);
      return cached.data;
    }

    let retries = 0;
    while (retries <= SEARCH_CONFIG.maxRetries) {
      try {
        // Wait for available slot
        while (!(await this.rateLimiter.acquireSlot())) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Waiting for available request slot...');
        }

        // Perform search
        const response = await this.performSearch(term, apiKey, rapidApiHost);
        await this.rateLimiter.handleResponse(response.status);
        
        if (response.ok) {
          const data = await response.json();
          
          // Cache successful results
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
          
          return data;
        }

        if (response.status === 429) {
          retries++;
          toast({
            title: "Rate limit reached",
            description: "Please wait a moment while we process your request",
            variant: "destructive",
          });
          continue;
        }

        if (response.status === 403) {
          toast({
            title: "API Access Error",
            description: "Unable to access the product search API. Please try again later.",
            variant: "destructive",
          });
          throw new Error(`Search failed: ${response.status}`);
        }

        throw new Error(`Search failed: ${response.status}`);
      } finally {
        this.rateLimiter.releaseSlot();
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async performSearch(term: string, apiKey: string, rapidApiHost: string): Promise<Response> {
    const searchTerm = this.optimizeSearchTerm(term);
    return fetch(
      `https://${rapidApiHost}/search?query=${encodeURIComponent(searchTerm)}&country=US`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': rapidApiHost,
        }
      }
    );
  }

  private optimizeSearchTerm(term: string): string {
    const words = term.split(' ');
    return words
      .filter(word => !['with', 'and', 'for', 'the', 'a', 'an'].includes(word.toLowerCase()))
      .slice(0, 4)
      .join(' ');
  }

  static getInstance(): ProductSearchService {
    if (!ProductSearchService.instance) {
      ProductSearchService.instance = new ProductSearchService();
    }
    return ProductSearchService.instance;
  }

  private static instance: ProductSearchService;
}