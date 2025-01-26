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
      // Force div containers to be full width and left-aligned, except for product-actions and review containers
      .replace(/<div(?!\s+class="[^"]*(?:product-actions|review-container))/gi, '<div class="w-full text-left"')
      // Center h1 tags (titles) with adjusted margins
      .replace(/<h1/gi, '<h1 class="!text-center mt-4 sm:mt-8 mb-6 sm:mb-12 px-8"')
      // Center review sections with flex-col
      .replace(/<div[^>]*class="[^"]*flex items-center[^"]*">/gi, '<div class="!text-center !flex !flex-col !justify-center !items-center gap-2">')
      .replace(/<div[^>]*class="[^"]*review-text[^"]*">/gi, '<div class="!text-center">')
      // Update product-actions container to use flex-col
      .replace(/<div[^>]*class="[^"]*product-actions[^"]*">/gi, '<div class="!flex !flex-col !justify-center !items-center gap-2 my-4 product-actions">')
      // Update amazon-button to remove w-full
      .replace(/class="amazon-button[^"]*"/gi, 'class="amazon-button inline-flex items-center justify-center px-6 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm shadow-sm hover:shadow-md"');
  };

  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg w-full !max-w-none !m-0
                 px-6 sm:px-8 md:px-12 lg:px-20
                 prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                 prose-p:leading-relaxed prose-p:mb-4 prose-p:w-full prose-p:text-left
                 
                 prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                 prose-h1:font-bold prose-h1:mb-4 sm:prose-h1:mb-6 prose-h1:w-full prose-h1:!text-center
                 prose-h1:px-4 sm:prose-h1:px-8
                 
                 prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                 prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4 prose-h2:w-full prose-h2:text-left
                 
                 prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                 prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-3 prose-h3:w-full prose-h3:text-left
                 
                 prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4 prose-ul:w-full prose-ul:text-left
                 prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4 prose-ol:w-full prose-ol:text-left
                 
                 prose-img:w-full prose-img:h-auto prose-img:my-4 sm:prose-img:my-6
                 prose-img:rounded-lg prose-img:shadow-md
                 prose-img:max-w-[300px] sm:prose-img:max-w-[400px] lg:prose-img:max-w-[500px]
                 prose-img:mx-auto
                 
                 prose-a:text-primary prose-a:font-medium prose-a:no-underline
                 hover:prose-a:text-primary/90
                 
                 [&>*]:w-full [&>*]:!max-w-none [&>*]:!mx-0 [&>*]:!px-0 [&>*]:text-left
                 
                 [&_div.flex]:w-full [&_div.flex]:my-2 [&_div.flex]:justify-center
                 
                 [&_div.product-actions]:flex [&_div.product-actions]:flex-col
                 [&_div.product-actions]:items-center [&_div.product-actions]:gap-2
                 [&_div.product-actions]:my-2 [&_div.product-actions]:!text-center"
      dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }}
    />
  );
};