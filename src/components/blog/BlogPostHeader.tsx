import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";

interface BlogPostHeaderProps {
  post: Tables<"blog_posts">;
}

export const BlogPostHeader = ({ post }: BlogPostHeaderProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <header className="mb-8 sm:mb-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 sm:mb-8 
                     bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500
                     animate-gradient bg-[length:200%_auto]">
        {post.title}
      </h1>

      {post.image_url && !imageError && (
        <div className="max-w-[500px] sm:max-w-[700px] lg:max-w-[900px] mx-auto w-full aspect-[21/9] relative overflow-hidden rounded-lg mb-6 shadow-xl animate-fade-in">
          <img 
            src={post.image_url} 
            alt={post.image_alt_text || post.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className="text-center text-muted-foreground">
        <time dateTime={post.published_at}>
          {new Date(post.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
        <span className="mx-2">•</span>
        <span>{post.author}</span>
      </div>
    </header>
  );
};