import { Tables } from "@/integrations/supabase/types";
import { blogPostContentStyles } from "./content/BlogPostContentStyles";
import { processContent } from "./content/BlogContentProcessor";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  // Parse the affiliate_links JSON if it exists
  const affiliateLinks = Array.isArray(post.affiliate_links) 
    ? post.affiliate_links 
    : typeof post.affiliate_links === 'string' 
      ? JSON.parse(post.affiliate_links)
      : [];

  console.log('Processing blog post with affiliate links:', {
    postTitle: post.title,
    affiliateLinks: affiliateLinks
  });

  // Process the content with affiliate links and reviews
  const processedContent = processContent(post.content, affiliateLinks);

  return (
    <div className={blogPostContentStyles}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
};