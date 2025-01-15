import { Tables } from "@/integrations/supabase/types";
import { ProductReview } from "@/components/product/ProductReview";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

interface AffiliateLink {
  productTitle: string;
  affiliateLink: string;
  imageUrl: string;
  rating?: number;
  totalRatings?: number;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  // Parse the affiliate_links JSON if it exists
  const affiliateLinks: AffiliateLink[] = Array.isArray(post.affiliate_links) 
    ? post.affiliate_links 
    : typeof post.affiliate_links === 'string' 
      ? JSON.parse(post.affiliate_links)
      : [];

  console.log('Processing affiliate links:', affiliateLinks);

  // Create a map of image URLs to their corresponding review data
  const reviewMap = new Map(
    affiliateLinks.map(link => [
      link.imageUrl,
      {
        rating: typeof link.rating === 'number' ? link.rating : undefined,
        totalRatings: typeof link.totalRatings === 'number' ? link.totalRatings : undefined
      }
    ])
  );

  // Split content into segments at image tags
  const segments = post.content.split(/(<img[^>]+>)/);
  
  // Process each segment
  const processedSegments = segments.map(segment => {
    // Check if this segment is an img tag
    if (segment.startsWith('<img')) {
      // Extract the src attribute
      const srcMatch = segment.match(/src="([^"]+)"/);
      if (srcMatch) {
        const imageUrl = srcMatch[1];
        const reviewData = reviewMap.get(imageUrl);
        
        console.log('Processing image:', imageUrl, 'Review data:', reviewData);

        // Add image styling - maintain aspect ratio and prevent compression
        const styledImage = segment.replace(
          'class="',
          'class="w-full max-w-4xl h-auto object-contain rounded-lg shadow-md mx-auto my-6 '
        );
        
        // If we have review data, add the review section
        if (reviewData?.rating !== undefined && reviewData?.totalRatings !== undefined) {
          return `
            <div class="flex flex-col items-center my-8">
              ${styledImage}
              <div class="w-full max-w-2xl mt-4">
                <div class="flex flex-col items-center gap-2 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
                  <div class="flex items-center gap-2">
                    ${Array.from({ length: 5 }, (_, i) => {
                      const rating = reviewData.rating || 0;
                      return `<span class="text-yellow-400 text-xl">
                        ${i < Math.floor(rating) ? '★' : (i < rating ? '★' : '☆')}
                      </span>`;
                    }).join('')}
                    <span class="font-semibold text-xl text-gray-800">
                      ${reviewData.rating.toFixed(1)}
                    </span>
                  </div>
                  <div class="text-base text-gray-600">
                    Based on ${reviewData.totalRatings.toLocaleString()} verified customer reviews
                  </div>
                </div>
              </div>
            </div>`;
        }
        
        // If no review data, just return the styled image in a container
        return `<div class="flex justify-center my-8">${styledImage}</div>`;
      }
    }
    return segment;
  });

  // Join segments back together
  const processedContent = processedSegments.join('');

  return (
    <div className="prose prose-sm md:prose-base lg:prose-lg w-full max-w-none animate-fade-in">
      <div 
        className="text-left px-4 sm:px-6 lg:px-8
                   prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                   prose-p:leading-relaxed prose-p:mb-4
                   
                   prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl
                   prose-h1:font-bold prose-h1:mb-6 prose-h1:text-center
                   
                   prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl
                   prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4
                   
                   prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl
                   prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-3
                   
                   prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-4
                   prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-4
                   
                   prose-img:w-full prose-img:max-w-4xl prose-img:mx-auto
                   prose-img:h-auto prose-img:object-contain prose-img:my-6
                   prose-img:rounded-lg prose-img:shadow-md
                   
                   prose-a:text-primary prose-a:font-medium prose-a:no-underline
                   hover:prose-a:text-primary/90
                   
                   [&_div.flex]:justify-center [&_div.flex]:w-full [&_div.flex]:my-4 sm:[&_div.flex]:my-6
                   [&_a.amazon-button]:inline-block [&_a.amazon-button]:px-6 [&_a.amazon-button]:py-3 
                   [&_a.amazon-button]:bg-[#F97316] [&_a.amazon-button]:hover:bg-[#F97316]/90 
                   [&_a.amazon-button]:text-white [&_a.amazon-button]:rounded-md 
                   [&_a.amazon-button]:transition-colors [&_a.amazon-button]:text-base
                   [&_a.amazon-button]:shadow-sm [&_a.amazon-button]:hover:shadow-md
                   [&_a.amazon-button]:active:scale-95
                   
                   [&_a.perfect-gift-button]:inline-block [&_a.perfect-gift-button]:px-8 [&_a.perfect-gift-button]:py-4
                   [&_a.perfect-gift-button]:bg-gradient-to-r [&_a.perfect-gift-button]:from-primary/80 [&_a.perfect-gift-button]:to-blue-500/80
                   [&_a.perfect-gift-button]:text-white [&_a.perfect-gift-button]:font-medium [&_a.perfect-gift-button]:rounded-lg
                   [&_a.perfect-gift-button]:transition-all [&_a.perfect-gift-button]:duration-300
                   [&_a.perfect-gift-button]:shadow-md [&_a.perfect-gift-button]:hover:shadow-lg
                   [&_a.perfect-gift-button]:hover:opacity-90 [&_a.perfect-gift-button]:active:scale-95"
      >
        <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      </div>
    </div>
  );
};