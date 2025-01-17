import { Tables } from "@/integrations/supabase/types";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  return (
    <article className="prose prose-sm md:prose-base lg:prose-lg w-full max-w-none animate-fade-in">
      <div 
        className="text-left px-4 sm:px-6 lg:px-8
                   prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                   prose-p:leading-relaxed prose-p:mb-4
                   
                   prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                   prose-h1:font-bold prose-h1:mb-6 prose-h1:text-center
                   
                   prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                   prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4
                   
                   prose-h3:text-xl sm:prose-h3:text-2xl md:prose-h3:text-3xl
                   prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-center
                   
                   prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4
                   prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4
                   
                   prose-img:w-full prose-img:max-w-2xl prose-img:mx-auto
                   prose-img:aspect-[4/3] prose-img:my-4 sm:prose-img:my-6
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

                   [&_div.review-info]:bg-gradient-to-r [&_div.review-info]:from-gray-50 [&_div.review-info]:to-gray-100
                   [&_div.review-info]:rounded-xl [&_div.review-info]:shadow-sm [&_div.review-info]:p-6 [&_div.review-info]:my-6
                   [&_div.review-info]:flex [&_div.review-info]:flex-col [&_div.review-info]:items-center [&_div.review-info]:gap-2

                   [&_p]:text-base [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4
                   [&_h3]:text-xl [&_h3]:sm:text-2xl [&_h3]:md:text-3xl
                   [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-center"
      >
        <div 
          className="prose prose-sm md:prose-base lg:prose-lg w-full"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  );
};