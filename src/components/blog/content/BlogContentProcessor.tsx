import { AffiliateLink } from "../types/BlogPostTypes";

export const processContent = (
  content: string,
  affiliateLinks: AffiliateLink[]
): string => {
  // Create a map of image URLs to their corresponding review data
  const reviewMap = new Map(
    affiliateLinks.map(link => [
      link.imageUrl,
      {
        rating: typeof link.rating === 'number' ? link.rating : 
                typeof link.rating === 'string' ? parseFloat(link.rating) : undefined,
        totalRatings: typeof link.totalRatings === 'number' ? link.totalRatings :
                     typeof link.totalRatings === 'string' ? parseInt(link.totalRatings, 10) : undefined
      }
    ])
  );

  console.log('Review map created:', Array.from(reviewMap.entries()));

  // Split content into segments at image tags
  const segments = content.split(/(<img[^>]+>)/);
  
  // Process each segment
  return segments.map(segment => {
    // Check if this segment is an img tag
    if (segment.startsWith('<img')) {
      // Extract the src attribute
      const srcMatch = segment.match(/src="([^"]+)"/);
      if (srcMatch) {
        const imageUrl = srcMatch[1];
        const reviewData = reviewMap.get(imageUrl);
        
        console.log('Processing image with review data:', {
          imageUrl,
          reviewData
        });

        // Add image styling
        const styledImage = segment.replace(
          /class="([^"]*)"/,
          'class="w-full max-w-xl h-auto object-contain rounded-lg shadow-md mx-auto my-4 $1"'
        );
        
        // If we have review data, add the review section
        if (reviewData?.rating !== undefined && reviewData?.totalRatings !== undefined) {
          return `
            <div class="flex flex-col items-center my-6 w-full">
              ${styledImage}
              <div class="w-full max-w-xl mt-4">
                <div class="flex flex-col items-center gap-2 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
                  <div class="flex items-center gap-2">
                    ${Array.from({ length: 5 }, (_, i) => {
                      const rating = reviewData.rating || 0;
                      return `<span class="text-yellow-400 text-lg">
                        ${i < Math.floor(rating) ? '★' : (i < rating ? '★' : '☆')}
                      </span>`;
                    }).join('')}
                    <span class="font-semibold text-lg text-gray-800">
                      ${reviewData.rating.toFixed(1)}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600">
                    Based on ${reviewData.totalRatings.toLocaleString()} verified customer reviews
                  </div>
                </div>
              </div>
            </div>`;
        }
        
        // If no review data, just return the styled image in a container
        return `<div class="flex justify-center my-6 w-full">${styledImage}</div>`;
      }
    }
    return segment;
  }).join('');
};