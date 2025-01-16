// Define our own Json type
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface AffiliateLink {
  productUrl: string;
  imageUrl: string;
  title: string;
  rating?: number;
  totalRatings?: number;
}

export interface BlogPostFormData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  image_alt_text: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at?: string;
  updated_at?: string;
  published_at: string | null;
  affiliate_links: string; // Store as JSON string
  images: string | null; // Store as JSON string
  related_posts: string | null; // Store as JSON string
}

export const EMPTY_FORM_DATA: BlogPostFormData = {
  title: '',
  slug: '',
  content: '',
  excerpt: null,
  author: '',
  image_url: null,
  image_alt_text: null,
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  affiliate_links: '[]',
  images: null,
  related_posts: null,
  published_at: null
};