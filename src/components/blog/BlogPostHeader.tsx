import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { Link } from "react-router-dom";

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
      <div className="w-full max-w-[1080px] sm:max-w-[1080px] mx-auto px-0 sm:px-6 lg:px-8">
        <h1 className="sr-only">
          {post.title}
        </h1>

        {post.image_url && !imageError && (
          <Link to="/" className="block w-full">
            <div className="w-full aspect-[16/9] relative overflow-hidden sm:rounded-lg mb-2 sm:mb-4 shadow-xl animate-fade-in sm:scale-90 md:scale-90 lg:scale-90">
              <img 
                src={post.image_url} 
                alt={post.image_alt_text || post.title}
                className="absolute inset-0 w-full h-full object-cover sm:transform sm:hover:scale-105 transition-transform duration-300 ease-in-out"
                onError={handleImageError}
              />
            </div>
          </Link>
        )}
      </div>
    </header>
  );
};