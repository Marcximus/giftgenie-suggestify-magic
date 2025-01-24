import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { Edit } from "lucide-react";

interface PublishedPostsTabProps {
  posts: Tables<"blog_posts">[];
}

export const PublishedPostsTab = ({ posts }: PublishedPostsTabProps) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">{post.title}</h3>
            <p className="text-sm text-muted-foreground">
              Published: {new Date(post.published_at || "").toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
      ))}
    </div>
  );
};