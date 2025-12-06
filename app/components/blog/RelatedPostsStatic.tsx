import Link from "next/link";
import { Card } from "@/components/ui/card";

interface RelatedPost {
  title: string;
  slug: string;
  image_url: string | null;
  excerpt: string | null;
}

interface RelatedPostsStaticProps {
  posts: RelatedPost[];
}

export const RelatedPostsStatic = ({ posts }: RelatedPostsStaticProps) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Link href={`/blog/post/${post.slug}`} key={post.slug} className="group">
            <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
              {post.image_url && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
