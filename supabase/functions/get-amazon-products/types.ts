export interface AmazonSearchResult {
  data: {
    products: Array<{
      asin: string;
      title: string;
    }>;
  };
}

export interface AmazonProductDetails {
  data: {
    title: string;
    description?: string;
    product_information?: string[] | string;
    feature_bullets?: string[];
    price: {
      current_price: number;
      currency: string;
    };
    product_star_rating?: string;
    product_num_ratings?: number;
    product_photo?: string;
    asin: string;
  };
}

export interface ProductResponse {
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  asin: string;
}

export interface RateLimitInfo {
  timestamp: number;
  count: number;
}