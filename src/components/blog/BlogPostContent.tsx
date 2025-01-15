import { Tables } from "@/integrations/supabase/types";
import { blogPostContentStyles } from "./content/BlogPostContentStyles";
import { processContent } from "./content/BlogContentProcessor";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  // Parse the affiliate_links JSON if it exists and ensure proper typing
  const affiliateLinks = Array.isArray(post.affiliate_links) 
    ? post.affiliate_links.map(link => ({
        ...link,
        rating: typeof link.rating === 'string' ? parseFloat(link.rating) : link.rating,
        totalRatings: typeof link.totalRatings === 'string' ? parseInt(link.totalRatings, 10) : link.totalRatings
      }))
    : typeof post.affiliate_links === 'string' 
      ? JSON.parse(post.affiliate_links).map(link => ({
          ...link,
          rating: typeof link.rating === 'string' ? parseFloat(link.rating) : link.rating,
          totalRatings: typeof link.totalRatings === 'string' ? parseInt(link.totalRatings, 10) : link.totalRatings
        }))
      : [];

  console.log('Processing blog post with affiliate links:', {
    postTitle: post.title,
    affiliateLinks: affiliateLinks.map(link => ({
      ...link,
      rating: typeof link.rating === 'number' ? link.rating : null,
      totalRatings: typeof link.totalRatings === 'number' ? link.totalRatings : null
    }))
  });

  // Process the content with affiliate links and reviews
  const processedContent = processContent(post.content, affiliateLinks);

  return (
    <div className={blogPostContentStyles}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
};