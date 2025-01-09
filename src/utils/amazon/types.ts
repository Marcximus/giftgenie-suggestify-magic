export interface AmazonProduct {
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  asin: string;
}

export interface RateLimitConfig {
  MAX_RETRIES: number;
  BASE_DELAY: number;
  BACKOFF_FACTOR: number;
}