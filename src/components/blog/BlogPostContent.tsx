import { Tables } from "@/integrations/supabase/types";
import { blogPostContentStyles } from "./content/BlogPostContentStyles";
import { processContent } from "./content/BlogContentProcessor";
import { affiliateLinksUtils } from "./types/BlogPostTypes";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  // Process the content with affiliate links
  const processedContent = processContent(post.content, post.affiliate_links);

  return (
    <div className={blogPostContentStyles}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
};