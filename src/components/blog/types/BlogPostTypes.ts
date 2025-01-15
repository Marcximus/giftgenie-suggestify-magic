export interface BlogPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  images: any[] | null;
  affiliate_links: AffiliateLink[] | null;
  image_alt_text: string | null;
  related_posts: any[] | null;
}

export interface BlogPostData extends BlogPostFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  productTitle?: string;
  affiliateLink?: string;
  imageUrl: string;
  rating?: number | string;
  totalRatings?: number | string;
}