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

export const parseAffiliateLinks = (jsonData: Json): AffiliateLink[] => {
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData);
    }
    if (Array.isArray(jsonData)) {
      return jsonData;
    }
    return [];
  } catch {
    console.error('Error parsing affiliate links:', jsonData);
    return [];
  }
};

export const stringifyAffiliateLinks = (links: AffiliateLink[]): Json => {
  return JSON.stringify(links) as Json;
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