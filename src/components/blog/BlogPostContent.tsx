import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  return (
    <div className="prose prose-lg w-full max-w-none animate-fade-in">
      <div 
        className="text-left px-4 sm:px-6 lg:px-8
                   [&>h1]:text-2xl [&>h1]:sm:text-3xl [&>h1]:lg:text-4xl [&>h1]:font-bold [&>h1]:mb-10 [&>h1]:text-center
                   [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:lg:text-3xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4
                   [&>h3]:text-lg [&>h3]:sm:text-xl [&>h3]:lg:text-2xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-4
                   [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-6 [&>p]:text-left
                   [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul]:space-y-2
                   [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol]:space-y-2
                   [&>img]:w-full [&>img]:max-w-2xl [&>img]:mx-auto
                   [&>img]:h-auto [&>img]:aspect-square [&>img]:my-6 [&>img]:sm:my-8
                   [&>img]:object-contain [&>img]:rounded-lg [&>img]:shadow-md
                   [&_div.flex]:justify-center [&_div.flex]:w-full [&_div.flex]:my-6 [&_div.flex]:sm:my-8
                   [&_img]:w-full [&_img]:max-w-2xl [&_img]:mx-auto
                   [&_img]:aspect-square [&_img]:object-contain
                   [&_img]:rounded-lg [&_img]:shadow-md
                   [&_img]:my-6 [&_img]:sm:my-8
                   [&_a]:text-primary [&_a]:font-medium [&_a]:no-underline [&_a]:hover:text-primary/90
                   [&_a.amazon-button]:inline-block [&_a.amazon-button]:px-6 [&_a.amazon-button]:py-3 
                   [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90 
                   [&_a.amazon-button]:text-white [&_a.amazon-button]:rounded-md 
                   [&_a.amazon-button]:transition-colors [&_a.amazon-button]:text-base
                   [&_a.amazon-button]:shadow-sm [&_a.amazon-button]:hover:shadow-md
                   [&_a.amazon-button]:active:scale-95
                   [&_div.product-section]:border [&_div.product-section]:border-gray-200 
                   [&_div.product-section]:rounded-lg [&_div.product-section]:p-4 [&_div.product-section]:mb-6
                   [&_div.product-section]:bg-white/50 [&_div.product-section]:backdrop-blur-sm"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
};