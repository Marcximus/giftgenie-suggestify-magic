import { Json } from '@/integrations/supabase/types';

// Basic blog post type that matches Supabase exactly
export type BlogPostFormData = {
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
  created_at: string;
  updated_at: string;
  published_at: string | null;
  affiliate_links: Json;
  images: Json | null;
  related_posts: Json | null;
};

// Separate runtime type for affiliate links
export type RawAffiliateLink = {
  productUrl: string;
  imageUrl: string;
  title: string;
  rating?: number;
  totalRatings?: number;
};

export const defaultFormData: BlogPostFormData = {
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
  affiliate_links: '[]' as Json,
  images: null,
  related_posts: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  published_at: null
};

export const parseAffiliateLinks = (json: Json): RawAffiliateLink[] => {
  try {
    if (typeof json === 'string') {
      return JSON.parse(json);
    }
    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.error('Error parsing affiliate links:', error);
    return [];
  }
};

export const stringifyAffiliateLinks = (links: RawAffiliateLink[]): Json => {
  return JSON.stringify(links) as Json;
};