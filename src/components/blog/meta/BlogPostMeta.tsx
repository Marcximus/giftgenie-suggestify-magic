import { Tables } from "@/integrations/supabase/types";
import { Helmet } from "react-helmet";

interface BlogPostMetaProps {
  post: Tables<"blog_posts"> & { relatedPosts?: any[] };
}

export const BlogPostMeta = ({ post }: BlogPostMetaProps) => {
  // Extract the first affiliate link for structured data
  const firstProduct = post.affiliate_links?.[0] || null;

  // Format the date for SEO
  const publishDate = post.published_at ? new Date(post.published_at).toISOString() : "";
  const modifyDate = post.updated_at ? new Date(post.updated_at).toISOString() : publishDate;

  // Prepare product data with ratings if available
  const productData = firstProduct ? {
    "@type": "Product",
    "name": firstProduct.productTitle,
    "image": firstProduct.imageUrl,
    "url": firstProduct.affiliateLink,
    "description": firstProduct.description,
    ...(firstProduct.rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": firstProduct.rating,
        "ratingCount": firstProduct.totalRatings || 0,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  } : null;

  // Generate breadcrumb list for structured data
  const breadcrumbList = {
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

  // Construct the canonical URL
  const canonicalUrl = `https://getthegift.ai/blog/post/${post.slug}`;

  return (
    <Helmet>
      {/* Clear any existing meta tags */}
      <title>{post.meta_title || post.title} - Get The Gift Blog</title>
      <meta 
        name="description" 
        content={post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`} 
      />
      <meta name="keywords" content={post.meta_keywords || ''} />
      
      {/* Canonical URL - IMPORTANT for preventing duplicate content */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph tags */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={post.meta_title || post.title} />
      <meta 
        property="og:description" 
        content={post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`} 
      />
      {post.image_url && (
        <meta property="og:image" content={post.image_url} />
      )}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Get The Gift" />
      
      {/* Article specific metadata */}
      <meta name="author" content={post.author} />
      <meta property="article:published_time" content={publishDate} />
      <meta property="article:modified_time" content={modifyDate} />
      <meta property="article:section" content="Gift Ideas" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={post.meta_title || post.title} />
      <meta 
        name="twitter:description" 
        content={post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`} 
      />
      {post.image_url && (
        <meta name="twitter:image" content={post.image_url} />
      )}
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "image": post.image_url,
          "author": {
            "@type": "Person",
            "name": post.author
          },
          "publisher": {
            "@type": "Organization",
            "name": "Get The Gift",
            "logo": {
              "@type": "ImageObject",
              "url": "https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png"
            }
          },
          "datePublished": publishDate,
          "dateModified": modifyDate,
          "description": post.meta_description || post.excerpt,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
          },
          "breadcrumb": breadcrumbList,
          ...(productData && {
            "about": productData
          })
        })}
      </script>
    </Helmet>
  );
};