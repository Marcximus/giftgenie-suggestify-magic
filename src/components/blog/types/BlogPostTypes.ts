import { Json } from '@/integrations/supabase/types';

export interface BlogPostBase {
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
  images: Json | null;
  related_posts: Json | null;
}

export interface AffiliateLink {
  productUrl: string;
  imageUrl: string;
  title: string;
  rating?: number;
  totalRatings?: number;
}

export type BlogPostFormData = BlogPostBase & {
  affiliate_links: Json;
};

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
  affiliate_links: '[]' as Json,
  images: null,
  related_posts: null,
  published_at: null
};

export const affiliateLinksUtils = {
  parse(json: Json): AffiliateLink[] {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  stringify(links: AffiliateLink[]): Json {
    return JSON.stringify(links) as Json;
  }
};