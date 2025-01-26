import { Tables } from "@/integrations/supabase/types";
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
    <header className="w-full flex flex-col items-center mb-8">
      <div className="w-full max-w-[720px] sm:max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="sr-only">
          {post.title}
        </h1>

        {post.image_url && !imageError && (
          <div className="w-full aspect-[16/9] relative overflow-hidden rounded-lg mt-6 mb-4 shadow-xl animate-fade-in 
                        scale-110 sm:scale-90">
            <img 
              src={post.image_url} 
              alt={post.image_alt_text || post.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
        )}
      </div>
    </header>
  );
};