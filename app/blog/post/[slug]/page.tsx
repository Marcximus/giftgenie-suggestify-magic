import { notFound } from 'next/navigation';
import { supabase } from "@/integrations/supabase/client";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { RelatedPostsStatic } from "@/components/blog/RelatedPostsStatic";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { ProductSchema } from "@/components/seo/ProductSchema";
import { blogSchemas } from "../schemas";
import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

// Force static generation - pages built at deploy time, never revalidate
// This eliminates ISR regeneration timeouts entirely
export const revalidate = false; // Pure static - no ISR revalidation
export const dynamicParams = false; // Disable on-demand generation to prevent 502 errors

// Set a maximum runtime for serverless function (in seconds)
// Only used during build time with revalidate: false
export const maxDuration = 10; // Netlify free tier limit

// Pre-build ALL blog post pages at build time
// This function MUST return all slugs to ensure pages are pre-rendered as static HTML
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
      console.log(`✅ [generateStaticParams] Loaded ${slugs.length} slugs from slugs.json file`);
      console.log(`✅ [generateStaticParams] These ${slugs.length} pages will be pre-rendered as static HTML`);
      return slugs.map((slug: string) => ({ slug }));
    } else {
      console.error('❌ [generateStaticParams] slugs.json file NOT FOUND!');
      console.error('❌ [generateStaticParams] Prebuild script must have failed!');
      console.error('❌ [generateStaticParams] NO BLOG POSTS WILL BE PRE-RENDERED!');
    }
  } catch (fileError) {
    console.error('[generateStaticParams] Error reading slugs.json:', fileError);
  }

  // CRITICAL: If we reach here, prebuild script failed
  // Return empty array so build doesn't crash, but log clear error
  console.error('❌ [generateStaticParams] Returning empty array - NO PAGES WILL BE PRE-RENDERED');
  console.error('❌ [generateStaticParams] This will cause 502/504 errors when crawlers visit blog posts!');
  return [];
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

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

// Fetch blog post data with timeout handling
// PERFORMANCE: Only select columns actually used to reduce data transfer by ~60%
async function getBlogPost(slug: string) {
  try {
    // Add 8-second timeout to prevent serverless function timeouts
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 8000)
    );

    // CRITICAL: Only select needed columns to avoid fetching large JSON fields
    // This reduces query time from 15-28s to <1s by eliminating:
    // - affiliate_links, breadcrumb_list, images, processing_status (JSON)
    // - product_reviews, product_search_failures, related_posts (JSON)
    // - generation_attempts, last_generation_error, author, category_id, etc.
    const queryPromise = supabase
      .from("blog_posts")
      .select("title, slug, content, excerpt, meta_description, seo_keywords, image_url, image_alt_text, published_at, updated_at, created_at")
      .eq("slug", slug)
      .maybeSingle();

    const { data: post, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error || !post) {
      console.error(`[getBlogPost] Error fetching post ${slug}:`, error);
      return null;
    }

    return post;
  } catch (error) {
    console.error(`[getBlogPost] Timeout or error fetching post ${slug}:`, error);
    return null;
  }
}

// Fetch related posts with timeout handling
async function getRelatedPosts(slug: string) {
  try {
    // Add 5-second timeout for related posts query
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    );

    const queryPromise = supabase
      .from("blog_posts")
      .select("title, slug, image_url, excerpt")
      .neq("slug", slug)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(3);

    const { data } = await Promise.race([queryPromise, timeoutPromise]) as any;
    return data || [];
  } catch (error) {
    console.error(`[getRelatedPosts] Timeout or error fetching related posts for ${slug}:`, error);
    return []; // Return empty array on timeout
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug);

  // Get FAQ and Product schemas for this post (if available)
  const schemas = blogSchemas[slug] || {};

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

      {/* FAQ Schema for Rich Snippets */}
      {schemas.faqs && <FAQSchema faqs={schemas.faqs} />}

      {/* Product Schema for Rich Snippets */}
      {schemas.products && <ProductSchema products={schemas.products} />}

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
