export interface AmazonReview {
  rating: number;
  totalRatings?: number;
}

export interface ProductReviewProps {
  rating: number;
  totalRatings?: number;
  className?: string;
}