import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data as Tables<"blog_posts">;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Button onClick={() => navigate("/blog")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button onClick={() => navigate("/blog")} variant="ghost" className="mb-8">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Blog
      </Button>
      
      {post.image_url && (
        <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
        <span>{post.author}</span>
        <span>•</span>
        <span>{new Date(post.published_at || "").toLocaleDateString()}</span>
      </div>
      
      <div className="prose prose-lg max-w-none">
        {post.content}
      </div>
    </div>
  );
};

export default BlogPost;