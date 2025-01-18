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

      console.log("Published posts:", publishedPosts);
      const publishedTitles = new Set(publishedPosts?.map(post => post.title));

      // Get the next scheduled post that isn't published yet
      const { data: queuedPosts, error: queueError } = await supabase
        .from("blog_post_queue")
        .select("title")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("scheduled_time", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();  // Changed from single() to maybeSingle()
      
      if (queueError) {
        console.error("Error fetching queued posts:", queueError);
        throw queueError;
      }

      console.log("Next queued post:", queuedPosts);
      
      // Check if the post is already published
      if (queuedPosts && !publishedTitles.has(queuedPosts.title)) {
        console.log("Returning next post title:", queuedPosts.title);
        return queuedPosts;
      }

      console.log("No unpublished posts found");
      return null;
    },
  });

  console.log("Next scheduled post data:", nextScheduledPost);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      <BlogPostForm 
        initialTitle={nextScheduledPost?.title} 
        key={nextScheduledPost?.title} 
      />
    </div>
  );
};

export default BlogNew;