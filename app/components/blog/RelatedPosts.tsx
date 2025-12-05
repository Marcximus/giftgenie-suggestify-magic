import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";

interface RelatedPostsProps {
  currentPostId: string;
  currentPostSlug: string;
}

export const RelatedPosts = ({ currentPostId, currentPostSlug }: RelatedPostsProps) => {
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", currentPostId],
    queryFn: async () => {
      const { data: relevantPosts, error: relevantError } = await supabase
        .from("blog_posts")
        .select("title, slug, image_url, excerpt, meta_description")
        .neq("id", currentPostId)
        .neq("slug", currentPostSlug)
        .not("published_at", "is", null)
        .gte("word_count", 500)
        .order("created_at", { ascending: false })
        .limit(12);

      if (relevantError) {
        console.error("Error fetching related posts:", relevantError);
        throw relevantError;
      }

      if (relevantPosts && relevantPosts.length > 6) {
        return relevantPosts
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);
      }

      return relevantPosts || [];
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  if (!relatedPosts?.length) return null;

  return (
    <nav className="mt-12 pt-8 border-t" aria-label="Related gift ideas">
      <Link href="/blog" className="block">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#9b87f5] via-[#D946EF] to-[#0EA5E9] text-transparent bg-clip-text hover:opacity-80 transition-opacity">
          More Gift Ideas
        </h2>
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <article key={post.slug} className="group">
            <Link
              to={`/blog/post/${post.slug}`}
              className="block"
              title={`Read more about ${post.title}`}
              aria-label={`Read more about ${post.title}`}
            >
              <div className="rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl">
                {post.image_url && (
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      width="400"
                      height="225"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  ) : post.meta_description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.meta_description}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </nav>
  );
};