import { Json } from "@/integrations/supabase/types";

// Define a type that matches Supabase's Json type structure
export type JsonCompatible = string | number | boolean | null | JsonCompatible[] | { [key: string]: JsonCompatible };

// Make AffiliateLink compatible with Json type
export interface AffiliateLink extends Record<string, JsonCompatible> {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
  rating?: number | null;
  totalRatings?: number | null;
}

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
  images: Json | null;
  affiliate_links: Json | null;
  image_alt_text: string | null;
  related_posts: Json | null;
}

export interface BlogPostData extends BlogPostFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

export function isAffiliateLinkArray(value: unknown): value is AffiliateLink[] {
  if (!Array.isArray(value)) return false;
  return value.every(item => 
    typeof item === 'object' &&
    item !== null &&
    'productTitle' in item &&
    'affiliateLink' in item
  );
}

export function convertToAffiliateLinks(value: Json | null): AffiliateLink[] {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return isAffiliateLinkArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function convertToJson(links: AffiliateLink[] | null): Json {
  return links || [];
}