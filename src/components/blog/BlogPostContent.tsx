import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
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
      // Center product actions container with strong centering and vertical layout
      .replace(
        /<div[^>]*class="[^"]*product-actions[^"]*">/gi, 
        '<div class="!block !w-fit !mx-auto !text-center !my-6"><div class="!flex !flex-col !items-center !justify-center !gap-4">'
      )
      // Close the extra div for product actions
      .replace(/<\/div>(?=\s*<div\s+class="[^"]*prose\s)/gi, '</div></div>')
      // Format review container with strong centering
      .replace(
        /<div[^>]*class="[^"]*flex items-center[^"]*">/gi, 
        '<div class="!flex !flex-col !items-center !justify-center !w-fit !mx-auto !text-center !mb-4">'
      )
      // Style Amazon button with strong centering and proper dimensions
      .replace(
        /<a[^>]*class="[^"]*amazon-button[^"]*">/gi, 
        '<a class="!inline-block !w-fit !mx-auto !px-6 !py-2 !bg-[#F97316] !text-white !rounded-md !text-sm !font-medium !transition-all !duration-200 hover:!bg-[#F97316]/90 hover:!shadow-md active:!scale-95">'
      );
  };

  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg w-full !max-w-none !m-0
                 px-6 sm:px-8 md:px-12 lg:px-20
                 prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                 prose-p:leading-relaxed prose-p:mb-4
                 
                 prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                 prose-h1:font-bold prose-h1:mb-4 sm:prose-h1:mb-6
                 
                 prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                 prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4
                 
                 prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                 prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-3
                 
                 prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4
                 prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4
                 
                 prose-img:w-full prose-img:h-auto prose-img:my-4 sm:prose-img:my-6
                 prose-img:rounded-lg prose-img:shadow-md
                 prose-img:max-w-[300px] sm:prose-img:max-w-[400px] lg:prose-img:max-w-[500px]
                 prose-img:mx-auto
                 
                 prose-a:text-primary prose-a:font-medium prose-a:no-underline
                 hover:prose-a:text-primary/90
                 
                 [&>*]:!max-w-none [&>*]:!mx-0 [&>*]:!px-0
                 
                 [&_div.flex]:my-2 [&_div.flex]:justify-center
                 
                 [&_.product-actions]:!w-fit [&_.product-actions]:!mx-auto
                 [&_.product-actions]:!text-center [&_.product-actions]:!my-6
                 
                 [&_span.text-yellow-400]:!text-yellow-400 [&_span.text-yellow-400]:!text-xl
                 
                 [&_a.amazon-button]:!inline-block [&_a.amazon-button]:!w-fit 
                 [&_a.amazon-button]:!mx-auto [&_a.amazon-button]:!px-6 [&_a.amazon-button]:!py-2
                 [&_a.amazon-button]:!bg-[#F97316] [&_a.amazon-button]:!text-white 
                 [&_a.amazon-button]:!rounded-md [&_a.amazon-button]:!text-sm 
                 [&_a.amazon-button]:!font-medium [&_a.amazon-button]:!transition-all 
                 [&_a.amazon-button]:!duration-200 hover:[&_a.amazon-button]:!bg-[#F97316]/90 
                 hover:[&_a.amazon-button]:!shadow-md active:[&_a.amazon-button]:!scale-95"
      dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }}
    />
  );
};