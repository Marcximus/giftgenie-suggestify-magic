export interface AmazonProduct {
  title: string;
  description?: string;
  price?: {
    current_price: number;
    currency: string;
  };
  rating?: number;
  ratings_total?: number;
  main_image?: string;
  asin?: string;
}

export interface RateLimitInfo {
  timestamp: number;
  count: number;
}

export interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
  amazon_asin?: string;
  amazon_url?: string;
  amazon_price?: number;
  amazon_image_url?: string;
  amazon_rating?: number;
  amazon_total_ratings?: number;
}