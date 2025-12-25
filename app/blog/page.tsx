import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gift Ideas & Inspiration Blog',
  description: 'Discover the best gift ideas, present inspiration, and shopping guides for every occasion. AI-curated gift recommendations for birthdays, holidays, and special events.',
  alternates: {
    canonical: 'https://getthegift.ai/blog',
  },
  openGraph: {
    title: 'Gift Ideas & Inspiration Blog - Get The Gift',
    description: 'Discover the best gift ideas, present inspiration, and shopping guides for every occasion.',
    url: 'https://getthegift.ai/blog',
    type: 'website',
    images: [{
      url: 'https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png',
      width: 1200,
      height: 630,
      alt: 'Get The Gift Blog',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gift Ideas & Inspiration Blog - Get The Gift',
    description: 'Discover the best gift ideas, present inspiration, and shopping guides for every occasion.',
    images: ['https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png'],
  },
};

// ISR with 1-day cache to reduce serverless function load
// Allows runtime data fetching so posts appear in the listing
// Revalidates daily to show new posts without requiring a deploy
export const revalidate = 86400; // 1 day

// Set a maximum runtime for serverless function
export const maxDuration = 10; // Netlify free tier limit

// Fetch blog posts from Supabase with timeout handling
async function getBlogPosts() {
  try {
    // Add 8-second timeout to prevent serverless function timeouts
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 8000)
    );

    const queryPromise = supabase
      .from("blog_posts")
      .select("id, title, slug, image_url, image_alt_text, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error("Error fetching blog posts:", error);
      return [];
    }

    return data as Tables<"blog_posts">[];
  } catch (error) {
    console.error("Timeout or error fetching blog posts:", error);
    return []; // Return empty array on timeout - page will show "no posts" message
  }
}

export default async function Blog() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 inline-block text-transparent bg-clip-text mb-4">
              Perfect Gift Ideas
            </h1>
            <p className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our suggestions feel tailor-made because they practically are. We use <span className="animate-pulse-text text-primary">AI</span> and <span className="animate-pulse-text text-primary">internet magic</span> to find the absolute best gift ideas and popular presents. Thanks to us, you can spend less time gift hunting and more time celebrating (or binge-watching your favorite show—we won't judge).
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts available yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {posts.map((post) => (
                <Link href={`/blog/post/${post.slug}`} key={post.id} prefetch={false}>
                  <article className="group">
                    <Card className="flex h-[40px] overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      {post.image_url && (
                        <div className="w-[40px] h-[40px] relative overflow-hidden flex-shrink-0">
                          <img
                            src={post.image_url}
                            alt={post.image_alt_text || post.title}
                            width="40"
                            height="40"
                            className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-2 flex items-center">
                        <h3 className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </div>
                    </Card>
                  </article>
                </Link>
              ))}
            </div>
          )}

          <footer className="text-center pb-8">
            <p className="text-xs text-muted-foreground">
              Some links may contain affiliate links from Amazon and other vendors
            </p>
          </footer>
        </div>
    </div>
  );
}
