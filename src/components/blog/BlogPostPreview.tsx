import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
      <h1 className="text-left text-2xl md:text-3xl lg:text-4xl font-bold mb-8">{data.title}</h1>
      
      {data.image_url && (
        <div className="flex justify-center my-8">
          <img
            src={data.image_url}
            alt={data.title}
            className="rounded-lg shadow-md max-w-full h-auto object-cover"
          />
        </div>
      )}
      
      {data.excerpt && (
        <p className="text-left text-sm md:text-base text-muted-foreground mb-8">
          {data.excerpt}
        </p>
      )}

      <div 
        className="mt-8 space-y-6 text-left 
                   [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 
                   [&>h3]:text-lg [&>h3]:md:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                   [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-4 [&>p]:text-left
                   [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                   [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2
                   [&_.product-section]:my-8 [&_.product-section]:p-6 [&_.product-section]:bg-white/50 [&_.product-section]:rounded-lg [&_.product-section]:shadow-md
                   [&_.product-section_img]:w-36 [&_.product-section_img]:h-36 [&_.product-section_img]:object-contain [&_.product-section_img]:mx-auto [&_.product-section_img]:my-4
                   [&_a.amazon-button]:inline-block [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90 [&_a.amazon-button]:text-white [&_a.amazon-button]:px-4 [&_a.amazon-button]:py-2 [&_a.amazon-button]:rounded-md [&_a.amazon-button]:transition-colors [&_a.amazon-button]:duration-200"
        dangerouslySetInnerHTML={{ 
          __html: processContent(data.content, Array.isArray(data.affiliate_links) ? data.affiliate_links : []) 
        }}
      />

      {data.author && (
        <div className="mt-8 pt-4 border-t border-gray-200 text-left text-sm md:text-base text-muted-foreground">
          Written by {data.author}
          {data.published_at && (
            <span> · {new Date(data.published_at).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </article>
  );
};

function processContent(content: string, affiliateLinks: any[]): string {
  if (!content) return '';
  
  let processedContent = content;
  
  // Process affiliate links if they exist
  if (Array.isArray(affiliateLinks)) {
    affiliateLinks.forEach((link, index) => {
      const placeholder = `[PRODUCT_PLACEHOLDER]`;
      const productSection = `
        <div class="product-section">
          <h3 class="text-xl font-bold mb-4">No. ${index + 1}: ${link.productTitle}</h3>
          ${link.imageUrl ? `
            <div class="flex justify-center mb-4">
              <img 
                src="${link.imageUrl}" 
                alt="${link.productTitle}"
                class="rounded-lg shadow-sm"
              />
            </div>
          ` : ''}
          <div class="mt-4 flex justify-center">
            <a 
              href="${link.affiliateLink}"
              target="_blank"
              rel="noopener noreferrer"
              class="amazon-button"
            >
              View on Amazon
            </a>
          </div>
        </div>
      `;
      
      processedContent = processedContent.replace(placeholder, productSection);
    });
  }
  
  // Clean up any remaining placeholders
  processedContent = processedContent.replace(/\[PRODUCT_PLACEHOLDER\]/g, '');
  
  // Remove any HTML comments
  processedContent = processedContent.replace(/<!--[\s\S]*?-->/g, '');
  
  // Ensure proper spacing between elements
  processedContent = processedContent
    .replace(/>\s+</g, '><')
    .replace(/(<\/div>)(?!\s*<\/div>|$)/g, '$1\n')
    .replace(/(<\/h[1-6]>)(?!\s*<\/div>|$)/g, '$1\n')
    .replace(/(<\/p>)(?!\s*<\/div>|$)/g, '$1\n');
  
  return processedContent;
}