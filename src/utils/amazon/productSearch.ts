import { RateLimiter, waitForRateLimit } from './rateLimiter';
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
  private static instance: ProductSearchService;
  private subscriptionErrorShown: boolean = false;

  private constructor() {
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
    const cacheKey = this.getCacheKey(term);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('Cache hit for:', term);
      return cached.data;
    }

    let retryCount = 0;
    while (retryCount < SEARCH_CONFIG.maxRetries) {
      try {
        await waitForRateLimit();

        const url = new URL(`https://${rapidApiHost}/search`);
        // Don't encode the term - URL API will handle it
        url.searchParams.append('query', term);
        url.searchParams.append('country', 'US');

        console.log('Making request to:', url.toString());

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': rapidApiHost,
            'Content-Type': 'application/json'
          }
        });
        
        await this.rateLimiter.handleResponse(response.status);
        
        if (response.status === 403) {
          console.error('API subscription error');
          if (!this.subscriptionErrorShown) {
            toast({
              title: "Amazon Product Search Unavailable",
              description: "We're experiencing technical difficulties with our product search. Please try again later or contact support.",
              variant: "destructive",
              duration: 5000,
            });
            this.subscriptionErrorShown = true;
          }
          throw new Error('API subscription error');
        }

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Cache successful results
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        // Reset subscription error flag on successful request
        this.subscriptionErrorShown = false;
        
        return data;
      } catch (error: any) {
        console.error('Error in searchProduct:', error);
        retryCount++;
        
        // Don't retry on subscription errors
        if (error.message === 'API subscription error') {
          throw error;
        }
        
        if (retryCount >= SEARCH_CONFIG.maxRetries) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      } finally {
        this.rateLimiter.releaseSlot();
      }
    }

    throw new Error('Max retries exceeded');
  }

  static getInstance(): ProductSearchService {
    if (!ProductSearchService.instance) {
      ProductSearchService.instance = new ProductSearchService();
    }
    return ProductSearchService.instance;
  }
}