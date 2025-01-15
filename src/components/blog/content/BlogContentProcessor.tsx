import { AffiliateLink } from "../types/BlogPostTypes";

export const processContent = (
  content: string,
  affiliateLinks: AffiliateLink[]
): string => {
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
        
        // Add image styling
        const styledImage = segment.replace(
          /class="([^"]*)"/,
          'class="w-full max-w-xl h-auto object-contain rounded-lg shadow-md mx-auto my-4 $1"'
        );
        
        // Return the styled image in a container
        return `<div class="flex justify-center my-6 w-full">${styledImage}</div>`;
      }
    }
    return segment;
  }).join('');
};