import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg w-full max-w-none
                 [&>*]:text-left
                 
                 prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-left
                 
                 prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                 prose-h1:font-bold prose-h1:mb-6 prose-h1:text-left
                 
                 prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                 prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4 prose-h2:text-left
                 
                 prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                 prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-3 prose-h3:text-left
                 
                 prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4
                 prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4
                 
                 prose-img:w-full prose-img:max-w-lg prose-img:mx-auto
                 prose-img:h-auto prose-img:aspect-square prose-img:my-4 sm:prose-img:my-6
                 prose-img:object-contain prose-img:rounded-lg prose-img:shadow-md
                 
                 prose-a:text-primary prose-a:font-medium prose-a:no-underline
                 hover:prose-a:text-primary/90
                 
                 [&_div.flex]:justify-center [&_div.flex]:w-full [&_div.flex]:my-2
                 
                 [&_div.product-actions]:flex [&_div.product-actions]:flex-col
                 [&_div.product-actions]:items-center [&_div.product-actions]:gap-2
                 [&_div.product-actions]:my-2
                 
                 [&_a.amazon-button]:inline-flex [&_a.amazon-button]:items-center [&_a.amazon-button]:px-4 [&_a.amazon-button]:py-2 
                 [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90 
                 [&_a.amazon-button]:text-white [&_a.amazon-button]:rounded-md 
                 [&_a.amazon-button]:transition-colors [&_a.amazon-button]:text-sm
                 [&_a.amazon-button]:shadow-sm [&_a.amazon-button]:hover:shadow-md
                 [&_a.amazon-button]:active:scale-95
                 
                 [&_a.perfect-gift-button]:inline-block [&_a.perfect-gift-button]:px-8 [&_a.perfect-gift-button]:py-4
                 [&_a.perfect-gift-button]:bg-gradient-to-r [&_a.perfect-gift-button]:from-primary/80 [&_a.perfect-gift-button]:to-blue-500/80
                 [&_a.perfect-gift-button]:text-white [&_a.perfect-gift-button]:font-medium [&_a.perfect-gift-button]:rounded-lg
                 [&_a.perfect-gift-button]:transition-all [&_a.perfect-gift-button]:duration-300
                 [&_a.perfect-gift-button]:shadow-md [&_a.perfect-gift-button]:hover:shadow-lg
                 [&_a.perfect-gift-button]:hover:opacity-90 [&_a.perfect-gift-button]:active:scale-95"
      dangerouslySetInnerHTML={{ __html: post.content }}
    />
  );
};