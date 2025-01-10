import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data as Tables<"blog_posts">[];
    },
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Gift Ideas - Get The Gift</title>
          <meta name="description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        </Helmet>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4">
              Gift Ideas
            </h1>
            <p className="text-[8px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4">
            Gift Ideas
          </h1>
          <p className="text-[8px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
      </div>
    </>
  );
};

export default Blog;