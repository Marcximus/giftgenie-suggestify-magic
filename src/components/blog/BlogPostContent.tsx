import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  return (
    <div className="prose prose-sm md:prose-base lg:prose-lg xl:prose-xl 
                    mx-auto px-4 sm:px-6 lg:px-8 max-w-none">
      <div 
        className="text-left max-w-4xl mx-auto
                   prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg xl:prose-p:text-xl
                   prose-p:leading-relaxed prose-p:mb-6 lg:prose-p:mb-8
                   
                   prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl xl:prose-h1:text-6xl
                   prose-h1:font-bold prose-h1:mb-8 lg:prose-h1:mb-12 prose-h1:text-center
                   
                   prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl lg:prose-h2:text-4xl
                   prose-h2:font-semibold prose-h2:mt-8 lg:prose-h2:mt-12 prose-h2:mb-6
                   
                   prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl lg:prose-h3:text-3xl
                   prose-h3:font-semibold prose-h3:mt-6 lg:prose-h3:mt-8 prose-h3:mb-4
                   
                   prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 lg:prose-ul:pl-8 prose-ul:mb-6
                   prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 lg:prose-ol:pl-8 prose-ol:mb-6
                   
                   prose-img:w-full prose-img:max-w-2xl prose-img:mx-auto
                   prose-img:h-auto prose-img:aspect-square prose-img:my-6 lg:prose-img:my-8
                   prose-img:object-contain prose-img:rounded-lg prose-img:shadow-md
                   
                   prose-a:text-primary prose-a:font-medium prose-a:no-underline
                   hover:prose-a:text-primary/90
                   
                   [&_div.flex]:justify-center [&_div.flex]:w-full [&_div.flex]:my-4 lg:[&_div.flex]:my-6
                   
                   [&_div.product-actions]:flex [&_div.product-actions]:flex-col
                   [&_div.product-actions]:items-center [&_div.product-actions]:gap-3
                   [&_div.product-actions]:my-4 lg:[&_div.product-actions]:my-6
                   
                   [&_a.amazon-button]:inline-flex [&_a.amazon-button]:items-center 
                   [&_a.amazon-button]:px-6 [&_a.amazon-button]:py-3
                   [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90 
                   [&_a.amazon-button]:text-white [&_a.amazon-button]:rounded-md 
                   [&_a.amazon-button]:transition-colors [&_a.amazon-button]:text-base lg:[&_a.amazon-button]:text-lg
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
    </div>
  );
};