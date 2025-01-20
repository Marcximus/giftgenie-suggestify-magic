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

  return (
    <Helmet>
      <title>{post.meta_title || post.title} - Get The Gift Blog</title>
      <meta 
        name="description" 
        content={post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`} 
      />
      <meta name="keywords" content={post.meta_keywords || ''} />
      
      {/* Open Graph tags */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={`${post.title} - Get The Gift Blog`} />
      <meta 
        property="og:description" 
        content={post.excerpt || `Read ${post.title} on Get The Gift Blog`} 
      />
      {post.image_url && (
        <meta property="og:image" content={post.image_url} />
      )}
      <meta property="og:url" content={`https://getthegift.ai/blog/post/${post.slug}`} />
      <meta property="og:site_name" content="Get The Gift" />
      
      {/* Article specific metadata */}
      <meta name="author" content={post.author} />
      <meta property="article:published_time" content={publishDate} />
      <meta property="article:modified_time" content={modifyDate} />
      <meta property="article:section" content="Gift Ideas" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={post.meta_title || post.title} />
      <meta name="twitter:description" content={post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`} />
      {post.image_url && (
        <meta name="twitter:image" content={post.image_url} />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={`https://getthegift.ai/blog/post/${post.slug}`} />
      
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
            "@id": `https://getthegift.ai/blog/post/${post.slug}`
          },
          ...(firstProduct && {
            "about": {
              "@type": "Product",
              "name": firstProduct.productTitle,
              "image": firstProduct.imageUrl,
              "url": firstProduct.affiliateLink,
              "description": firstProduct.description
            }
          })
        })}
      </script>
    </Helmet>
  );
};