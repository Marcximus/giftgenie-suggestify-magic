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
                   [&_a.amazon-button]:inline-block [&_a.amazon-button]:px-4 [&_a.amazon-button]:py-2 
                   [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90 
                   [&_a.amazon-button]:text-white [&_a.amazon-button]:rounded-md 
                   [&_a.amazon-button]:transition-colors [&_a.amazon-button]:text-sm
                   [&_a.amazon-button]:no-underline [&_a.amazon-button]:font-medium
                   [&_div.flex]:justify-center [&_div.flex]:my-4 [&_div.flex]:w-full
                   [&_img]:max-w-[400px] [&_img]:sm:max-w-[500px] [&_img]:lg:max-w-[600px]
                   [&_img]:mx-auto [&_img]:rounded-lg [&_img]:shadow-md
                   [&_img]:object-contain [&_img]:my-4 [&_img]:sm:my-6"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
};