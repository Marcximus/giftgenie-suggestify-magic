export interface AmazonProduct {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  asin: string;
}

export interface FallbackTerm {
  searchTerm: string;
  usePriceConstraints: boolean;
}

export interface SearchConfig {
  minPrice?: number;
  maxPrice?: number;
  country?: string;
  categoryId?: string;
}