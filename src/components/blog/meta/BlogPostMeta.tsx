import { Tables } from "@/integrations/supabase/types";
import { Helmet } from "react-helmet";

interface BlogPostMetaProps {
  post: Tables<"blog_posts"> & { relatedPosts?: any[] };
}

export const BlogPostMeta = ({ post }: BlogPostMetaProps) => {
  // Extract the first affiliate link for structured data
  const firstProduct = post.affiliate_links?.[0] || null;

  return (
    <Helmet>
      <title>{post.meta_title || post.title} - Get The Gift Blog</title>
      <meta 
        name="description" 
        content={post.meta_description || post.excerpt || `Read ${post.title} on Get The Gift Blog`} 
      />
      <meta name="keywords" content={post.meta_keywords || ''} />
      <meta property="og:title" content={`${post.title} - Get The Gift Blog`} />
      <meta 
        property="og:description" 
        content={post.excerpt || `Read ${post.title} on Get The Gift Blog`} 
      />
      {post.image_url && (
        <meta property="og:image" content={post.image_url} />
      )}
      <meta name="author" content={post.author} />
      <meta property="article:published_time" content={post.published_at || ""} />
      <link rel="canonical" href={`https://getthegift.ai/blog/post/${post.slug}`} />
      
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
              "url": "/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png"
            }
          },
          "datePublished": post.published_at,
          "dateModified": post.updated_at,
          "description": post.excerpt,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://getthegift.ai/blog/post/${post.slug}`
          },
          ...(firstProduct && {
            "about": {
              "@type": "Product",
              "name": firstProduct.productTitle,
              "image": firstProduct.imageUrl,
              "url": firstProduct.affiliateLink
            }
          })
        })}
      </script>
    </Helmet>
  );
};