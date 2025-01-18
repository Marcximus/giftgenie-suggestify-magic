import { useQuery } from "@tanstack/react-query";
import BlogPostForm from "@/components/blog/BlogPostForm";
import { supabase } from "@/integrations/supabase/client";

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

      const publishedTitles = new Set(publishedPosts?.map(post => post.title));
      console.log("Published titles:", publishedTitles);

      // Get the next scheduled post that isn't published yet
      const { data: nextPost, error: queueError } = await supabase
        .from("blog_post_queue")
        .select("title")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true, nullsFirst: true })  // Changed to include null dates
        .order("scheduled_time", { ascending: true, nullsFirst: true })  // Changed to include null times
        .limit(1)
        .single();
      
      if (queueError) {
        console.error("Error fetching queued posts:", queueError);
        return "";  // Return empty string instead of throwing
      }

      console.log("Next post from queue:", nextPost);

      // If we found a post and it's not already published, return its title
      if (nextPost && !publishedTitles.has(nextPost.title)) {
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

  console.log("Rendering BlogNew with title:", nextScheduledPost);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      <BlogPostForm 
        initialTitle={nextScheduledPost} 
        key={nextScheduledPost} 
      />
    </div>
  );
};

export default BlogNew;