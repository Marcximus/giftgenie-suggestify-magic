import { Json } from '@/integrations/supabase/types';

export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
}

export interface BasePostData {
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
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: Json | null;
  related_posts: Json | null;
}

export interface BlogPostFormData extends BasePostData {
  affiliate_links: AffiliateLink[];
}

export interface DatabaseFormData extends BasePostData {
  affiliate_links: Json;
}

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
  affiliate_links: [],
  images: null,
  related_posts: null,
  published_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export function convertDatabaseToRuntime(dbData: DatabaseFormData): BlogPostFormData {
  let affiliateLinks: AffiliateLink[] = [];
  
  try {
    const parsed = typeof dbData.affiliate_links === 'string' 
      ? JSON.parse(dbData.affiliate_links) 
      : dbData.affiliate_links;
    
    if (Array.isArray(parsed)) {
      affiliateLinks = parsed.map(link => ({
        productTitle: String(link.productTitle || ''),
        affiliateLink: String(link.affiliateLink || ''),
        imageUrl: link.imageUrl ? String(link.imageUrl) : undefined,
        rating: typeof link.rating === 'number' ? link.rating : undefined,
        totalRatings: typeof link.totalRatings === 'number' ? link.totalRatings : undefined
      }));
    }
  } catch (error) {
    console.error('Error parsing affiliate links:', error);
  }

  return {
    ...dbData,
    affiliate_links: affiliateLinks,
    created_at: dbData.created_at || new Date().toISOString(),
    updated_at: dbData.updated_at || new Date().toISOString()
  };
}

export function convertRuntimeToDatabase(formData: BlogPostFormData): DatabaseFormData {
  return {
    ...formData,
    affiliate_links: formData.affiliate_links as unknown as Json
  };
}