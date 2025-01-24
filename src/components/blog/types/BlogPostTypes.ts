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
  images: any[] | null;
  affiliate_links: any[] | null;
  image_alt_text: string | null;
  related_posts: any[] | null;
  content_format_version: string | null;
  generation_attempts: number | null;
  last_generation_error: string | null;
  processing_status: {
    reviews_added: number;
    amazon_lookups: number;
    product_sections: number;
    successful_replacements: number;
  } | null;
  product_reviews: any[] | null;
  product_search_failures: any[] | null;
  // New fields added for SEO schema
  word_count: number | null;
  reading_time: number | null;
  main_entity: string | null;
  breadcrumb_list: any[] | null;
}

export interface BlogPostData extends BlogPostFormData {
  id: string;
  created_at: string;
  updated_at: string;
}