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
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
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
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-16">
          {/* Back button */}
          <Button 
            onClick={() => navigate("/blog")} 
            variant="ghost" 
            className="mb-16 hover:bg-primary/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
          
          {post.image_url && (
            <div className="aspect-[21/9] relative overflow-hidden rounded-lg mb-16 shadow-xl animate-fade-in">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-16 animate-fade-in">
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
          
          <div className="prose prose-lg max-w-none animate-fade-in">
            <div 
              className="bg-card rounded-lg p-12 shadow-sm
                         [&>h1]:text-2xl [&>h1]:sm:text-3xl [&>h1]:md:text-4xl [&>h1]:font-bold [&>h1]:mb-12
                         [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:md:text-3xl [&>h2]:font-semibold [&>h2]:mt-16 [&>h2]:mb-8
                         [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-8
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-8 [&>ul]:space-y-4
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-8 [&>ol]:space-y-4
                         [&_img]:w-72 [&_img]:sm:w-96 [&_img]:md:w-[500px] 
                         [&_img]:h-72 [&_img]:sm:h-96 [&_img]:md:h-[500px] 
                         [&_img]:!object-contain [&_img]:!rounded-lg [&_img]:!shadow-md
                         [&_img]:!mx-auto [&_img]:!my-12
                         [&_a.amazon-button]:!text-white [&_a.amazon-button]:no-underline
                         [&_h3]:mt-16 [&_h3]:mb-8
                         [&_div.flex]:mt-12 [&_div.flex]:mb-12"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPost;