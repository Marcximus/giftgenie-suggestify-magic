export interface ProductInfo {
  title: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  rating?: number;
  totalRatings?: number;
  description?: string;
}

export interface ProcessedContent {
  content: string;
  affiliateLinks: Array<{
    productTitle: string;
    affiliateLink: string;
    imageUrl?: string;
  }>;
}

export interface ProductSection {
  beforeH3: string;
  afterH3: string;
  productName: string;
}