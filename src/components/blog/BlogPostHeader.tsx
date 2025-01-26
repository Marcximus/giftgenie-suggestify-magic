import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { Link } from "react-router-dom";

interface BlogPostHeaderProps {
  post: Tables<"blog_posts">;
}

export const BlogPostHeader = ({ post }: BlogPostHeaderProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <header className="w-full">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold 
                       text-center mb-4 sm:mb-6 
                       px-8 sm:px-12 md:px-16 lg:px-20">
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