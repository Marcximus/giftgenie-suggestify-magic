import { useQuery } from "@tanstack/react-query";
import BlogPostForm from "@/components/blog/BlogPostForm";
import { supabase } from "@/integrations/supabase/client";

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
        .select("title")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("scheduled_time", { ascending: true, nullsFirst: false })
        .limit(1);
      
      if (error) throw error;

      // Filter out if it's already published
      const nextPost = data?.[0];
      if (nextPost && !publishedTitles.has(nextPost.title)) {
        return nextPost;
      }
      return null;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      <BlogPostForm initialTitle={nextScheduledPost?.title} />
    </div>
  );
};

export default BlogNew;