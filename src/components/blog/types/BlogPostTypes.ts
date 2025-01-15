import { Tables } from "@/integrations/supabase/types";

// Simplified affiliate link interface
export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
}

// Form data type matching Supabase table structure but with proper affiliate_links typing
export type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at" | "affiliate_links"> & {
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
    'affiliateLink' in item &&
    typeof item.productTitle === 'string' &&
    typeof item.affiliateLink === 'string' &&
    (!('imageUrl' in item) || typeof item.imageUrl === 'string' || item.imageUrl === undefined)
  );
}

export function convertToAffiliateLinks(value: unknown): AffiliateLink[] | null {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return isAffiliateLinkArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function convertToJson(links: AffiliateLink[] | null): string | null {
  if (!links) return null;
  return JSON.stringify(links);
}