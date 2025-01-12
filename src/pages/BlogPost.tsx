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

  const { data: post, isLoading, error } = useQuery({
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
        <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </>
    );
  }

  if (error) {
    console.error("Error in blog post component:", error);
    return (
      <>
        <Helmet>
          <title>Error - Get The Gift Blog</title>
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
        <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl">
          <Button 
            onClick={() => navigate("/blog")} 
            variant="ghost" 
            className="mb-6 sm:mb-8 hover:bg-primary/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
          
          {post.image_url && (
            <div className="aspect-[21/9] relative overflow-hidden rounded-lg mb-6 sm:mb-8 shadow-xl animate-fade-in">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 sm:mb-8 animate-fade-in">
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
          
          <div className="prose prose-lg w-full max-w-none animate-fade-in">
            <div 
              className="[&>h1]:text-base [&>h1]:sm:text-lg [&>h1]:lg:text-xl [&>h1]:font-bold [&>h1]:mb-4 
                         [&>h2]:text-base [&>h2]:sm:text-lg [&>h2]:lg:text-xl [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3
                         [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-4
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2
                         [&_img]:w-full [&_img]:max-w-[400px] [&_img]:sm:max-w-[500px] [&_img]:lg:max-w-[600px] 
                         [&_img]:h-auto [&_img]:aspect-square
                         [&_img]:!object-contain [&_img]:!rounded-lg [&_img]:!shadow-md
                         [&_img]:!mx-auto [&_img]:!my-4 [&_img]:sm:!my-6
                         [&_a.amazon-button]:!text-white [&_a.amazon-button]:no-underline
                         [&_h3]:mt-6 [&_h3]:mb-3
                         [&_div.flex]:mt-4 [&_div.flex]:mb-4"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPost;