export interface AmazonProduct {
  title: string;
  description: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  asin: string;
}

export interface PriceRange {
  min?: number;
  max?: number;
}