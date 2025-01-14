import { Tables } from "@/integrations/supabase/types";
import { Calendar, User, Clock } from "lucide-react";

interface BlogPostHeaderProps {
  post: Tables<"blog_posts">;
}

export const BlogPostHeader = ({ post }: BlogPostHeaderProps) => {
  return (
    <>
      {/* SEO title hidden visually but present in DOM */}
      <h1 className="sr-only">
        {post.title}
      </h1>

      {post.image_url && (
        <div className="aspect-[21/9] relative overflow-hidden rounded-lg mb-6 sm:mb-8 shadow-xl animate-fade-in">
          <img 
            src={post.image_url} 
            alt={post.image_alt_text || post.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 sm:mb-8 animate-fade-in">
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>{post.author}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{new Date(post.published_at || "").toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{new Date(post.published_at || "").toLocaleTimeString()}</span>
        </div>
      </div>
    </>
  );
};