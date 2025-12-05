'use client'

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { BlogPostMeta } from "@/components/blog/meta/BlogPostMeta";
import { BlogPostSkeleton } from "@/components/blog/loading/BlogPostSkeleton";
import { BlogPostError } from "@/components/blog/error/BlogPostError";

export default function BlogPost() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      console.log("Fetching blog post with slug:", slug);

      if (!slug) {
        const error = new Error("No slug provided");
        error.name = "NotFoundError";
        throw error;
      }

      // Retry logic for database connection issues
      let retries = 2;
      let lastError = null;

      while (retries >= 0) {
        try {
          const { data: currentPost, error: currentError } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("slug", slug)
            .maybeSingle();

          if (currentError) {
            // Check if it's a connection/timeout error
            if (currentError.message?.includes('timeout') ||
                currentError.message?.includes('connection') ||
                currentError.code === 'PGRST301') {
              lastError = currentError;
              retries--;
              if (retries >= 0) {
                console.log(`Database timeout, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }

            console.error("Error fetching blog post:", currentError);
            const error = new Error("Failed to fetch blog post");
            error.name = "ServerError";
            throw error;
          }

          if (!currentPost) {
            console.log("No blog post found with slug:", slug);
            const error = new Error("Blog post not found");
            error.name = "NotFoundError";
            throw error;
          }

          console.log("Found blog post:", currentPost.title);

          // Fetch related posts with separate error handling
          const { data: relatedPosts } = await supabase
            .from("blog_posts")
            .select("title, slug, image_url, excerpt")
            .neq("slug", slug)
            .not("published_at", "is", null)
            .order("published_at", { ascending: false })
            .limit(3);

          return {
            ...currentPost,
            relatedPosts: relatedPosts || []
          };
        } catch (err) {
          if (retries > 0 && (err as Error).name === "ServerError") {
            lastError = err;
            retries--;
            console.log(`Query failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw err;
          }
        }
      }

      throw lastError || new Error("Failed to fetch blog post after retries");
    },
    retry: false, // We handle retries internally
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading) {
    return <BlogPostSkeleton />;
  }

  if (error || !post) {
    return (
      <BlogPostError
        error={error as Error}
        onRetry={() => router.refresh()}
      />
    );
  }

  return (
    <>
      <BlogPostMeta post={post} />
      <article className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <BlogPostHeader
            title={post.title}
            imageUrl={post.image_url}
            imageAltText={post.image_alt_text}
            publishedAt={post.published_at}
          />
          <BlogPostContent content={post.content} />
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts posts={post.relatedPosts} />
          )}
        </div>
      </article>
    </>
  );
}
