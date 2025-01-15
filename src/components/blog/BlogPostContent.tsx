import { Tables } from "@/integrations/supabase/types";
import { blogPostContentStyles } from "./content/BlogPostContentStyles";
import { processContent } from "./content/BlogContentProcessor";
import { AffiliateLink } from "./types/BlogPostTypes";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  // Parse the affiliate_links JSON if it exists
  const affiliateLinks: AffiliateLink[] = Array.isArray(post.affiliate_links) 
    ? (post.affiliate_links as unknown as AffiliateLink[])
    : typeof post.affiliate_links === 'string' 
      ? JSON.parse(post.affiliate_links) as AffiliateLink[]
      : post.affiliate_links as unknown as AffiliateLink[] || [];

  // Process the content with affiliate links
  const processedContent = processContent(post.content, affiliateLinks);

  return (
    <div className={blogPostContentStyles}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
};