import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div 
        className="prose prose-sm md:prose-base lg:prose-lg w-full max-w-none
                   [&>*]:text-left [&>*]:w-full
                   prose-p:text-left prose-p:mb-4
                   prose-headings:text-left
                   prose-h1:text-left prose-h1:text-3xl sm:prose-h1:text-4xl md:prose-h1:text-5xl
                   prose-h2:text-left prose-h2:text-2xl sm:prose-h2:text-3xl md:prose-h2:text-4xl
                   prose-h3:text-left prose-h3:text-xl sm:prose-h3:text-2xl md:prose-h3:text-3xl
                   
                   prose-ul:pl-4 sm:prose-ul:pl-6
                   prose-ol:pl-4 sm:prose-ol:pl-6
                   
                   prose-img:rounded-lg prose-img:shadow-md
                   prose-img:mx-auto prose-img:my-4
                   
                   prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/90"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
};