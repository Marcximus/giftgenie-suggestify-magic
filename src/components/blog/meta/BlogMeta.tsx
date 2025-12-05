import { Helmet } from "react-helmet";

export const BlogMeta = () => {
  const canonicalUrl = "https://getthegift.ai/blog";
  const title = "Gift Ideas Blog | Get The Gift - Expert Gift Guides & Reviews";
  const description = "Discover thoughtful gift ideas, buying guides, and recommendations for any occasion. Expert advice to help you find the perfect present with real product reviews.";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Keywords */}
      <meta name="keywords" content="gift guides, gift ideas blog, present recommendations, gift inspiration, holiday gifts, birthday gifts, gift reviews" />
      
      {/* Open Graph tags */}
      <meta property="og:type" content="blog" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content="https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png" />
      <meta property="og:site_name" content="Get The Gift" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png" />
      
      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Get The Gift Team" />
      
      {/* Schema.org Blog structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Get The Gift Blog",
          "description": description,
          "url": canonicalUrl,
          "publisher": {
            "@type": "Organization",
            "name": "Get The Gift",
            "logo": {
              "@type": "ImageObject",
              "url": "https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png"
            }
          }
        })}
      </script>
      
      {/* Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
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
              "item": canonicalUrl
            }
          ]
        })}
      </script>
    </Helmet>
  );
};