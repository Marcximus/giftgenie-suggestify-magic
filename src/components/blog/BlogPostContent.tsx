import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  // Enhanced sanitization function with v2 formatting rules
  const sanitizeContent = (content: string) => {
    return content
      // Remove problematic inline styles
      .replace(/style="[^"]*float:\s*(?:left|right)[^"]*"/gi, '')
      .replace(/style="[^"]*width:\s*\d+[^"]*"/gi, '')
      .replace(/style="[^"]*margin[^"]*"/gi, '')
      .replace(/style="[^"]*text-align[^"]*"/gi, '')
      .replace(/style="[^"]*padding[^"]*"/gi, '')
      .replace(/style="[^"]*max-width[^"]*"/gi, '')
      .replace(/style="[^"]*"/gi, '')
      
      // Enhanced container formatting
      .replace(/<div(?!\s+class="[^"]*(?:product-actions|review-container))/gi, '<div class="w-full text-left"')
      
      // Improved title formatting with consistent spacing
      .replace(/<h1/gi, '<h1 class="!text-center !mt-8 sm:!mt-12 !mb-8 sm:!mb-16 !text-3xl sm:!text-4xl md:!text-5xl !font-bold !px-4 sm:!px-8"')
      
      // Product titles with consistent spacing
      .replace(/<h3/gi, '<h3 class="!text-xl sm:!text-2xl !font-semibold !mt-16 !mb-8 !text-left"')
      
      // Review container spacing and alignment
      .replace(/<div[^>]*class="[^"]*review-container[^"]*">/gi, '<div class="!mt-8 !mb-12 review-container">')
      
      // Center review sections while maintaining consistent spacing
      .replace(/<div[^>]*class="[^"]*flex items-center[^"]*">/gi, '<div class="!flex !justify-center !items-center !gap-2 !my-4">')
      .replace(/<div[^>]*class="[^"]*review-text[^"]*">/gi, '<div class="!text-center !mt-4 !mb-8">')
      
      // Ensure proper image formatting and spacing
      .replace(/<img/gi, '<img class="!mx-auto !my-8 !max-w-[250px] sm:!max-w-[350px] lg:!max-w-[400px] !rounded-lg !shadow-md"');
  };

  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg w-full !max-w-none !m-0
                 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32
                 prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                 prose-p:leading-relaxed prose-p:mb-4 prose-p:w-full prose-p:text-left
                 
                 prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                 prose-h1:font-bold prose-h1:mb-4 sm:prose-h1:mb-6 prose-h1:w-full prose-h1:!text-center
                 prose-h1:px-4 sm:prose-h1:px-8
                 
                 prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                 prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4 prose-h2:w-full prose-h2:text-left
                 
                 prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                 prose-h3:font-semibold prose-h3:!mt-16 prose-h3:!mb-8 prose-h3:w-full prose-h3:text-left
                 
                 prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4 prose-ul:w-full prose-ul:text-left
                 prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4 prose-ol:w-full prose-ol:text-left
                 
                 prose-img:w-full prose-img:h-auto prose-img:!mt-8 prose-img:!mb-8
                 prose-img:rounded-lg prose-img:shadow-md
                 prose-img:max-w-[250px] sm:prose-img:max-w-[350px] lg:prose-img:max-w-[400px]
                 prose-img:mx-auto
                 
                 prose-a:text-primary prose-a:font-medium prose-a:no-underline
                 hover:prose-a:text-primary/90
                 
                 [&>*]:w-full [&>*]:!max-w-none [&>*]:!mx-0 [&>*]:!px-0 [&>*]:text-left
                 
                 [&_div.flex]:w-full [&_div.flex]:my-2 [&_div.flex]:justify-center
                 
                 [&_div.product-actions]:flex [&_div.product-actions]:flex-col
                 [&_div.product-actions]:items-center [&_div.product-actions]:gap-2
                 [&_div.product-actions]:my-2 [&_div.product-actions]:!text-center
                 
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
                 [&_a.perfect-gift-button]:hover:opacity-90 [&_a.perfect-gift-button]:active:scale-95
                 
                 [&_div.review-container]:!mt-8 [&_div.review-container]:!mb-12"
      dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }}
    />
  );
};