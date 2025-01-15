import { Json } from "@/integrations/supabase/types";

// Database form data type (what Supabase expects)
export interface DatabaseFormData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  image_alt_text?: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  affiliate_links: Json;
  images: Json | null;
  related_posts: Json | null;
}

// Runtime affiliate link type
export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
}

// Runtime form state type
export interface RuntimeFormData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  image_alt_text?: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  affiliate_links: AffiliateLink[];
  images: any[] | null;
  related_posts: any[] | null;
}

// Helper functions for type conversion
export function convertDatabaseToRuntime(data: DatabaseFormData): RuntimeFormData {
  return {
    ...data,
    affiliate_links: Array.isArray(data.affiliate_links) 
      ? data.affiliate_links as AffiliateLink[]
      : [],
    images: Array.isArray(data.images) 
      ? data.images 
      : null,
    related_posts: Array.isArray(data.related_posts) 
      ? data.related_posts 
      : null
  };
}

export function convertRuntimeToDatabase(data: RuntimeFormData): DatabaseFormData {
  return {
    ...data,
    affiliate_links: data.affiliate_links as Json,
    images: data.images as Json,
    related_posts: data.related_posts as Json
  };
}