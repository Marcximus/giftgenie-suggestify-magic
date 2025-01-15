import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface RelatedPostsProps {
  currentPostId: string;
  currentPostSlug: string;
}

export const RelatedPosts = ({ currentPostId, currentPostSlug }: RelatedPostsProps) => {
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", currentPostId],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select("title, slug, image_url, excerpt")
        .neq("id", currentPostId)
        .neq("slug", currentPostSlug)
        .lt("published_at", new Date().toISOString()) // Only get previously published posts
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching related posts:", error);
        throw error;
      }

      return posts;
    },
  });

  if (!relatedPosts?.length) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#9b87f5] via-[#D946EF] to-[#0EA5E9] text-transparent bg-clip-text">
        More Gift Ideas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/post/${post.slug}`}
            className="group block"
          >
            <div className="rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl">
              {post.image_url && (
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};