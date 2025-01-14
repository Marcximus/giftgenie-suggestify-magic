import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  return (
    <div className="prose prose-lg w-full max-w-none animate-fade-in">
      <div 
        className="text-left
                   [&>h1]:text-2xl [&>h1]:sm:text-3xl [&>h1]:lg:text-4xl [&>h1]:font-bold [&>h1]:mb-10 [&>h1]:text-center
                   [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:lg:text-3xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4
                   [&>h3]:text-lg [&>h3]:sm:text-xl [&>h3]:lg:text-2xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                   [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-6 [&>p]:text-left
                   [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                   [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2
                   [&>img]:w-full [&>img]:max-w-[400px] [&>img]:sm:max-w-[500px] [&>img]:lg:max-w-[600px] 
                   [&>img]:h-auto [&>img]:aspect-square [&>img]:mx-auto [&>img]:my-4 [&>img]:sm:my-6
                   [&>img]:object-contain [&>img]:rounded-lg [&>img]:shadow-md
                   [&_div.flex]:justify-center [&_div.flex]:my-4 [&_div.flex]:w-full
                   [&_img]:w-96 [&_img]:h-96 [&_img]:object-contain
                   [&_img]:mx-auto [&_img]:rounded-lg [&_img]:shadow-md
                   [&_img]:my-4 [&_img]:sm:my-6
                   [&_a.amazon-button]:inline-block [&_a.amazon-button]:px-4 [&_a.amazon-button]:py-2 
                   [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90 
                   [&_a.amazon-button]:text-white [&_a.amazon-button]:rounded-md 
                   [&_a.amazon-button]:transition-colors [&_a.amazon-button]:text-sm
                   [&_a.amazon-button]:no-underline [&_a.amazon-button]:font-medium
                   [&_div.product-section]:border [&_div.product-section]:border-gray-200 
                   [&_div.product-section]:rounded-lg [&_div.product-section]:p-4 [&_div.product-section]:mb-6
                   [&_div.product-section]:bg-white/50 [&_div.product-section]:backdrop-blur-sm"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
};