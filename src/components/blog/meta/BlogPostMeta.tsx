
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

  // Ensure we always have a title
  const pageTitle = post.meta_title || post.title;
  const fullTitle = `${pageTitle} - Get The Gift Blog`;

  // Ensure we always have a description
  const description = post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`;

  // Construct the canonical URL
  const canonicalUrl = `https://getthegift.ai/blog/post/${post.slug}`;

  // Prepare product data with required fields for Google rich results
  const productData = firstProduct ? {
    "@type": "Product",
    "name": firstProduct.productTitle,
    "image": firstProduct.imageUrl,
    "description": firstProduct.description,
    "url": firstProduct.affiliateLink,
    // Always include offers
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": firstProduct.price ? firstProduct.price.toString() : "0",
      "availability": "https://schema.org/InStock",
      "url": firstProduct.affiliateLink
    },
    // Include rating if available
    ...(firstProduct.rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": firstProduct.rating,
        "ratingCount": firstProduct.totalRatings || 1,
        "bestRating": "5",
        "worstRating": "1"
      }
    }),
    // Add a basic review if rating exists
    ...(firstProduct.rating && {
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": firstProduct.rating,
          "bestRating": "5",
          "worstRating": "1"
        },
        "author": {
          "@type": "Organization",
          "name": "Get The Gift"
        }
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
        "name": pageTitle,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <Helmet>
      {/* Clear any existing meta tags */}
      <title>{fullTitle}</title>
      <meta 
        name="description" 
        content={description}
      />
      <meta name="keywords" content={post.meta_keywords || ''} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph tags */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
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
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {post.image_url && (
        <meta name="twitter:image" content={post.image_url} />
      )}
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": pageTitle,
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
          "description": description,
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
