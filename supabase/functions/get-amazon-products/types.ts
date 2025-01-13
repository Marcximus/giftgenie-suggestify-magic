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

export class AmazonApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public retryAfter?: string
  ) {
    super(message);
    this.name = 'AmazonApiError';
  }
}