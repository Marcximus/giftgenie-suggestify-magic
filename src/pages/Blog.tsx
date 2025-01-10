import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, Clock, User } from "lucide-react";

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
          <title>Blog - Get The Gift</title>
          <meta name="description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center animate-fade-in">Blog</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
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
        <title>Blog - Get The Gift</title>
        <meta name="description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        <meta property="og:title" content="Blog - Get The Gift" />
        <meta property="og:description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        {posts?.[0]?.image_url && (
          <meta property="og:image" content={posts[0].image_url} />
        )}
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 animate-fade-in">
          Latest Articles
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.id}>
              <article className="group">
                <Card className="h-full transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                  {post.image_url && (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(post.published_at || "").toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
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