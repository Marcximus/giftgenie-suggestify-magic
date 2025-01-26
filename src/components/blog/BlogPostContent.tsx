import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  const sanitizeContent = (content: string) => {
    return content
      // Clean up any problematic inline styles
      .replace(/style="[^"]*"/gi, '')
      .replace(/align="[^"]*"/gi, '')
      .replace(/class="[^"]*"/gi, '')
      
      // Format headings with proper alignment
      .replace(/<h1[^>]*>/gi, '<h1 class="text-center mt-8 sm:mt-12 mb-8 sm:mb-16 text-3xl sm:text-4xl md:text-5xl font-bold px-4 sm:px-8">')
      .replace(/<h2[^>]*>/gi, '<h2 class="text-left text-xl sm:text-2xl md:text-3xl font-semibold mt-12 mb-6">')
      .replace(/<h3[^>]*>/gi, '<h3 class="text-left text-lg sm:text-xl md:text-2xl font-semibold mt-16 mb-8">')
      
      // Ensure regular paragraphs are left-aligned
      .replace(/<p[^>]*>/gi, '<p class="text-left my-4 leading-relaxed mx-0">')
      
      // Restore product sections styling
      .replace(
        /<div[^>]*class="[^"]*product-actions[^"]*"[^>]*>/gi, 
        '<div class="flex flex-col items-center gap-2 my-6 text-center p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">'
      )
      
      // Restore review container styling with gold stars
      .replace(
        /<div[^>]*class="[^"]*review-container[^"]*"[^>]*>/gi, 
        '<div class="flex flex-col items-center gap-2 my-8 text-center p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">'
      )
      
      // Format images consistently
      .replace(
        /<img/gi, 
        '<img class="mx-auto my-8 max-w-[250px] sm:max-w-[350px] lg:max-w-[400px] rounded-lg shadow-md"'
      )
      
      // Restore Amazon button styling with orange color
      .replace(
        /<a[^>]*class="[^"]*amazon-button[^"]*"[^>]*>/gi, 
        '<a class="inline-flex items-center justify-center px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm shadow-sm hover:shadow-md mx-auto mb-8">'
      );
  };

  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg w-full max-w-none
                 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32
                 
                 prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                 prose-p:leading-relaxed prose-p:mb-4 prose-p:w-full prose-p:text-left
                 prose-p:mx-0
                 
                 prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                 prose-h1:font-bold prose-h1:mb-4 sm:prose-h1:mb-6 prose-h1:w-full prose-h1:text-center
                 prose-h1:px-4 sm:prose-h1:px-8
                 
                 prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                 prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4 prose-h2:w-full prose-h2:text-left
                 
                 prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                 prose-h3:font-semibold prose-h3:mt-16 prose-h3:mb-8 prose-h3:w-full prose-h3:text-left
                 
                 prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4 prose-ul:w-full prose-ul:text-left
                 prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4 prose-ol:w-full prose-ol:text-left
                 
                 prose-img:w-full prose-img:h-auto prose-img:mt-8 prose-img:mb-8
                 prose-img:rounded-lg prose-img:shadow-md
                 prose-img:max-w-[250px] sm:prose-img:max-w-[350px] lg:prose-img:max-w-[400px]
                 prose-img:mx-auto
                 
                 prose-a:text-primary prose-a:font-medium prose-a:no-underline
                 hover:prose-a:text-primary/90
                 
                 [&>*]:w-full [&>*]:max-w-none [&>*]:mx-0 [&>*]:px-0
                 
                 [&_div.product-actions]:flex [&_div.product-actions]:flex-col
                 [&_div.product-actions]:items-center [&_div.product-actions]:gap-2
                 [&_div.product-actions]:my-6 [&_div.product-actions]:text-center
                 [&_div.product-actions]:p-6 [&_div.product-actions]:bg-gradient-to-r
                 [&_div.product-actions]:from-gray-50 [&_div.product-actions]:to-gray-100
                 [&_div.product-actions]:rounded-xl [&_div.product-actions]:shadow-sm
                 
                 [&_div.review-container]:flex [&_div.review-container]:flex-col
                 [&_div.review-container]:items-center [&_div.review-container]:gap-2
                 [&_div.review-container]:my-8 [&_div.review-container]:text-center
                 [&_div.review-container]:p-6 [&_div.review-container]:bg-gradient-to-r
                 [&_div.review-container]:from-gray-50 [&_div.review-container]:to-gray-100
                 [&_div.review-container]:rounded-xl [&_div.review-container]:shadow-sm
                 
                 [&_a.amazon-button]:inline-flex [&_a.amazon-button]:items-center 
                 [&_a.amazon-button]:justify-center [&_a.amazon-button]:px-4 [&_a.amazon-button]:py-2
                 [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90
                 [&_a.amazon-button]:text-white [&_a.amazon-button]:rounded-md
                 [&_a.amazon-button]:transition-colors [&_a.amazon-button]:text-sm
                 [&_a.amazon-button]:shadow-sm [&_a.amazon-button]:hover:shadow-md
                 [&_a.amazon-button]:mx-auto [&_a.amazon-button]:mb-8
                 
                 [&_div]:not([class*='product-actions']):not([class*='review-container']):text-left
                 
                 [&_span.text-yellow-400]:text-[#FFB800]"
      dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }}
    />
  );
};