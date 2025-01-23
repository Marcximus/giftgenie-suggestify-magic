import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BlogPostForm from "@/components/blog/BlogPostForm";
import { useToast } from "@/hooks/use-toast";
import { BlogPostData } from "@/components/blog/types/BlogPostTypes";
import { Json } from "@/integrations/supabase/types";

const BlogEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post-edit", slug],
    queryFn: async () => {
      if (!slug) {
        toast({
          title: "Error",
          description: "No slug provided",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .select()
        .eq("slug", slug)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching blog post:", error);
        toast({
          title: "Error",
          description: "Failed to fetch blog post",
          variant: "destructive",
        });
        throw error;
      }

      if (!data) {
        toast({
          title: "Not Found",
          description: "The blog post you're trying to edit doesn't exist",
          variant: "destructive",
        });
        return null;
      }

      // Helper function to safely parse JSON with a default value
      const parseJsonWithDefault = <T,>(json: Json | null, defaultValue: T): T => {
        if (!json) return defaultValue;
        try {
          return typeof json === 'string' ? JSON.parse(json) : json as T;
        } catch {
          return defaultValue;
        }
      };

      // Convert the database response to match BlogPostFormData structure
      const formattedPost: BlogPostData = {
        ...data,
        images: parseJsonWithDefault(data.images, []),
        affiliate_links: parseJsonWithDefault(data.affiliate_links, []),
        related_posts: parseJsonWithDefault(data.related_posts, []),
        breadcrumb_list: parseJsonWithDefault(data.breadcrumb_list, []),
        excerpt: data.excerpt || null,
        image_url: data.image_url || null,
        published_at: data.published_at || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords || null,
        image_alt_text: data.image_alt_text || null,
        content_format_version: data.content_format_version || null,
        generation_attempts: data.generation_attempts || null,
        last_generation_error: data.last_generation_error || null,
        processing_status: parseJsonWithDefault(data.processing_status, {
          reviews_added: 0,
          amazon_lookups: 0,
          product_sections: 0,
          successful_replacements: 0
        }),
        product_reviews: parseJsonWithDefault(data.product_reviews, []),
        product_search_failures: parseJsonWithDefault(data.product_search_failures, []),
        word_count: data.word_count || null,
        reading_time: data.reading_time || null,
        main_entity: data.main_entity || null
      };
      
      return formattedPost;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <p>The blog post you're trying to edit doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>
      <BlogPostForm initialData={post} />
    </div>
  );
};

export default BlogEdit;