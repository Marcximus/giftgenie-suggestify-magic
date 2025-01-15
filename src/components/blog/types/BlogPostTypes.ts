import { Json } from '@/integrations/supabase/types';

// Basic affiliate link structure
export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
}

// Form data interface used by all components
export interface BlogPostFormData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  image_alt_text: string | null; // Required as per error message
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  affiliate_links: AffiliateLink[];
  images: any[] | null;
  related_posts: any[] | null;
}

// Database model that matches Supabase schema
export interface DatabaseFormData {
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
  published_at?: string | null;
  affiliate_links: Json;
  images: Json | null;
  related_posts: Json | null;
}

// Helper functions for type conversion
export const convertDatabaseToRuntime = (data: DatabaseFormData): BlogPostFormData => {
  return {
    ...data,
    affiliate_links: Array.isArray(data.affiliate_links) 
      ? data.affiliate_links as unknown as AffiliateLink[]
      : typeof data.affiliate_links === 'string'
        ? JSON.parse(data.affiliate_links) as AffiliateLink[]
        : [],
    images: Array.isArray(data.images) 
      ? data.images 
      : null,
    related_posts: Array.isArray(data.related_posts) 
      ? data.related_posts 
      : null,
    image_alt_text: data.image_alt_text || null
  };
};

export const convertRuntimeToDatabase = (data: BlogPostFormData): DatabaseFormData => {
  return {
    ...data,
    affiliate_links: data.affiliate_links as unknown as Json,
    images: data.images as Json,
    related_posts: data.related_posts as Json,
    image_alt_text: data.image_alt_text || null
  };
};