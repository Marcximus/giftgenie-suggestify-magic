import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Spinner } from "@/components/ui/spinner";

interface BlogPostContentProps {
  post: Tables<"blog_posts">;
}

export const BlogPostContent = ({ post }: BlogPostContentProps) => {
  const [processedContent, setProcessedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProcessedContent = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching processed content for post:', post.id);

        // Try to get cached content first
        const { data: cachedData, error: cacheError } = await supabase
          .from("blog_posts_cache")
          .select("processed_content, cache_version")
          .eq("id", post.id)
          .single();

        if (cachedData?.processed_content) {
          console.log('Found cached content with version:', cachedData.cache_version);
          setProcessedContent(cachedData.processed_content);
          setIsLoading(false);
          return;
        }

        if (cacheError) {
          console.log('Cache miss or error:', cacheError.message);
        }

        // If no cache found, process the content
        const response = await supabase.functions.invoke('process-blog-content', {
          body: { content: post.content }
        });

        if (response.error) {
          throw new Error(`Error processing content: ${response.error.message}`);
        }

        const processedContent = response.data?.processedContent;
        
        if (processedContent) {
          // Store in cache
          const { error: insertError } = await supabase
            .from("blog_posts_cache")
            .upsert({
              id: post.id,
              processed_content: processedContent,
              cache_version: 'v1'
            });

          if (insertError) {
            console.error('Error caching content:', insertError);
          }

          setProcessedContent(processedContent);
        }
      } catch (error) {
        console.error('Error fetching processed content:', error);
        // Fallback to original content if processing fails
        setProcessedContent(post.content);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcessedContent();
  }, [post.id, post.content]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div 
      className="prose prose-lg max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: processedContent || post.content }}
    />
  );
};