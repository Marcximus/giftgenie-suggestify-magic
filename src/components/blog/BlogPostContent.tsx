import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
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
      
      // Standardize product sections
      .replace(/<div(?!\s+class="[^"]*(?:product-section|product-actions|review-container))/gi, '<div class="w-full text-left"')
      
      // Center product titles
      .replace(/<h3/gi, '<h3 class="text-xl font-semibold text-center mt-16 mb-8"')
      
      // Standardize product actions container
      .replace(/<div[^>]*class="[^"]*product-actions[^"]*">/gi, '<div class="product-actions flex justify-center items-center w-full my-4">')
      
      // Center review sections
      .replace(/<div[^>]*class="[^"]*review-container[^"]*">/gi, '<div class="review-container flex flex-col items-center my-8">')
      .replace(/<div[^>]*class="[^"]*review-text[^"]*">/gi, '<div class="review-text text-center max-w-2xl mx-auto">')
      
      // Standardize Amazon button containers
      .replace(/<a[^>]*class="[^"]*amazon-button[^"]*">/gi, '<a class="amazon-button inline-flex items-center justify-center px-6 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md shadow-sm transition-all duration-200">');
  };

  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg w-full !max-w-none !m-0
                 px-6 sm:px-8 md:px-16 lg:px-32
                 
                 prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                 prose-p:leading-relaxed prose-p:mb-4
                 
                 prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                 prose-h1:font-bold prose-h1:mb-4 sm:prose-h1:mb-6
                 prose-h1:text-center prose-h1:w-full
                 
                 prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                 prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4
                 
                 prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                 prose-h3:font-semibold prose-h3:text-center
                 
                 prose-img:w-full prose-img:h-auto prose-img:my-8
                 prose-img:rounded-lg prose-img:shadow-md
                 prose-img:max-w-[250px] sm:prose-img:max-w-[350px] lg:prose-img:max-w-[400px]
                 prose-img:mx-auto
                 
                 [&_.product-actions]:flex [&_.product-actions]:justify-center [&_.product-actions]:items-center
                 [&_.product-actions]:w-full [&_.product-actions]:my-4
                 
                 [&_.amazon-button]:inline-flex [&_.amazon-button]:items-center [&_.amazon-button]:justify-center
                 [&_.amazon-button]:px-6 [&_.amazon-button]:py-2 [&_.amazon-button]:bg-[#F97316]
                 [&_.amazon-button]:hover:bg-[#F97316]/90 [&_.amazon-button]:text-white
                 [&_.amazon-button]:rounded-md [&_.amazon-button]:shadow-sm
                 [&_.amazon-button]:transition-all [&_.amazon-button]:duration-200"
      dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }}
    />
  );
};