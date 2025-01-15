import { Json } from "@/integrations/supabase/types";

export interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
}

export type BlogPostFormData = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  author: string;
  published_at?: string | null;
  image_url?: string | null;
  image_alt_text?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  images?: Json;
  related_posts?: Json;
  affiliate_links?: AffiliateLink[];
};