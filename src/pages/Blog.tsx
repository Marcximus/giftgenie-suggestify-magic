import { BlogPostAnalyzer } from "@/components/blog/BlogPostAnalyzer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const Blog = () => {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading blog posts",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as Tables<"blog_posts">[];
    },
  });

  if (isLoading) {
    return <div>Loading blog posts...</div>;
  }

  if (error) {
    return <div>Error loading blog posts: {error.message}</div>;
  }

  return (
    <div>
      <BlogPostAnalyzer />
      <h1 className="text-center mb-8">Blog Posts</h1>
      <div className="grid grid-cols-1 gap-4">
        {posts.map(post => (
          <div key={post.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold">
              <Link to={`/blog/post/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="text-sm text-muted-foreground">{post.excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;
