import BlogPostForm from "@/components/blog/BlogPostForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDays } from "lucide-react";

const BlogNew = () => {
  const { data: nextScheduledPost } = useQuery({
    queryKey: ["next-scheduled-post"],
    queryFn: async () => {
      // First, get all published post titles
      const { data: publishedPosts } = await supabase
        .from("blog_posts")
        .select("title");

      const publishedTitles = new Set(publishedPosts?.map(post => post.title));

      // Get the next scheduled post that isn't published yet
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(1);
      
      if (error) throw error;

      // Filter out if it's already published
      return data?.find(post => !publishedTitles.has(post.title));
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      
      {nextScheduledPost && (
        <Alert className="mb-6">
          <CalendarDays className="h-4 w-4" />
          <AlertDescription>
            Next scheduled post: <span className="font-semibold">{nextScheduledPost.title}</span>
            {nextScheduledPost.scheduled_date && (
              <span className="ml-2 text-muted-foreground">
                (Scheduled for: {new Date(nextScheduledPost.scheduled_date).toLocaleDateString()}{" "}
                {nextScheduledPost.scheduled_time || ""})
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