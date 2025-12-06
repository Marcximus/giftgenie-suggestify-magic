import { notFound } from 'next/navigation';
import { supabase } from "@/integrations/supabase/client";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { RelatedPostsStatic } from "@/components/blog/RelatedPostsStatic";
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Script from 'next/script';

// Enable ISR with 5-minute revalidation
export const revalidate = 300;

// Pre-build blog post pages at build time
export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug')
    .not('published_at', 'is', null)
    .limit(100); // Build top 100 posts at build time

  return (posts || []).map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt || post.meta_description || `Read ${post.title} on Get The Gift`,
    keywords: post.seo_keywords || undefined,
    alternates: {
      canonical: `https://getthegift.ai/blog/post/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.meta_description || `Read ${post.title} on Get The Gift`,
      url: `https://getthegift.ai/blog/post/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      images: post.image_url ? [{
        url: post.image_url,
        width: 1200,
        height: 630,
        alt: post.image_alt_text || post.title,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.meta_description || `Read ${post.title} on Get The Gift`,
      images: post.image_url ? [post.image_url] : undefined,
    },
  };
}

// Cache blog post fetching
const getBlogPost = unstable_cache(
  async (slug: string) => {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !post) {
      return null;
    }

    return post;
  },
  ['blog-post'],
  {
    revalidate: 300,
    tags: ['blog-post'],
  }
);

// Cache related posts fetching
const getRelatedPosts = unstable_cache(
  async (slug: string) => {
    const { data } = await supabase
      .from("blog_posts")
      .select("title, slug, image_url, excerpt")
      .neq("slug", slug)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(3);

    return data || [];
  },
  ['related-posts'],
  {
    revalidate: 600, // Cache related posts for 10 minutes
    tags: ['related-posts'],
  }
);

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(params.slug);

  // Article Schema for SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt || post.meta_description || post.title,
    "image": post.image_url || undefined,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at || post.published_at || post.created_at,
    "author": {
      "@type": "Organization",
      "name": "Get The Gift",
      "url": "https://getthegift.ai"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Get The Gift",
      "logo": {
        "@type": "ImageObject",
        "url": "https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://getthegift.ai/blog/post/${post.slug}`
    }
  };

  return (
    <>
      {/* Article Schema */}
      <Script
        id="article-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-2 sm:px-4 py-6">
          <article className="max-w-5xl mx-auto">
            <BlogPostHeader post={post} />
            <BlogPostContent post={post} />
          </article>

          <div className="max-w-5xl mx-auto px-4">
            <RelatedPostsStatic posts={relatedPosts} />
          </div>
        </div>
      </div>
    </>
  );
}
