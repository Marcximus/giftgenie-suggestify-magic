import { Tables } from "@/integrations/supabase/types";
import { Calendar, User, Clock } from "lucide-react";
import { useState } from "react";

interface BlogPostHeaderProps {
  post: Tables<"blog_posts">;
}

export const BlogPostHeader = ({ post }: BlogPostHeaderProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    console.error(`Failed to load image: ${post.image_url}`);
    setImageError(true);
  };

  return (
    <header className="w-full flex flex-col items-center">
      <div className="w-full max-w-[500px] sm:max-w-[700px] lg:max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="sr-only">
          {post.title}
        </h1>

        {post.image_url && !imageError && (
          <div className="w-full aspect-[21/9] relative overflow-hidden rounded-lg mb-4 shadow-xl animate-fade-in">
            <img 
              src={post.image_url} 
              alt={post.image_alt_text || post.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(post.published_at || "").toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(post.published_at || "").toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};