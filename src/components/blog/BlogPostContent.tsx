import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  return (
    <div className="prose prose-lg w-full max-w-none animate-fade-in">
      <div 
        className="text-left
                   [&>h1]:text-lg [&>h1]:sm:text-xl [&>h1]:lg:text-3xl [&>h1]:font-bold [&>h1]:mb-4 
                   [&>h2]:text-lg [&>h2]:sm:text-xl [&>h2]:lg:text-2xl [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3
                   [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-4 [&>p]:text-left
                   [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                   [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2
                   [&>img]:w-full [&>img]:max-w-[400px] [&>img]:sm:max-w-[500px] [&>img]:lg:max-w-[600px] 
                   [&>img]:h-auto [&>img]:aspect-square
                   [&>img]:!object-contain [&>img]:!rounded-lg [&>img]:!shadow-md
                   [&>img]:!mx-auto [&>img]:!my-4 [&>img]:sm:!my-6
                   [&_a.amazon-button]:!text-white [&_a.amazon-button]:no-underline
                   [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-left
                   [&_div.flex]:mt-4 [&_div.flex]:mb-4"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
};