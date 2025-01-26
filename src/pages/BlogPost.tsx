import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { BlogPostMeta } from "@/components/blog/meta/BlogPostMeta";
import { BlogPostSkeleton } from "@/components/blog/loading/BlogPostSkeleton";
import { BlogPostError } from "@/components/blog/error/BlogPostError";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      console.log("Fetching blog post with slug:", slug);
      
      if (!slug) {
        console.error("No slug provided");
        throw new Error("No slug provided");
      }

      const { data: currentPost, error: currentError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (currentError) {
        console.error("Error fetching blog post:", currentError);
        toast({
          title: "Error loading blog post",
          description: "Please try again later",
          variant: "destructive",
        });
        throw currentError;
      }

      if (!currentPost) {
        console.log("No blog post found with slug:", slug);
        const error = new Error("Blog post not found");
        error.name = "NotFoundError";
        throw error;
      }

      console.log("Found blog post:", currentPost.title);

      const { data: relatedPosts, error: relatedError } = await supabase
        .from("blog_posts")
        .select("title, slug, image_url, excerpt")
        .neq("slug", slug)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3);

      if (relatedError) {
        console.error("Error fetching related posts:", relatedError);
      }

      return {
        ...currentPost,
        relatedPosts: relatedPosts || []
      };
    },
    retry: 1,
  });

  if (isLoading) {
    return <BlogPostSkeleton />;
  }

  if (error) {
    console.error("Error in BlogPost component:", error);
    return <BlogPostError 
      type={error.name === "NotFoundError" ? "not-found" : "error"} 
      error={error as Error} 
    />;
  }

  if (!post) {
    console.error("No post data available after successful query");
    return <BlogPostError type="not-found" />;
  }

  return (
    <>
      <BlogPostMeta post={post} />
      <article className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl">
          <Button 
            onClick={() => navigate("/blog")} 
            variant="ghost" 
            className="mb-6 sm:mb-8 hover:bg-primary/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
          
          <BlogPostHeader post={post} />
          <BlogPostContent post={post} />
          <RelatedPosts currentPostId={post.id} currentPostSlug={post.slug} />
        </div>
      </article>
    </>
  );
};

export default BlogPost;