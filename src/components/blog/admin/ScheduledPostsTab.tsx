import { Tables } from "@/integrations/supabase/types";

interface ScheduledPostsTabProps {
  posts: Tables<"blog_post_queue">[];
}

export const ScheduledPostsTab = ({ posts }: ScheduledPostsTabProps) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div 
          key={post.id} 
          className="p-4 border rounded-lg bg-card"
        >
          <h3 className="font-medium">{post.title}</h3>
          <div className="text-sm text-muted-foreground mt-2">
            <p>Status: {post.status}</p>
            {post.error_message && (
              <p className="text-destructive mt-1">Error: {post.error_message}</p>
            )}
            <p className="mt-1">
              Created: {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};