import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { BlogMeta } from "@/components/blog/meta/BlogMeta";
import { useNavigate } from "react-router-dom";

const Blog = () => {
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleFixFormatting = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fix-blog-post-formatting');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Processed ${data.processed} blog posts. Please refresh to see changes.`,
      });
    } catch (error: any) {
      console.error('Error fixing blog post formatting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fix blog post formatting",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BlogMeta />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Blog</h1>
        <div className="space-x-4">
          {/* Only show admin buttons if user is admin */}
          {supabase.auth.getUser() && (
            <>
              <Button onClick={() => navigate("/blog/admin")}>
                Manage Posts
              </Button>
              <Button onClick={handleFixFormatting} variant="outline">
                Fix Post Formatting
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts?.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg overflow-hidden shadow-lg"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.image_alt_text || post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                )}
                <div className="text-sm text-gray-500">
                  {post.published_at && (
                    <span>
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blog;