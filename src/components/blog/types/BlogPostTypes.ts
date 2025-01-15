import { Tables } from "@/integrations/supabase/types";

// Simplified affiliate link interface
export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
  rating?: number | null;
  totalRatings?: number | null;
}

// Form data type matching Supabase table structure
export type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at"> & {
  affiliate_links: AffiliateLink[] | null;
};

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

export function convertToAffiliateLinks(value: unknown): AffiliateLink[] {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return isAffiliateLinkArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function convertToJson(links: AffiliateLink[] | null): unknown {
  if (!links) return null;
  return links;
}