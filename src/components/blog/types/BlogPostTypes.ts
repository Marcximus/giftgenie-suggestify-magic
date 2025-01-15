import { Tables } from "@/integrations/supabase/types";
import { Json } from "@supabase/supabase-js";

// Simplified affiliate link interface without index signature
export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
  rating?: number | null;
  totalRatings?: number | null;
}

// Form data type matching Supabase table structure
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

// Database type
export type BlogPostData = Tables<"blog_posts">;

// Helper functions for type conversion
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
  if (!links) return [];
  return links as unknown as Json;
}