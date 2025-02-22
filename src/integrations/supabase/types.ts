export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      blog_post_images: {
        Row: {
          alt_text: string | null
          blog_post_id: string | null
          created_at: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_images_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          retries: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retries?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retries?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          title?: string
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
          },
        ]
      }
      blog_posts_backup_content: {
        Row: {
          content: string | null
          content_format_version: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_format_version?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_format_version?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts_cache: {
        Row: {
          cache_version: string | null
          id: string
          processed_at: string | null
          processed_content: string
        }
        Insert: {
          cache_version?: string | null
          id: string
          processed_at?: string | null
          processed_content: string
        }
        Update: {
          cache_version?: string | null
          id?: string
          processed_at?: string | null
          processed_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_cache_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_searches: {
        Row: {
          created_at: string | null
          frequency: number | null
          id: string
          last_searched: string | null
          search_term: string
        }
        Insert: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          last_searched?: string | null
          search_term: string
        }
        Update: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          last_searched?: string | null
          search_term?: string
        }
        Relationships: []
      }
      product_suggestions: {
        Row: {
          amazon_asin: string | null
          amazon_image_url: string | null
          amazon_price: number | null
          amazon_rating: number | null
          amazon_total_ratings: number | null
          amazon_url: string | null
          availability: string | null
          batch_id: string | null
          batch_status: string | null
          brand: string | null
          category: string | null
          created_at: string | null
          description: string
          gtin: string | null
          id: string
          mpn: string | null
          price_range: string
          reason: string | null
          search_query: string
          sku: string | null
          status: string | null
          title: string
        }
        Insert: {
          amazon_asin?: string | null
          amazon_image_url?: string | null
          amazon_price?: number | null
          amazon_rating?: number | null
          amazon_total_ratings?: number | null
          amazon_url?: string | null
          availability?: string | null
          batch_id?: string | null
          batch_status?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          gtin?: string | null
          id?: string
          mpn?: string | null
          price_range: string
          reason?: string | null
          search_query: string
          sku?: string | null
          status?: string | null
          title: string
        }
        Update: {
          amazon_asin?: string | null
          amazon_image_url?: string | null
          amazon_price?: number | null
          amazon_rating?: number | null
          amazon_total_ratings?: number | null
          amazon_url?: string | null
          availability?: string | null
          batch_id?: string | null
          batch_status?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          gtin?: string | null
          id?: string
          mpn?: string | null
          price_range?: string
          reason?: string | null
          search_query?: string
          sku?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          search_query: string
          suggestion_titles: Json
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          search_query: string
          suggestion_titles?: Json
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          search_query?: string
          suggestion_titles?: Json
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_word_count: {
        Args: {
          content: string
        }
        Returns: number
      }
      get_random_daily_times: {
        Args: Record<PropertyKey, never>
        Returns: {
          hour: number
          minute: number
        }[]
      }
      validate_affiliate_link: {
        Args: {
          link: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
