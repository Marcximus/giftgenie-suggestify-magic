export interface AmazonReview {
  rating: number;
  totalRatings?: number;
}

export interface ProductReviewProps {
  rating: number;
  totalRatings?: number;
  className?: string;
}

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