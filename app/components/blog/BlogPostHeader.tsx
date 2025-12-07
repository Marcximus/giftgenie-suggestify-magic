'use client'

import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import Image from "next/image";

interface BlogPostHeaderProps {
  post: Tables<"blog_posts">;
}

export const BlogPostHeader = ({ post }: BlogPostHeaderProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <header className="w-full flex flex-col items-center">
      <div className="w-full max-w-[1080px] sm:max-w-[1080px] mx-auto px-0 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mt-4 sm:mt-8 mb-6 sm:mb-12 px-4 sm:px-8">
          {post.title}
        </h1>

        {post.image_url && !imageError ? (
          <div className="w-full aspect-[16/9] relative overflow-hidden sm:rounded-lg mb-2 sm:mb-4 shadow-xl animate-fade-in sm:scale-90 md:scale-90 lg:scale-90">
            <Image
              src={post.image_url}
              alt={post.image_alt_text || post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 1080px, 1080px"
              priority={true}
              onError={handleImageError}
            />
          </div>
        ) : post.image_url && imageError ? (
          <div className="w-full aspect-[16/9] relative overflow-hidden sm:rounded-lg mb-2 sm:mb-4 bg-gray-200 flex items-center justify-center">
            <div className="text-center p-6">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">Image unavailable</p>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};