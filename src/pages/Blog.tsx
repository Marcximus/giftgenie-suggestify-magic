import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <title>Blog - Get The Gift</title>
          <meta name="description" content="Discover gift-giving tips, ideas, and inspiration on our blog. Learn about the latest trends and get expert advice on finding the perfect gift." />
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Blog</h1>
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
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.id}>
              <article>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {post.image_url && (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                    <div className="mt-4 text-sm text-muted-foreground">
                      {new Date(post.published_at || "").toLocaleDateString()}
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