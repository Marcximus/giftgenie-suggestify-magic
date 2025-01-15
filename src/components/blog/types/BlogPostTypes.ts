import { Json } from '@/integrations/supabase/types';

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
  created_at: string;
  updated_at: string;
  published_at: string | null;
  affiliate_links: Json;
  images: Json | null;
  related_posts: Json | null;
}

export const affiliateLinksUtils = {
  parse(json: Json): AffiliateLink[] {
    try {
      if (typeof json === 'string') {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
      }
      return Array.isArray(json) ? json : [];
    } catch {
      console.error('Error parsing affiliate links');
      return [];
    }
  },

  stringify(links: AffiliateLink[]): Json {
    return JSON.stringify(links) as Json;
  },

  isValid(obj: unknown): obj is AffiliateLink {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'productUrl' in obj &&
      'imageUrl' in obj &&
      'title' in obj
    );
  }
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