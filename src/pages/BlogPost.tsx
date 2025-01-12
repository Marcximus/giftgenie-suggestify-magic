import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, User, Clock } from "lucide-react";
import { Helmet } from "react-helmet";
import { toast } from "@/components/ui/use-toast";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      console.log("Fetching blog post with slug:", slug);
      
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching blog post:", error);
        toast({
          title: "Error loading blog post",
          description: "Please try again later",
          variant: "destructive",
        });
        throw error;
      }

      if (!data) {
        console.log("No blog post found with slug:", slug);
        return null;
      }

      console.log("Found blog post:", data);
      return data as Tables<"blog_posts">;
    },
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading... - Get The Gift Blog</title>
        </Helmet>
        <div className="w-full px-2 sm:px-4 py-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
        <div className="w-full px-2 sm:px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
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
        <title>{post.title} - Get The Gift Blog</title>
        <meta name="description" content={post.excerpt || `Read ${post.title} on Get The Gift Blog`} />
        <meta property="og:title" content={`${post.title} - Get The Gift Blog`} />
        <meta property="og:description" content={post.excerpt || `Read ${post.title} on Get The Gift Blog`} />
        {post.image_url && (
          <meta property="og:image" content={post.image_url} />
        )}
        <meta name="author" content={post.author} />
        <meta property="article:published_time" content={post.published_at || ""} />
      </Helmet>
      <article className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="w-full px-2 sm:px-4 md:px-6 py-8">
          {/* Back button */}
          <Button 
            onClick={() => navigate("/blog")} 
            variant="ghost" 
            className="mb-8 hover:bg-primary/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
          
          {post.image_url && (
            <div className="w-full relative overflow-hidden rounded-lg mb-8 shadow-xl animate-fade-in">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 animate-fade-in">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.published_at || "").toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(post.published_at || "").toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="w-full animate-fade-in">
            <div 
              className="bg-card rounded-lg p-4 sm:p-6 md:p-8 shadow-sm w-full"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPost;