import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { Edit, Trash } from "lucide-react";

interface PublishedPostsTabProps {
  posts: Tables<"blog_posts">[];
  onDelete: (postId: string) => Promise<void>;
}

export const PublishedPostsTab = ({ posts, onDelete }: PublishedPostsTabProps) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div 
          key={post.id} 
          className="p-4 border rounded-lg bg-card"
        >
          <h3 className="font-medium">{post.title}</h3>
          <div className="text-sm text-muted-foreground mt-2">
            <p>
              Published: {new Date(post.published_at || "").toLocaleDateString()}
            </p>
            <p className="mt-1">
              Author: {post.author}
            </p>
            {post.category_id && (
              <p className="mt-1">
                Category ID: {post.category_id}
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to={`/blog/edit/${post.slug}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(post.id)}
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};