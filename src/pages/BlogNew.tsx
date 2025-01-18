import { useQuery } from "@tanstack/react-query";
import { BlogPostForm } from "@/components/blog/BlogPostForm";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostFormData } from "@/components/blog/types/BlogPostTypes";

const BlogNew = () => {
  const { data: nextScheduledPost, isLoading } = useQuery({
    queryKey: ["next-scheduled-post"],
    queryFn: async () => {
      console.log("Fetching next scheduled post...");
      
      // First, get all published post titles
      const { data: publishedPosts, error: publishedError } = await supabase
        .from("blog_posts")
        .select("title");

      if (publishedError) {
        console.error("Error fetching published posts:", publishedError);
        throw publishedError;
      }

      const publishedTitles = new Set(publishedPosts?.map(post => post.title.toLowerCase()));
      console.log("Published titles:", publishedTitles);

      // Get all pending posts from the queue
      const { data: queuedPosts, error: queueError } = await supabase
        .from("blog_post_queue")
        .select("title")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true, nullsFirst: true })
        .order("scheduled_time", { ascending: true, nullsFirst: true });
      
      if (queueError) {
        console.error("Error fetching queued posts:", queueError);
        return "";
      }

      console.log("All queued posts:", queuedPosts);

      // Find the first post that isn't published yet
      const nextPost = queuedPosts?.find(post => !publishedTitles.has(post.title.toLowerCase()));
      console.log("Next unpublished post:", nextPost);

      if (nextPost) {
        console.log("Returning title:", nextPost.title);
        return nextPost.title;
      }

      return "";
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: BlogPostFormData) => {
    // Implementation of submit logic
    console.log("Submitting blog post:", data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      <BlogPostForm 
        initialTitle={nextScheduledPost} 
        onSubmit={handleSubmit}
        key={nextScheduledPost} 
      />
    </div>
  );
};

export default BlogNew;