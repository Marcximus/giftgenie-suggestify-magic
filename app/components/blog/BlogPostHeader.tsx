'use client'

import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
          <Link href="/" className="block w-full">
            <div className="w-full aspect-[16/9] relative overflow-hidden sm:rounded-lg mb-2 sm:mb-4 shadow-xl animate-fade-in sm:scale-90 md:scale-90 lg:scale-90">
              <Image
                src={post.image_url}
                alt={post.image_alt_text || post.title}
                fill
                className="object-cover sm:transform sm:hover:scale-105 transition-transform duration-300 ease-in-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 1080px, 1080px"
                priority={true}
                onError={handleImageError}
              />
            </div>
          </Link>
        )}
      </div>
    </header>
  );
};