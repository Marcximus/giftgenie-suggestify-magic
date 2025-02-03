export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      api_metrics: {
        Row: {
          created_at: string | null
          duration_ms: number
          endpoint: string
          error_message: string | null
          id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          duration_ms: number
          endpoint: string
          error_message?: string | null
          id?: string
          status: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number
          endpoint?: string
          error_message?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          affiliate_links: Json | null
          author: string
          breadcrumb_list: Json | null
          category_id: string | null
          content: string
          content_format_version: string | null
          created_at: string | null
          excerpt: string | null
          generation_attempts: number | null
          id: string
          image_alt_text: string | null
          image_url: string | null
          images: Json | null
          last_generation_error: string | null
          main_entity: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          processing_status: Json | null
          product_reviews: Json | null
          product_search_failures: Json | null
          published_at: string | null
          reading_time: number | null
          related_posts: Json | null
          slug: string
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          affiliate_links?: Json | null
          author: string
          breadcrumb_list?: Json | null
          category_id?: string | null
          content: string
          content_format_version?: string | null
          created_at?: string | null
          excerpt?: string | null
          generation_attempts?: number | null
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          images?: Json | null
          last_generation_error?: string | null
          main_entity?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          processing_status?: Json | null
          product_reviews?: Json | null
          product_search_failures?: Json | null
          published_at?: string | null
          reading_time?: number | null
          related_posts?: Json | null
          slug: string
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          affiliate_links?: Json | null
          author?: string
          breadcrumb_list?: Json | null
          category_id?: string | null
          content?: string
          content_format_version?: string | null
          created_at?: string | null
          excerpt?: string | null
          generation_attempts?: number | null
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          images?: Json | null
          last_generation_error?: string | null
          main_entity?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          processing_status?: Json | null
          product_reviews?: Json | null
          product_search_failures?: Json | null
          published_at?: string | null
          reading_time?: number | null
          related_posts?: Json | null
          slug?: string
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      blog_posts_cache: {
        Row: {
          id: string
          processed_content: string
          processed_at: string | null
          cache_version: string | null
        }
        Insert: {
          id: string
          processed_content: string
          processed_at?: string | null
          cache_version?: string | null
        }
        Update: {
          id?: string
          processed_content?: string
          processed_at?: string | null
          cache_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_cache_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
