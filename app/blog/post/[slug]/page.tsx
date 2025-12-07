import { notFound } from 'next/navigation';
import { supabase } from "@/integrations/supabase/client";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { RelatedPostsStatic } from "@/components/blog/RelatedPostsStatic";
import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

// Use ISR with very long cache time - pages generated on-demand, cached forever
export const revalidate = 31536000; // 1 year cache - essentially permanent
export const dynamicParams = true; // Allow on-demand generation for any slug

// Pre-build ALL blog post pages at build time
export async function generateStaticParams() {
  console.log('[generateStaticParams] Starting to fetch blog post slugs...');

  // Try to read from the pre-generated slugs file first (created by prebuild script)
  try {
    const fs = await import('fs');
    const path = await import('path');
    const slugsPath = path.join(process.cwd(), 'app', 'blog', 'post', 'slugs.json');

    if (fs.existsSync(slugsPath)) {
      const slugsData = fs.readFileSync(slugsPath, 'utf-8');
      const slugs = JSON.parse(slugsData);
      console.log(`[generateStaticParams] Loaded ${slugs.length} slugs from slugs.json file`);
      return slugs.map((slug: string) => ({ slug }));
    }
  } catch (fileError) {
    console.log('[generateStaticParams] No slugs.json file found, fetching from Supabase...');
  }

  // Fallback to fetching from Supabase if file doesn't exist
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .not('published_at', 'is', null);

    if (error) {
      console.error('[generateStaticParams] Supabase error:', error);
      return [];
    }

    const slugs = (posts || []).map((post: any) => ({ slug: post.slug }));
    console.log(`[generateStaticParams] Fetched ${slugs.length} slugs from Supabase`);
    return slugs;
  } catch (error) {
    console.error('[generateStaticParams] Fatal error fetching blog post slugs:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  // Truncate description to 160 characters for SEO
  const description = post.excerpt || post.meta_description || `Read ${post.title} on Get The Gift`;
  const truncatedDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  return {
    title: post.title,
    description: truncatedDescription,
    keywords: post.seo_keywords || undefined,
    alternates: {
      canonical: `https://getthegift.ai/blog/post/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: truncatedDescription,
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
      description: truncatedDescription,
      images: post.image_url ? [post.image_url] : undefined,
    },
  };
}

// Fetch blog post data at build time only
async function getBlogPost(slug: string) {
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !post) {
    return null;
  }

  return post;
}

// Fetch related posts at build time only
async function getRelatedPosts(slug: string) {
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, image_url, excerpt")
    .neq("slug", slug)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(3);

  return data || [];
}

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
    ...(post.image_url && {
      "image": {
        "@type": "ImageObject",
        "url": post.image_url,
        "width": 1200,
        "height": 675
      }
    }),
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
        "url": "https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png",
        "width": 512,
        "height": 512
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://getthegift.ai/blog/post/${post.slug}`
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://getthegift.ai"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://getthegift.ai/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://getthegift.ai/blog/post/${post.slug}`
      }
    ]
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

      {/* Breadcrumb Schema */}
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-2 sm:px-4 py-6">
          {/* Breadcrumbs */}
          <nav className="max-w-5xl mx-auto mb-4 px-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">
                {post.title}
              </li>
            </ol>
          </nav>

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
