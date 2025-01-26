import { Helmet } from "react-helmet";

export const BlogMeta = () => {
  const canonicalUrl = "https://getthegift.ai/blog";
  const title = "Gift Ideas Blog - Get The Gift";
  const description = "Discover thoughtful gift ideas, buying guides, and recommendations for any occasion. Expert advice to help you find the perfect present.";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Get The Gift" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Get The Gift Team" />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": title,
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
    </Helmet>
  );
};