import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Helmet } from "react-helmet";
import { toast } from "@/components/ui/use-toast";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { RelatedPosts } from "@/components/blog/RelatedPosts";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      console.log("Fetching blog post with slug:", slug);
      
      const { data: currentPost, error: currentError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
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
        return null;
      }

      const { data: relatedPosts, error: relatedError } = await supabase
        .from("blog_posts")
        .select("title, slug")
        .neq("slug", slug)
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
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading... - Get The Gift Blog</title>
          <meta name="description" content="Loading blog post content..." />
        </Helmet>
        <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Error - Get The Gift Blog</title>
          <meta name="description" content="An error occurred while loading the blog post." />
        </Helmet>
        <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold mb-4">Error loading blog post</h1>
          <p className="text-red-500 mb-4">There was an error loading this blog post. Please try again later.</p>
          <Button onClick={() => navigate("/blog")} variant="default">
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Helmet>
          <title>Post Not Found - Get The Gift Blog</title>
          <meta name="description" content="The blog post you're looking for could not be found." />
        </Helmet>
        <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <p className="mb-4">The blog post you're looking for could not be found.</p>
          <Button onClick={() => navigate("/blog")} variant="default">
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} - Get The Gift Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`} />
        <meta name="keywords" content={post.meta_keywords || ''} />
        <meta property="og:title" content={`${post.title} - Get The Gift Blog`} />
        <meta property="og:description" content={post.excerpt || `Read ${post.title} on Get The Gift Blog`} />
        {post.image_url && (
          <meta property="og:image" content={post.image_url} />
        )}
        <meta name="author" content={post.author} />
        <meta property="article:published_time" content={post.published_at || ""} />
      </Helmet>
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
          <RelatedPosts relatedPosts={post.relatedPosts} />
        </div>
      </article>
    </>
  );
};

export default BlogPost;