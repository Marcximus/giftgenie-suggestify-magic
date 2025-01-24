import { Json } from "@/integrations/supabase/types";

export interface ProcessingStatus {
  reviews_added: number;
  amazon_lookups: number;
  product_sections: number;
  successful_replacements: number;
}

export interface AggregateRating {
  ratingValue: number;
  reviewCount: number;
}

export interface BlogPostFormData {
  id?: string;
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
  images: Json;
  affiliate_links: Json;
  image_alt_text: string | null;
  related_posts: Json;
  content_format_version: string | null;
  generation_attempts: number | null;
  last_generation_error: string | null;
  processing_status: Json;
  product_reviews: Json;
  product_search_failures: Json;
  word_count: number | null;
  reading_time: number | null;
  main_entity: string | null;
  breadcrumb_list: Json;
  category_id: string | null;
  created_at?: string;
  updated_at?: string;
  aggregateRating: AggregateRating | null;
  operatingSystem: string | null;
}

export interface BlogPostData extends BlogPostFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFormProps {
  initialData?: BlogPostFormData;
  initialTitle?: string;
}