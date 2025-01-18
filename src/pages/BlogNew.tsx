import BlogPostForm from "@/components/blog/BlogPostForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BlogNew = () => {
  const { data: nextScheduledPost } = useQuery({
    queryKey: ["next-scheduled-post"],
    queryFn: async () => {
      const { data: publishedPosts } = await supabase
        .from("blog_posts")
        .select("title");

      const publishedTitles = new Set(publishedPosts?.map(post => post.title));

      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(1);
      
      if (error) throw error;

      return data?.find(post => !publishedTitles.has(post.title));
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      
      {nextScheduledPost?.title && (
        <p className="text-gray-600 mb-4">
          Next scheduled post: {nextScheduledPost.title}
        </p>
      )}

      <BlogPostForm />
    </div>
  );
};

export default BlogNew;