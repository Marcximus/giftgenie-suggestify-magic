import { useQuery } from "@tanstack/react-query";
import BlogPostForm from "@/components/blog/BlogPostForm";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarClock } from "lucide-react";

const BlogNew = () => {
  const { data: nextScheduledPost } = useQuery({
    queryKey: ["next-scheduled-post"],
    queryFn: async () => {
      // First, get all published post titles
      const { data: publishedPosts, error: publishedError } = await supabase
        .from("blog_posts")
        .select("title");

      if (publishedError) throw publishedError;
      
      const publishedTitles = new Set(publishedPosts?.map(post => post.title) || []);

      // Get the next scheduled post that isn't published yet
      const { data: queuedPosts, error: queueError } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(1);
      
      if (queueError) throw queueError;

      // Return null if no posts found or all are published
      if (!queuedPosts || queuedPosts.length === 0) return null;

      // Filter out if it's already published
      const nextPost = queuedPosts.find(post => !publishedTitles.has(post.title));
      return nextPost || null;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      
      {nextScheduledPost && (
        <Alert className="mb-6">
          <CalendarClock className="h-4 w-4" />
          <AlertDescription>
            Next scheduled post: <span className="font-medium">{nextScheduledPost.title}</span>
            {nextScheduledPost.scheduled_date && (
              <span className="text-sm text-muted-foreground ml-2">
                (Scheduled for {new Date(nextScheduledPost.scheduled_date).toLocaleDateString()} at {nextScheduledPost.scheduled_time || 'TBD'})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <BlogPostForm />
    </div>
  );
};

export default BlogNew;