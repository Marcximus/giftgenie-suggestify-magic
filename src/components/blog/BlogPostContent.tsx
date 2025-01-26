import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  // Remove problematic inline styles from content
  const sanitizeContent = (content: string) => {
    return content
      // Remove float styles
      .replace(/style="[^"]*float:\s*(?:left|right)[^"]*"/gi, '')
      // Remove fixed width styles
      .replace(/style="[^"]*width:\s*\d+[^"]*"/gi, '')
      // Remove margin styles
      .replace(/style="[^"]*margin[^"]*"/gi, '')
      // Remove text-align styles
      .replace(/style="[^"]*text-align[^"]*"/gi, '')
      // Remove padding styles
      .replace(/style="[^"]*padding[^"]*"/gi, '')
      // Remove max-width styles
      .replace(/style="[^"]*max-width[^"]*"/gi, '')
      // Remove any remaining style attributes
      .replace(/style="[^"]*"/gi, '')
      // Force div containers to be full width and left-aligned
      .replace(/<div(?!\s+class="[^"]*(?:product-actions|product-review))/gi, '<div class="w-full text-left"')
      // Remove any width classes from non-product sections
      .replace(/class="(?![^"]*(?:product-actions|product-review))[^"]*(?:w-\d+\/\d+|max-w-[^\s"]*)[^"]*"/gi, 'class="w-full text-left"')
      // Transform product review sections with specific centering classes
      .replace(
        /<div class="[^"]*product-review[^"]*">/gi,
        '<div class="product-review-container mx-auto my-12 flex flex-col items-center justify-center max-w-2xl text-center px-6 sm:px-8">'
      )
      // Center all elements within product reviews
      .replace(
        /(<div class="[^"]*product-review-container[^"]*">)([\s\S]*?)(<\/div>)/gi,
        (match, start, content, end) => {
          return start + 
            content
              .replace(/<p/g, '<p class="text-center w-full mb-6 !text-center font-medium"')
              .replace(/<span/g, '<span class="text-center block w-full !text-center mb-4"')
              .replace(/<h3/g, '<h3 class="text-center w-full mb-6 !text-center font-semibold text-lg sm:text-xl"')
              .replace(/<h4/g, '<h4 class="text-center w-full mb-4 !text-center font-medium"') +
            end;
        }
      );
  };

  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg w-full !max-w-none !m-0 !p-0
                 prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                 prose-p:leading-relaxed prose-p:mb-4 prose-p:w-full prose-p:text-left
                 
                 prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                 prose-h1:font-bold prose-h1:mb-6 prose-h1:w-full prose-h1:text-left
                 
                 prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                 prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4 prose-h2:w-full prose-h2:text-left
                 
                 prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                 prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-3 prose-h3:w-full prose-h3:text-left
                 
                 prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4 prose-ul:w-full prose-ul:text-left
                 prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4 prose-ol:w-full prose-ol:text-left
                 
                 prose-img:w-full prose-img:h-auto prose-img:my-4 sm:prose-img:my-6
                 prose-img:rounded-lg prose-img:shadow-md
                 
                 prose-a:text-primary prose-a:font-medium prose-a:no-underline
                 hover:prose-a:text-primary/90
                 
                 [&>*]:w-full [&>*]:!max-w-none [&>*]:!mx-0 [&>*]:!px-0 [&>*]:text-left
                 
                 [&_div.flex]:w-full [&_div.flex]:my-2
                 
                 [&_div.product-actions]:flex [&_div.product-actions]:flex-col
                 [&_div.product-actions]:items-center [&_div.product-actions]:gap-2
                 [&_div.product-actions]:my-2 [&_div.product-actions]:!text-center
                 
                 [&_div.product-review-container]:flex [&_div.product-review-container]:flex-col
                 [&_div.product-review-container]:items-center [&_div.product-review-container]:justify-center
                 [&_div.product-review-container]:w-full [&_div.product-review-container]:max-w-2xl
                 [&_div.product-review-container]:mx-auto [&_div.product-review-container]:my-12
                 [&_div.product-review-container]:text-center [&_div.product-review-container]:px-6 [&_div.product-review-container]:sm:px-8
                 [&_div.product-review-container]:bg-gray-50 [&_div.product-review-container]:py-8 [&_div.product-review-container]:rounded-xl
                 [&_div.product-review-container]:shadow-sm [&_div.product-review-container]:border [&_div.product-review-container]:border-gray-100
                 
                 [&_div.product-review-container_*]:!text-center
                 [&_div.product-review-container_p]:!text-center [&_div.product-review-container_p]:mb-6 [&_div.product-review-container_p]:font-medium
                 [&_div.product-review-container_span]:!text-center [&_div.product-review-container_span]:block [&_div.product-review-container_span]:mb-4
                 [&_div.product-review-container_h3]:!text-center [&_div.product-review-container_h3]:mb-6 [&_div.product-review-container_h3]:font-semibold [&_div.product-review-container_h3]:text-lg [&_div.product-review-container_h3]:sm:text-xl
                 [&_div.product-review-container_h4]:!text-center [&_div.product-review-container_h4]:mb-4 [&_div.product-review-container_h4]:font-medium
                 
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
      dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }}
    />
  );
};