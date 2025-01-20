import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { toast } from "@/components/ui/use-toast";

const Blog = () => {
  console.log("Blog component initialized");
  console.log("Supabase client config:", {
    url: supabase.config.supabaseUrl,
    hasAuth: !!supabase.auth,
    headers: supabase.rest.headers
  });

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      console.log("Starting blog posts fetch...");
      console.log("Request headers:", supabase.rest.headers);
      
      try {
        console.log("Initiating Supabase query...");
        const { data, error, status, statusText } = await supabase
          .from("blog_posts")
          .select("*")
          .order("published_at", { ascending: false });
        
        console.log("Supabase response status:", status, statusText);
        
        if (error) {
          console.error("Supabase error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          toast({
            title: "Error loading blog posts",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }

        console.log("Successfully fetched blog posts:", {
          count: data?.length || 0,
          firstPost: data?.[0]?.title || 'No posts'
        });
        return data as Tables<"blog_posts">[];
      } catch (error: any) {
        console.error("Detailed fetch error:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log(`Retry attempt ${attemptIndex + 1}, waiting ${delay}ms`);
      return delay;
    },
    onError: (error: any) => {
      console.error("Query error handler:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  });

  if (error) {
    console.error("Rendering error state:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Blog Posts</h1>
          <p className="text-gray-600">Please try refreshing the page</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Gift Ideas - Get The Gift</title>
          <meta name="description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        </Helmet>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 inline-block text-transparent bg-clip-text mb-4">
              Perfect Gift Ideas
            </h1>
            <p className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our suggestions feel tailor-made because they practically are. We use <span className="animate-pulse-text text-primary">AI</span> and <span className="animate-pulse-text text-primary">internet magic</span> to find the absolute best gift ideas and popular presents. Thanks to us, you can spend less time gift hunting and more time celebrating (or binge-watching your favorite show—we won't judge).
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse h-[40px] flex overflow-hidden">
                <div className="w-[40px] bg-gray-200"></div>
                <div className="flex-1 p-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
          <footer className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Some links may contain affiliate links from Amazon and other vendors
            </p>
          </footer>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gift Ideas - Get The Gift</title>
        <meta name="description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        <meta property="og:title" content="Gift Ideas - Get The Gift" />
        <meta property="og:description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        {posts?.[0]?.image_url && (
          <meta property="og:image" content={posts[0].image_url} />
        )}
      </Helmet>
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 inline-block text-transparent bg-clip-text mb-4">
            Perfect Gift Ideas
          </h1>
          <p className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Our suggestions feel tailor-made because they practically are. We use <span className="animate-pulse-text text-primary">AI</span> and <span className="animate-pulse-text text-primary">internet magic</span> to find the absolute best gift ideas and popular presents. Thanks to us, you can spend less time gift hunting and more time celebrating (or binge-watching your favorite show—we won't judge).
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((post) => (
            <Link to={`/blog/post/${post.slug}`} key={post.id}>
              <article className="group">
                <Card className="flex h-[40px] overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  {post.image_url && (
                    <div className="w-[40px] relative overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-2 flex items-center">
                    <h3 className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </div>
                </Card>
              </article>
            </Link>
          ))}
        </div>
        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Some links may contain affiliate links from Amazon and other vendors
          </p>
        </footer>
      </div>
    </>
  );
};

export default Blog;