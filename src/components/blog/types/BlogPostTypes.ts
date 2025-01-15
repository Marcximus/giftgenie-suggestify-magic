import { Tables } from "@/integrations/supabase/types";

// Simple affiliate link interface
export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
}

// Database type
export type BlogPostData = Tables<"blog_posts">;

// Form data type matching Supabase table structure
export type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at"> & {
  affiliate_links: AffiliateLink[];
};

// Type for data being submitted to Supabase
export type BlogPostSubmitData = Omit<Tables<"blog_posts">, "id" | "created_at"> & {
  affiliate_links: string | null;
};

// Helper functions for type conversion
export function convertToAffiliateLinks(value: unknown): AffiliateLink[] {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function convertToJson(links: AffiliateLink[]): string | null {
  if (!links || !Array.isArray(links)) return null;
  return JSON.stringify(links);
}