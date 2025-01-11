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
}

export interface BlogPostData extends BlogPostFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

export type AIGenerateType = 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords';

export interface AIGenerateFunction {
  (type: AIGenerateType, title: string, content?: string): Promise<string | null>;
}